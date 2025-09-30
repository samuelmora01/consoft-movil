import { IResponse } from "serverless-request-manager";
import { inject, injectable } from "tsyringe";
import { CognitoIdentityProviderClient, SignUpCommand, AdminGetUserCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IUserTypesRepository } from "../../../domain/repositories/IUserTypesRepository";
import { IPersonProfileRepository } from "../../../domain/repositories/IPersonProfileRepository";
import { IOrgProfileRepository } from "../../../domain/repositories/IOrgProfileRepository";
import { IDocumentsRepository } from "../../../domain/repositories/IDocumentsRepository";
import { IDocumentTypesRepository } from "../../../domain/repositories/IDocumentTypesRepository";
import { IRolesRepository } from "../../../domain/repositories/IRolesRepository";
import { IUserRolesRepository } from "../../../domain/repositories/IUserRolesRepository";
import { ISessionsRepository } from "../../../domain/repositories/ISessionsRepository";
import { User } from "../../../domain/entities/User";
import { PersonProfile } from "../../../domain/entities/PersonProfile";
import { OrgProfile } from "../../../domain/entities/OrgProfile";
import { Documents } from "../../../domain/entities/Documents";
import { UserRoles } from "../../../domain/entities/UserRoles";
import { ResponseService } from "serverless-request-manager";

interface SignUpRequest {
  userTypeId: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  orgName?: string;
  document: {
    documentTypeId: string;
    documentNumber: string;
    dv?: number;
  };
}

@injectable()
export class SignUp {
  private cognitoClient: CognitoIdentityProviderClient;
  private responseService: ResponseService;

  constructor(
    @inject("IUserRepository")
    private userRepository: IUserRepository,
    @inject("IUserTypesRepository")
    private userTypesRepository: IUserTypesRepository,
    @inject("IPersonProfileRepository")
    private personProfileRepository: IPersonProfileRepository,
    @inject("IOrgProfileRepository")
    private orgProfileRepository: IOrgProfileRepository,
    @inject("IDocumentsRepository")
    private documentsRepository: IDocumentsRepository,
    @inject("IDocumentTypesRepository")
    private documentTypesRepository: IDocumentTypesRepository,
    @inject("IRolesRepository")
    private rolesRepository: IRolesRepository,
    @inject("IUserRolesRepository")
    private userRolesRepository: IUserRolesRepository,
    @inject("ISessionsRepository")
    private sessionsRepository: ISessionsRepository
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION || 'us-east-1'
    });
    this.responseService = new ResponseService();
  }

  async execute(signUpData: SignUpRequest): Promise<IResponse> {
    try {
      // 1. Validaciones básicas
      const validationError = this.validateInput(signUpData);
      if (validationError) {
        return this.responseService.responseBadRequest({ data: validationError });
      }

      // 2. Verificar que el userType existe y obtener su código
      const userType = await this.userTypesRepository.findById(signUpData.userTypeId);
      if (!userType) {
        return this.responseService.responseBadRequest({ data: "Tipo de usuario no válido" });
      }

      // 3. Verificar estado del email - permitir reintento si está UNCONFIRMED
      const existingUser = await this.userRepository.findByEmail(signUpData.email);
      if (existingUser && existingUser.status === 'confirmed') {
        return this.responseService.responseBadRequest({ data: "El correo electrónico ya está registrado y confirmado" });
      }
      
      // Si existe un usuario unconfirmed, lo eliminaremos y crearemos uno nuevo
      const isReAttempt = existingUser && existingUser.status === 'unconfirmed';
      if (isReAttempt) {
        await this.overwriteUnconfirmedUser(existingUser.id, signUpData);
        
        // Reenviar código OTP
        await this.resendOTPCode(signUpData.email);
        
        return this.responseService.responseSuccess({
          data: "Código OTP reenviado, pendiente de confirmación",
          code: "PROCESS_OK"
        });
      }

      // 4. Verificar que el documento no esté registrado
      const existingDocument = await this.documentsRepository.findByDocumentNumber(
        signUpData.document.documentTypeId,
        signUpData.document.documentNumber
      );
      if (existingDocument) {
        return this.responseService.responseBadRequest({ data: "El documento ya está registrado" });
      }

      // 5. Registro en Cognito (o verificar si ya existe)
      const userId = crypto.randomUUID();
      const userExistsInCognito = await this.checkUserExistsInCognito(signUpData.email);
      
      if (userExistsInCognito) {
        await this.resendOTPCode(signUpData.email);
      } else {
        await this.registerInCognito(signUpData.email, signUpData.password, userId);
      }

      // 6. Crear usuario en base de datos
      const user = new User(
        userId,
        signUpData.email,
        'unconfirmed',
        signUpData.userTypeId,
        '170' // Colombia por defecto
      );
      await this.userRepository.save(user);

      // 7. Crear perfil según tipo de usuario
      if (userType.id === 'REAL_ESTATE') {
        await this.createOrgProfile(userId, signUpData.orgName!);
      } else {
        await this.createPersonProfile(userId, signUpData.firstName!, signUpData.lastName!, signUpData.birthDate);
      }

      // 8. Crear documento
      await this.createDocument(userId, signUpData.document);

      // 9. Asignar rol por defecto al usuario
      await this.assignDefaultRole(userId, userType.id);

      // 10. Responder éxito sin tokens (todos los tipos requieren confirmación OTP)
      return this.responseService.responseSuccess({
        data: "Usuario registrado, pendiente de confirmación",
        code: "PROCESS_OK"
      });

    } catch (error) {
      console.error('Error in SignUp use case:', error);
      return this.responseService.responseInternalError({ data: "Error interno del servidor" });
    }
  }

  private validateInput(signUpData: SignUpRequest): string | null {
    if (!signUpData.email || !signUpData.password || !signUpData.userTypeId) {
      return "Email, contraseña y tipo de usuario son requeridos";
    }

    if (!signUpData.document?.documentTypeId || !signUpData.document?.documentNumber) {
      return "Información del documento es requerida";
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpData.email)) {
      return "Formato de email inválido";
    }

    return null;
  }

  private async registerInCognito(email: string, password: string, userId: string): Promise<void> {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_PORTAL_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        }
      ]
    });

    await this.cognitoClient.send(command);
  }

  private async createPersonProfile(
    userId: string,
    firstName: string,
    lastName: string,
    birthDate?: string
  ): Promise<void> {
    const profile = new PersonProfile(
      crypto.randomUUID(),
      userId,
      firstName,
      lastName,
      false, // hasOrgMembership
      birthDate
    );

    await this.personProfileRepository.save(profile);
  }

  private async createOrgProfile(userId: string, orgName: string): Promise<void> {
    const profile = new OrgProfile(
      crypto.randomUUID(),
      userId,
      orgName
    );

    await this.orgProfileRepository.save(profile);
  }

  private async createDocument(
    userId: string,
    document: { documentTypeId: string; documentNumber: string; dv?: number }
  ): Promise<void> {
    // Obtener el DocumentType para conocer qué atributos debe tener
    const documentType = await this.documentTypesRepository.findById(document.documentTypeId);
    if (!documentType) {
      throw new Error(`Tipo de documento no encontrado: ${document.documentTypeId}`);
    }

    // Construir el objeto details dinámicamente basado en los attributes del DocumentType
    const details: Record<string, any> = {};

    // Mapear los valores enviados a los atributos permitidos
    for (const attribute of documentType.attributes) {
      switch (attribute) {
        case 'documentNumber':
          details.documentNumber = document.documentNumber;
          break;
        case 'dv':
          if (document.dv !== undefined) {
            details.dv = document.dv;
          }
          break;
        default:
          console.warn(`Atributo no manejado en documento: ${attribute}`);
          break;
      }
    }

    const documentEntity = new Documents(
      crypto.randomUUID(),
      userId,
      document.documentTypeId,
      details
    );

    await this.documentsRepository.save(documentEntity);
  }

  private getUserTypeToRoleCodeMapping(): Record<string, string> {
    return {
      'PROPERTY_OWNER': 'ROLE_PROPERTY_OWNER',
      'PROSPECT': 'ROLE_PROSPECT', 
      'INDEPENDENT_AGENT': 'ROLE_INDEPENDENT_AGENT',
      'REAL_ESTATE': 'ROLE_REAL_ESTATE'
    };
  }

  private async assignDefaultRole(userId: string, userTypeId: string): Promise<void> {
    const roleMapping = this.getUserTypeToRoleCodeMapping();
    const roleCode = roleMapping[userTypeId];
    
    if (!roleCode) {
      console.warn(`No hay mapeo de rol para el userType: ${userTypeId}`);
      return;
    }

    // Buscar el rol por code usando el GSI
    const role = await this.rolesRepository.findByCode(roleCode);
    if (!role) {
      throw new Error(`Rol no encontrado para el código: ${roleCode}`);
    }

    // Crear la asociación UserRoles
    const userRole = new UserRoles(
      crypto.randomUUID(),
      userId,
      role.id
    );

    await this.userRolesRepository.save(userRole);
  }

  private async checkUserExistsInCognito(email: string): Promise<boolean> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_PORTAL_USER_POOL_ID!,
        Username: email
      });
      await this.cognitoClient.send(command);
      return true; // Usuario existe
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return false; // Usuario no existe
      }
      console.warn(`Error verificando usuario en Cognito: ${error.message}`);
      return false; // En caso de error, asumimos que no existe
    }
  }

  private async resendOTPCode(email: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: process.env.COGNITO_PORTAL_CLIENT_ID!,
        Username: email
      });
      await this.cognitoClient.send(command);
    } catch (error: any) {
      console.error(`Error reenviando OTP: ${error.message}`);
      throw error;
    }
  }

  private async overwriteUnconfirmedUser(userId: string, signUpData: SignUpRequest): Promise<void> {
    try {
      // 1. Actualizar información del usuario usando update en lugar de save
      await this.userRepository.update(userId, {
        email: signUpData.email,
        status: 'unconfirmed',
        userTypeId: signUpData.userTypeId,
        updatedAt: new Date().toISOString()
      });

      // 2. Limpiar y recrear perfil según tipo de usuario
      await this.cleanupAndRecreateProfile(userId, signUpData);

      // 3. Limpiar y recrear documento
      await this.cleanupAndRecreateDocument(userId, signUpData.document);

      // 4. Limpiar y recrear rol de usuario
      await this.cleanupAndRecreateUserRole(userId, signUpData.userTypeId);
      
    } catch (error) {
      console.error(`Error sobreescribiendo datos:`, error);
      throw error;
    }
  }

  private async cleanupAndRecreateProfile(userId: string, signUpData: SignUpRequest): Promise<void> {
    try {
      // Eliminar perfiles existentes usando GSI por userId
      const existingPersonProfile = await this.personProfileRepository.findByUserId(userId);
      const existingOrgProfile = await this.orgProfileRepository.findByUserId(userId);

      if (existingPersonProfile) {
        await this.personProfileRepository.delete(existingPersonProfile.id);
      }
      
      if (existingOrgProfile) {
        await this.orgProfileRepository.delete(existingOrgProfile.id);
      }

      // Crear nuevo perfil
      const userType = await this.userTypesRepository.findById(signUpData.userTypeId);
      if (userType?.id === 'REAL_ESTATE') {
        await this.createOrgProfile(userId, signUpData.orgName!);
      } else {
        await this.createPersonProfile(userId, signUpData.firstName!, signUpData.lastName!, signUpData.birthDate);
      }
    } catch (error) {
      console.warn(`Error en cleanup de profiles: ${error}`);
    }
  }

  private async cleanupAndRecreateDocument(userId: string, document: { documentTypeId: string; documentNumber: string; dv?: number }): Promise<void> {
    try {
      // Eliminar documentos existentes
      const existingDocuments = await this.documentsRepository.findByUserId(userId);
      
      for (const doc of existingDocuments) {
        await this.documentsRepository.delete(doc.id);
      }

      // Crear nuevo documento
      await this.createDocument(userId, document);
      
    } catch (error) {
      console.error(`Error en cleanup de documentos:`, error);
      throw error;
    }
  }

  private async cleanupAndRecreateUserRole(userId: string, userTypeId: string): Promise<void> {
    try {
      // Eliminar roles existentes usando GSI por userId
      const existingUserRoles = await this.userRolesRepository.findByUserId(userId);
      
      for (const userRole of existingUserRoles) {
        await this.userRolesRepository.delete(userRole.id);
      }

      // Crear nuevo rol
      await this.assignDefaultRole(userId, userTypeId);
    } catch (error) {
      console.warn(`Error en cleanup de roles: ${error}`);
    }
  }

}
