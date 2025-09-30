import { IResponse, ResponseService } from "serverless-request-manager";
import { inject, injectable } from "tsyringe";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType
} from "@aws-sdk/client-cognito-identity-provider";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ISessionsRepository } from "../../../domain/repositories/ISessionsRepository";
import { Sessions } from "../../../domain/entities/Sessions";
import * as crypto from 'crypto';

interface SignInRequest {
  email: string;
  password: string;
}

interface SignInHeaders {
  appVersion?: string;
  platform?: string;
  ip?: string;
  geo?: any;
}

@injectable()
export class SignIn {
  private cognitoClient: CognitoIdentityProviderClient;
  private responseService: ResponseService;

  constructor(
    @inject("IUserRepository")
    private userRepository: IUserRepository,
    @inject("ISessionsRepository")
    private sessionsRepository: ISessionsRepository
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION || 'us-east-1'
    });
    this.responseService = new ResponseService();
  }

  async execute(signInData: SignInRequest, headers: SignInHeaders): Promise<IResponse> {
    try {
      // 1. Validar entrada
      const validationError = this.validateInput(signInData);
      if (validationError) {
        return this.responseService.responseBadRequest({ data: validationError });
      }

      // 2. Buscar usuario en nuestra BD
      const user = await this.userRepository.findByEmail(signInData.email);
      if (!user) {
        return this.responseService.responseBadRequest({ data: "Usuario no encontrado" });
      }

      // 3. Verificar que el usuario esté confirmado
      if (user.status !== 'confirmed') {
        return this.responseService.responseBadRequest({ data: "Usuario no confirmado. Por favor, confirma tu cuenta primero." });
      }

      // 4. Autenticar en Cognito
      const tokens = await this.authenticateWithCognito(signInData.email, signInData.password);

      // 5. Crear sesión
      await this.createSession(user.id, headers);

      // 6. Respuesta exitosa con tokens
      return this.responseService.responseSuccess({
        data: tokens,
        code: "PROCESS_OK"
      });

    } catch (error: any) {
      console.error('Error en SignIn:', error);
      
      // Manejo específico de errores de Cognito
      if (error.name === 'NotAuthorizedException') {
        return this.responseService.responseBadRequest({ data: "Credenciales inválidas" });
      }
      if (error.name === 'UserNotConfirmedException') {
        return this.responseService.responseBadRequest({ data: "Usuario no confirmado. Por favor, confirma tu cuenta primero." });
      }
      if (error.name === 'UserNotFoundException') {
        return this.responseService.responseBadRequest({ data: "Usuario no encontrado" });
      }
      if (error.name === 'TooManyRequestsException') {
        return this.responseService.responseBadRequest({ data: "Demasiados intentos. Inténtalo más tarde." });
      }

      return this.responseService.responseInternalError({ data: "Error interno del servidor" });
    }
  }

  private validateInput(signInData: SignInRequest): string | null {
    if (!signInData.email || !signInData.password) {
      return "Email y contraseña son requeridos";
    }

    if (!this.isValidEmail(signInData.email)) {
      return "Formato de email inválido";
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async authenticateWithCognito(email: string, password: string): Promise<any> {
    const userPoolId = process.env.COGNITO_PORTAL_USER_POOL_ID;
    const clientId = process.env.COGNITO_PORTAL_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error('Configuración de Cognito incompleta');
    }

    // Usar USER_PASSWORD_AUTH que está habilitado y es más directo
    try {
      const command = new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });

      const response = await this.cognitoClient.send(command);
      return this.processAuthenticationResult(response);
    } catch (error: any) {
      console.log('Error en USER_PASSWORD_AUTH:', error.name, error.message);
      
      // Si USER_PASSWORD_AUTH falla, intentar con USER_SRP_AUTH como fallback
      if (error.name === 'InvalidParameterException' && 
          (error.message?.includes('Auth flow not enabled') || 
           error.message?.includes('USER_PASSWORD_AUTH flow not enabled') ||
           error.message?.includes('flow not enabled for this client'))) {
        console.log('USER_PASSWORD_AUTH no habilitado, intentando con USER_SRP_AUTH...');
        return await this.trySrpAuth(clientId, email, password);
      }
      
      // Re-lanzar otros errores
      throw error;
    }
  }

  private async trySrpAuth(clientId: string, email: string, password: string): Promise<any> {
    console.log('Intentando USER_SRP_AUTH como fallback...');
    console.log('NOTA: SRP requiere implementación específica del protocolo. Considerando usar biblioteca como amazon-cognito-identity-js');
    
    // Por ahora, lanzamos error indicando que SRP requiere implementación específica
    throw new Error('USER_SRP_AUTH requiere implementación del protocolo SRP. Use USER_PASSWORD_AUTH o implemente SRP correctamente.');
  }

  private processAuthenticationResult(response: any): any {
    if (!response.AuthenticationResult) {
      throw new Error('No se pudieron obtener tokens de autenticación');
    }

    const authResult = response.AuthenticationResult;
    
    // Calcular fecha de expiración
    const expiresIn = authResult.ExpiresIn || 3600; // Default 1 hora
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

    return {
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      idToken: authResult.IdToken,
      expiration: expirationDate.toISOString()
    };
  }

  private async createSession(userId: string, headers: SignInHeaders): Promise<Sessions> {
    const session = new Sessions(
      crypto.randomUUID(),
      userId,
      new Date().toISOString(),
      headers.appVersion || 'unknown',
      headers.platform || 'unknown',
      headers.ip || 'unknown',
      JSON.stringify(headers.geo || {})
    );

    return await this.sessionsRepository.save(session);
  }
}
