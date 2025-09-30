import 'reflect-metadata';
import { ConfirmSignUp } from '../../../../application/use-cases/auth/ConfirmSignUp';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IOrgProfileRepository } from '../../../../domain/repositories/IOrgProfileRepository';
import { IAgencyJoinCodesRepository } from '../../../../domain/repositories/IAgencyJoinCodesRepository';
import { User } from '../../../../domain/entities/User';
import { OrgProfile } from '../../../../domain/entities/OrgProfile';
import { 
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');

// Mocks
const mockUserRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByEmail: jest.fn(),
  findByUserTypeId: jest.fn(),
  updateStatus: jest.fn(),
};

const mockOrgProfileRepository: jest.Mocked<IOrgProfileRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
};

const mockAgencyJoinCodesRepository: jest.Mocked<IAgencyJoinCodesRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByOrgProfileId: jest.fn(),
  findByJoinCode: jest.fn(),
};

const mockCognitoClient = {
  send: jest.fn()
};

// Mock CognitoIdentityProviderClient constructor
(CognitoIdentityProviderClient as jest.MockedClass<typeof CognitoIdentityProviderClient>).mockImplementation(() => mockCognitoClient as any);

describe('ConfirmSignUp Use Case', () => {
  let confirmSignUp: ConfirmSignUp;

  beforeEach(() => {
    jest.clearAllMocks();
    
    confirmSignUp = new ConfirmSignUp(
      mockUserRepository,
      mockOrgProfileRepository,
      mockAgencyJoinCodesRepository
    );

    // Set up environment variables
    process.env.COGNITO_PORTAL_CLIENT_ID = 'test-client-id';
    process.env.COGNITO_REGION = 'us-east-1';
  });

  describe('execute', () => {
    const mockConfirmData = {
      email: 'test@example.com',
      code: '123456',
      flow: 'signup',
      userTypeId: 'PROPERTY_OWNER'
    };


    it('should successfully confirm signup for regular user', async () => {
      // Mock user exists and is unconfirmed
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock Cognito responses
      mockCognitoClient.send
        .mockResolvedValueOnce({}) // ConfirmSignUpCommand

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario confirmado exitosamente. Puedes proceder a iniciar sesión.');

      // Verify user status updated
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-id', {
        status: 'confirmed',
        updatedAt: expect.any(String)
      });

    });

    it('should successfully confirm signup for real-estate user and generate AgencyJoinCode', async () => {
      // Mock real-estate user
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'REAL_ESTATE', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock OrgProfile
      const mockOrgProfile = new OrgProfile('org-id', 'user-id', 'Test Real Estate');
      mockOrgProfileRepository.findByUserId.mockResolvedValue(mockOrgProfile);
      
      // Mock Cognito responses
      mockCognitoClient.send
        .mockResolvedValueOnce({}) // ConfirmSignUpCommand

      const result = await confirmSignUp.execute({ ...mockConfirmData, userTypeId: 'REAL_ESTATE' });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario confirmado exitosamente. Puedes proceder a iniciar sesión.');

      // Verify AgencyJoinCode was created
      expect(mockAgencyJoinCodesRepository.save).toHaveBeenCalled();
      const agencyJoinCodeCall = mockAgencyJoinCodesRepository.save.mock.calls[0][0];
      expect(agencyJoinCodeCall.orgProfileId).toBe('org-id');
      expect(agencyJoinCodeCall.type).toBe('multi-use');
      expect(agencyJoinCodeCall.maxUses).toBe(3);
      
      // Verify expiration is 2 years from now
      expect(agencyJoinCodeCall.expiresAt).toBeDefined();
      const expirationDate = new Date(agencyJoinCodeCall.expiresAt!);
      const expectedDate = new Date();
      expectedDate.setFullYear(expectedDate.getFullYear() + 2);
      expect(expirationDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    it('should return error if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario no encontrado');
    });

    it('should return error if user is already confirmed', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'confirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario ya está confirmado');
    });


    it('should return error for invalid email format', async () => {
      const invalidEmailData = {
        ...mockConfirmData,
        email: 'invalid-email'
      };

      const result = await confirmSignUp.execute(invalidEmailData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Formato de email inválido');
    });

    it('should return error for invalid flow', async () => {
      const invalidFlowData = {
        ...mockConfirmData,
        flow: 'invalid-flow'
      };

      const result = await confirmSignUp.execute(invalidFlowData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Flow no válido, debe ser \'signup\'');
    });

    it('should handle Cognito CodeMismatchException', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const cognitoError = new Error('Code mismatch');
      cognitoError.name = 'CodeMismatchException';
      mockCognitoClient.send.mockRejectedValue(cognitoError);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Código OTP inválido');
    });

    it('should handle Cognito ExpiredCodeException', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const cognitoError = new Error('Code expired');
      cognitoError.name = 'ExpiredCodeException';
      mockCognitoClient.send.mockRejectedValue(cognitoError);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Código OTP expirado');
    });

    it('should handle user already confirmed in Cognito and sync with database', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const error = new Error('User cannot be confirmed. Current status is CONFIRMED');
      error.name = 'NotAuthorizedException';
      
      // ConfirmSignUpCommand throws error for already confirmed user
      mockCognitoClient.send.mockRejectedValueOnce(error);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario confirmado exitosamente. Puedes proceder a iniciar sesión.');
      
      // Verify user status was updated in database
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-id', {
        status: 'confirmed',
        updatedAt: expect.any(String)
      });
    });

    it('should handle generic Cognito errors', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const cognitoError = new Error('Generic Cognito error');
      mockCognitoClient.send.mockRejectedValue(cognitoError);

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Error interno del servidor');
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // missing code and flow
      };

      const result = await confirmSignUp.execute(incompleteData as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Email, código, flow y userTypeId son requeridos');
    });

    it('should confirm user without creating session', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      mockCognitoClient.send
        .mockResolvedValueOnce({}) // ConfirmSignUpCommand

      const result = await confirmSignUp.execute(mockConfirmData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario confirmado exitosamente. Puedes proceder a iniciar sesión.');
    });
  });
});
