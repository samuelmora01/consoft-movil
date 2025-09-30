import 'reflect-metadata';
import { SignIn } from '../../../../application/use-cases/auth/SignIn';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { ISessionsRepository } from '../../../../domain/repositories/ISessionsRepository';
import { User } from '../../../../domain/entities/User';
import { Sessions } from '../../../../domain/entities/Sessions';
import { 
  CognitoIdentityProviderClient,
  InitiateAuthCommand
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

const mockSessionsRepository: jest.Mocked<ISessionsRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

const mockCognitoClient = {
  send: jest.fn()
};

// Mock CognitoIdentityProviderClient constructor
(CognitoIdentityProviderClient as jest.MockedClass<typeof CognitoIdentityProviderClient>).mockImplementation(() => mockCognitoClient as any);

describe('SignIn Use Case', () => {
  let signIn: SignIn;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.COGNITO_PORTAL_USER_POOL_ID = 'test-user-pool-id';
    process.env.COGNITO_PORTAL_CLIENT_ID = 'test-client-id';
    process.env.COGNITO_REGION = 'us-east-1';

    signIn = new SignIn(
      mockUserRepository,
      mockSessionsRepository
    );
  });

  const mockSignInData = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockHeaders = {
    appVersion: '1.0.0',
    platform: 'web',
    ip: '192.168.1.1',
    geo: { country: 'CO', city: 'Bogotá' }
  };

  const mockCognitoResponse = {
    AuthenticationResult: {
      AccessToken: 'mock-access-token',
      RefreshToken: 'mock-refresh-token',
      IdToken: 'mock-id-token',
      ExpiresIn: 3600
    }
  };

  describe('Successful SignIn', () => {
    it('should successfully sign in user and create session', async () => {
      // Arrange
      const mockUser = new User('user-id', 'test@example.com', 'confirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const mockSession = new Sessions(
        'session-id',
        'user-id',
        new Date().toISOString(),
        '1.0.0',
        'web',
        '192.168.1.1',
        JSON.stringify({ country: 'CO', city: 'Bogotá' })
      );
      mockSessionsRepository.save.mockResolvedValue(mockSession);

      mockCognitoClient.send.mockResolvedValue(mockCognitoResponse);

      // Act
      const result = await signIn.execute(mockSignInData, mockHeaders);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.data).toHaveProperty('accessToken', 'mock-access-token');
      expect(body.data).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(body.data).toHaveProperty('idToken', 'mock-id-token');
      expect(body.data).toHaveProperty('expiration');

      // Verify user lookup
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');

      // Verify Cognito authentication
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(InitiateAuthCommand)
      );

      // Verify session creation
      expect(mockSessionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          appVersion: '1.0.0',
          platform: 'web',
          ip: '192.168.1.1',
          geo: JSON.stringify({ country: 'CO', city: 'Bogotá' })
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should return error if email is missing', async () => {
      const invalidData = { email: '', password: 'password123' };

      const result = await signIn.execute(invalidData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Email y contraseña son requeridos');
    });

    it('should return error if password is missing', async () => {
      const invalidData = { email: 'test@example.com', password: '' };

      const result = await signIn.execute(invalidData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Email y contraseña son requeridos');
    });

    it('should return error if email format is invalid', async () => {
      const invalidData = { email: 'invalid-email', password: 'password123' };

      const result = await signIn.execute(invalidData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Formato de email inválido');
    });
  });

  describe('User Not Found', () => {
    it('should return error if user does not exist in database', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario no encontrado');
    });
  });

  describe('User Not Confirmed', () => {
    it('should return error if user is not confirmed', async () => {
      const unconfirmedUser = new User('user-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(unconfirmedUser);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario no confirmado. Por favor, confirma tu cuenta primero.');
    });
  });

  describe('Cognito Authentication Errors', () => {
    beforeEach(() => {
      const mockUser = new User('user-id', 'test@example.com', 'confirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    });

    it('should handle NotAuthorizedException (invalid credentials)', async () => {
      const error = new Error('Incorrect username or password.');
      error.name = 'NotAuthorizedException';
      mockCognitoClient.send.mockRejectedValue(error);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Credenciales inválidas');
    });

    it('should handle UserNotConfirmedException', async () => {
      const error = new Error('User is not confirmed.');
      error.name = 'UserNotConfirmedException';
      mockCognitoClient.send.mockRejectedValue(error);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario no confirmado. Por favor, confirma tu cuenta primero.');
    });

    it('should handle UserNotFoundException', async () => {
      const error = new Error('User does not exist.');
      error.name = 'UserNotFoundException';
      mockCognitoClient.send.mockRejectedValue(error);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Usuario no encontrado');
    });

    it('should handle TooManyRequestsException', async () => {
      const error = new Error('Too many requests.');
      error.name = 'TooManyRequestsException';
      mockCognitoClient.send.mockRejectedValue(error);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Demasiados intentos. Inténtalo más tarde.');
    });

    it('should handle generic Cognito errors', async () => {
      const error = new Error('Generic AWS error');
      error.name = 'GenericException';
      mockCognitoClient.send.mockRejectedValue(error);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Error interno del servidor');
    });
  });

  describe('Session Creation', () => {
    it('should handle missing headers gracefully', async () => {
      const mockUser = new User('user-id', 'test@example.com', 'confirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const mockSession = new Sessions(
        'session-id',
        'user-id',
        new Date().toISOString(),
        'unknown',
        'unknown',
        'unknown',
        '{}'
      );
      mockSessionsRepository.save.mockResolvedValue(mockSession);

      mockCognitoClient.send.mockResolvedValue(mockCognitoResponse);

      const emptyHeaders = {};
      const result = await signIn.execute(mockSignInData, emptyHeaders);

      expect(result.statusCode).toBe(200);
      expect(mockSessionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          appVersion: 'unknown',
          platform: 'unknown',
          ip: 'unknown',
          geo: '{}'
        })
      );
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing Cognito configuration', async () => {
      delete process.env.COGNITO_PORTAL_USER_POOL_ID;
      delete process.env.COGNITO_PORTAL_CLIENT_ID;

      const mockUser = new User('user-id', 'test@example.com', 'confirmed', 'PROPERTY_OWNER', '170');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await signIn.execute(mockSignInData, mockHeaders);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Error interno del servidor');
    });
  });
});
