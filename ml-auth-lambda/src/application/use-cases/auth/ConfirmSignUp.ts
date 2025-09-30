import { IResponse, ResponseService } from "serverless-request-manager";
import { inject, injectable } from "tsyringe";
import { 
  CognitoIdentityProviderClient, 
  ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IOrgProfileRepository } from "../../../domain/repositories/IOrgProfileRepository";
import { IAgencyJoinCodesRepository } from "../../../domain/repositories/IAgencyJoinCodesRepository";
import { AgencyJoinCodes } from "../../../domain/entities/AgencyJoinCodes";
import * as crypto from 'crypto';

interface ConfirmSignUpRequest {
  email: string;
  code: string;
  flow: string;
  userTypeId: string;
}


@injectable()
export class ConfirmSignUp {
  private cognitoClient: CognitoIdentityProviderClient;
  private responseService: ResponseService;

  constructor(
    @inject("IUserRepository")
    private userRepository: IUserRepository,
    @inject("IOrgProfileRepository")
    private orgProfileRepository: IOrgProfileRepository,
    @inject("IAgencyJoinCodesRepository")
    private agencyJoinCodesRepository: IAgencyJoinCodesRepository
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION || 'us-east-1'
    });
    this.responseService = new ResponseService();
  }

  async execute(confirmData: ConfirmSignUpRequest): Promise<IResponse> {
    try {
      // 1. Validaciones básicas
      const validationError = this.validateInput(confirmData);
      if (validationError) {
        return this.responseService.responseBadRequest({ data: validationError });
      }

      // 2. Verificar que el usuario existe en BD y está unconfirmed
      const user = await this.userRepository.findByEmail(confirmData.email);
      if (!user) {
        return this.responseService.responseBadRequest({ data: "Usuario no encontrado" });
      }

      if (user.status === 'confirmed') {
        return this.responseService.responseBadRequest({ data: "Usuario ya está confirmado" });
      }

      // 3. Confirmar OTP en Cognito
      try {
        await this.confirmOTPInCognito(confirmData.email, confirmData.code);
      } catch (cognitoError: any) {
        // Si el usuario ya está confirmado en Cognito pero no en nuestra BD, sincronizamos
        if (cognitoError.name === 'NotAuthorizedException' && 
            cognitoError.message && 
            cognitoError.message.includes('Current status is CONFIRMED')) {
          
          // Continuamos con la lógica para actualizar la BD y generar tokens si es necesario
        } else {
          // Re-lanzar otros errores de Cognito para que sean manejados en el catch principal
          throw cognitoError;
        }
      }

      // 4. Solo confirmamos - sin generar tokens

      // 5. Actualizar estado del usuario en BD
      await this.userRepository.update(user.id, {
        status: 'confirmed',
        updatedAt: new Date().toISOString()
      });

      // 6. Las sesiones se crearán en el signin

      // 7. Generar AgencyJoinCode para usuarios real-estate
      if (confirmData.flow === 'signup' && confirmData.userTypeId === 'REAL_ESTATE') {
        await this.generateAgencyJoinCode(user.id);
      }

      // 8. Respuesta de confirmación exitosa
      return this.responseService.responseSuccess({
        data: "Usuario confirmado exitosamente. Puedes proceder a iniciar sesión.",
        code: "PROCESS_OK"
      });

    } catch (error: any) {
      console.error('Error in ConfirmSignUp use case:', error);
      
      // Manejar errores específicos de Cognito
      if (error.name === 'CodeMismatchException') {
        return this.responseService.responseBadRequest({ data: "Código OTP inválido" });
      }
      
      if (error.name === 'ExpiredCodeException') {
        return this.responseService.responseBadRequest({ data: "Código OTP expirado" });
      }

      if (error.name === 'NotAuthorizedException') {
        // Verificar si el mensaje específico indica que el usuario ya está confirmado
        if (error.message && error.message.includes('Current status is CONFIRMED')) {
          return this.responseService.responseBadRequest({ data: "El usuario ya está confirmado" });
        }
        return this.responseService.responseBadRequest({ data: "Usuario ya confirmado o código inválido" });
      }

      return this.responseService.responseInternalError({ data: "Error interno del servidor" });
    }
  }

  private validateInput(confirmData: ConfirmSignUpRequest): string | null {
    if (!confirmData.email || !confirmData.code || !confirmData.flow || !confirmData.userTypeId) {
      return "Email, código, flow y userTypeId son requeridos";
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(confirmData.email)) {
      return "Formato de email inválido";
    }

    // Validar que flow sea válido
    if (confirmData.flow !== 'signup') {
      return "Flow no válido, debe ser 'signup'";
    }


    return null;
  }

  private async confirmOTPInCognito(email: string, code: string): Promise<void> {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_PORTAL_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code
    });

    await this.cognitoClient.send(command);
  }

  private async generateAgencyJoinCode(userId: string): Promise<void> {
    try {
      // Buscar el OrgProfile asociado al usuario usando GSI UserIdIndex
      const orgProfile = await this.orgProfileRepository.findByUserId(userId);
      
      if (!orgProfile) {
        console.warn(`No se encontró OrgProfile para el usuario: ${userId}`);
        return;
      }

      // Generar joinCode aleatorio de 6 caracteres (A-Z, 0-9)
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const joinCode = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

      // Crear AgencyJoinCode con expiración en 2 años
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 2);
      
      const agencyJoinCode = new AgencyJoinCodes(
        crypto.randomUUID(),
        orgProfile.id,
        joinCode,
        'multi-use',
        userId, // createdBy
        {
          title: `Código ${orgProfile.orgName}`,
          maxUses: 3,
          expiresAt: expirationDate.toISOString()
        }
      );

      await this.agencyJoinCodesRepository.save(agencyJoinCode);
    } catch (error) {
      console.error('Error generando AgencyJoinCode:', error);
    }
  }
}
