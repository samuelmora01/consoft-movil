import 'reflect-metadata';
import { SignUp } from '../../application/use-cases/auth/SignUp';
import { IDocumentTypesRepository } from '../../domain/repositories/IDocumentTypesRepository';
import { DynamoDocumentTypesRepository } from '../../infrastructure/adapters/dynamo/DynamoDocumentTypesRepository';
import { IRolesRepository } from '../../domain/repositories/IRolesRepository';
import { DynamoRolesRepository } from '../../infrastructure/adapters/dynamo/DynamoRolesRepository';
import { IUserRolesRepository } from '../../domain/repositories/IUserRolesRepository';
import { DynamoUserRolesRepository } from '../../infrastructure/adapters/dynamo/DynamoUserRolesRepository';
import { DynamoSessionsRepository } from '../../infrastructure/adapters/dynamo/DynamoSessionsRepository';
import { DynamoUserRepository } from '../../infrastructure/adapters/dynamo/DynamoUserRepository';
import { DynamoUserTypesRepository } from '../../infrastructure/adapters/dynamo/DynamoUserTypesRepository';
import { DynamoPersonProfileRepository } from '../../infrastructure/adapters/dynamo/DynamoPersonProfileRepository';
import { DynamoOrgProfileRepository } from '../../infrastructure/adapters/dynamo/DynamoOrgProfileRepository';
import { DynamoDocumentsRepository } from '../../infrastructure/adapters/dynamo/DynamoDocumentsRepository';
import { UserTypes } from '../../domain/entities/UserTypes';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      UserSub: 'mock-user-sub-id',
      MessageAction: 'SUPPRESS' // Suppress email in test
    })
  })),
  SignUpCommand: jest.fn()
}));

// Mock DynamoDB operations for integration testing
jest.mock('../../domain/models/db/dynamo/UserModel', () => ({
  User_Model: {
    create: jest.fn(),
    scan: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    using: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../domain/models/db/dynamo/UserTypesModel', () => ({
  UserTypes_Model: {
    create: jest.fn(),
    scan: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    using: jest.fn().mockReturnThis(),
    exec: jest.fn()
  }
}));

jest.mock('../../domain/models/db/dynamo/PersonProfileModel', () => ({
  PersonProfile_Model: {
    create: jest.fn()
  }
}));

jest.mock('../../domain/models/db/dynamo/OrgProfileModel', () => ({
  OrgProfile_Model: {
    create: jest.fn()
  }
}));

jest.mock('../../domain/models/db/dynamo/DocumentsModel', () => ({
  Documents_Model: {
    create: jest.fn(),
    scan: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    exec: jest.fn()
  }
}));

jest.mock('../../domain/models/db/dynamo/SessionsModel', () => ({
  Sessions_Model: {
    create: jest.fn()
  }
}));

import { User_Model } from '../../domain/models/db/dynamo/UserModel';
import { UserTypes_Model } from '../../domain/models/db/dynamo/UserTypesModel';
import { PersonProfile_Model } from '../../domain/models/db/dynamo/PersonProfileModel';
import { OrgProfile_Model } from '../../domain/models/db/dynamo/OrgProfileModel';
import { Documents_Model } from '../../domain/models/db/dynamo/DocumentsModel';
import { Sessions_Model } from '../../domain/models/db/dynamo/SessionsModel';

describe('SignUp Integration Tests', () => {
  let signUp: SignUp;
  let userRepository: DynamoUserRepository;
  let userTypesRepository: DynamoUserTypesRepository;
  let personProfileRepository: DynamoPersonProfileRepository;
  let orgProfileRepository: DynamoOrgProfileRepository;
  let documentsRepository: DynamoDocumentsRepository;
  let sessionsRepository: DynamoSessionsRepository;
  let documentTypesRepository: IDocumentTypesRepository;
  let rolesRepository: IRolesRepository;
  let userRolesRepository: IUserRolesRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize repositories
    userRepository = new DynamoUserRepository();
    userTypesRepository = new DynamoUserTypesRepository();
    personProfileRepository = new DynamoPersonProfileRepository();
    orgProfileRepository = new DynamoOrgProfileRepository();
    documentsRepository = new DynamoDocumentsRepository();
    sessionsRepository = new DynamoSessionsRepository();
    documentTypesRepository = new DynamoDocumentTypesRepository();
    rolesRepository = new DynamoRolesRepository();
    userRolesRepository = new DynamoUserRolesRepository();

    // Initialize SignUp use case
    signUp = new SignUp(
      userRepository,
      userTypesRepository,
      personProfileRepository,
      orgProfileRepository,
      documentsRepository,
      documentTypesRepository,
      rolesRepository,
      userRolesRepository,
      sessionsRepository
    );
  });

  describe('Complete Owner SignUp Flow', () => {
    it('should complete full owner signup with all database operations', async () => {
      // Mock successful UserType lookup
      const mockUserType = {
        id: 'ut-owner-001',
        code: 'owner',
        name: 'Owner',
        description: 'Property owner',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      (UserTypes_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 1,
          0: mockUserType
        })
      });

      // Mock no existing user
      (User_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 0
        })
      });

      // Mock no existing document
      (Documents_Model.scan as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 0
        })
      });

      // Mock successful saves
      (User_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-user-id' });
      (PersonProfile_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-profile-id' });
      (Documents_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-document-id' });
      (Sessions_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-session-id' });

      const signUpData = {
        userTypeId: 'ut-owner-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.owner@example.com',
        document: {
          documentTypeId: 'CC',
          documentNumber: '1023456789'
        },
        birthDate: '1990-01-01',
        password: 'SecurePassword123!'
      };

      const result = await signUp.execute(signUpData);

      // Verify success response
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario registrado, pendiente de confirmación');

      // Verify all database operations were called
      expect(User_Model.create).toHaveBeenCalled();
      expect(PersonProfile_Model.create).toHaveBeenCalled();
      expect(Documents_Model.create).toHaveBeenCalled();
      
      // Verify Sessions was NOT created for signup (only for confirm)
      expect(Sessions_Model.create).not.toHaveBeenCalled();

      // Verify OrgProfile was NOT created for owner
      expect(OrgProfile_Model.create).not.toHaveBeenCalled();
    });
  });

  describe('Complete Real Estate SignUp Flow', () => {
    it('should complete full real estate signup with organization profile', async () => {
      // Mock successful UserType lookup for real estate
      const mockUserType = {
        id: 'ut-real-estate-001',
        code: 'real-estate',
        name: 'Real Estate',
        description: 'Real estate company',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      (UserTypes_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 1,
          0: mockUserType
        })
      });

      // Mock no existing user
      (User_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 0
        })
      });

      // Mock no existing document
      (Documents_Model.scan as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 0
        })
      });

      // Mock successful saves
      (User_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-user-id' });
      (OrgProfile_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-org-profile-id' });
      (Documents_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-document-id' });

      const signUpData = {
        userTypeId: 'ut-real-estate-001',
        orgName: 'Premium Real Estate S.A.S',
        email: 'contact@premiumrealestate.com',
        document: {
          documentTypeId: 'NIT',
          documentNumber: '900123456',
          dv: 4
        },
        password: 'RealEstateSecure123!'
      };

      const result = await signUp.execute(signUpData);

      // Verify success response without tokens
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toEqual({});

      // Verify database operations
      expect(User_Model.create).toHaveBeenCalled();
      expect(OrgProfile_Model.create).toHaveBeenCalled();
      expect(Documents_Model.create).toHaveBeenCalled();

      // Verify PersonProfile and Sessions were NOT created
      expect(PersonProfile_Model.create).not.toHaveBeenCalled();
      expect(Sessions_Model.create).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios Integration', () => {
    it('should handle Cognito service errors gracefully', async () => {
      // Mock UserType exists
      const mockUserType = {
        id: 'ut-owner-001',
        code: 'owner',
        name: 'Owner',
        description: 'Property owner',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      (UserTypes_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 1,
          0: mockUserType
        })
      });

      // Mock no existing user or document
      (User_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ count: 0 })
      });

      (Documents_Model.scan as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ count: 0 })
      });

      // Mock Cognito error
      const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
      const mockClient = {
        send: jest.fn().mockRejectedValue(new Error('Cognito service unavailable'))
      };
      (CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => mockClient);

      const signUpData = {
        userTypeId: 'ut-owner-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        document: {
          documentTypeId: 'CC',
          documentNumber: '1023456789'
        },
        birthDate: '1990-01-01',
        password: 'SecurePassword123!'
      };

      const result = await signUp.execute(signUpData);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.message).toContain('Error interno del servidor');
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      (UserTypes_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const signUpData = {
        userTypeId: 'ut-owner-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        document: {
          documentTypeId: 'CC',
          documentNumber: '1023456789'
        },
        birthDate: '1990-01-01',
        password: 'SecurePassword123!'
      };

      const result = await signUp.execute(signUpData);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.message).toContain('Error interno del servidor');
    });
  });

  describe('Data Validation Integration', () => {
    it('should properly validate and save document details with DV', async () => {
      // Setup mocks for real estate with NIT and DV
      const mockUserType = {
        id: 'ut-real-estate-001',
        code: 'real-estate',
        name: 'Real Estate',
        description: 'Real estate company',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      (UserTypes_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          count: 1,
          0: mockUserType
        })
      });

      (User_Model.query as jest.Mock).mockReturnValue({
        using: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ count: 0 })
      });

      (Documents_Model.scan as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ count: 0 })
      });

      (User_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-user-id' });
      (OrgProfile_Model.create as jest.Mock).mockResolvedValue({ id: 'mock-org-id' });

      let savedDocumentData: any;
      (Documents_Model.create as jest.Mock).mockImplementation((data) => {
        savedDocumentData = data;
        return Promise.resolve({ id: 'mock-document-id' });
      });

      const signUpData = {
        userTypeId: 'ut-real-estate-001',
        orgName: 'Test Real Estate',
        email: 'test@realestate.com',
        document: {
          documentTypeId: 'NIT',
          documentNumber: '900123456',
          dv: 4
        },
        password: 'TestPassword123!'
      };

      await signUp.execute(signUpData);

      expect(Documents_Model.create).toHaveBeenCalled();
      expect(savedDocumentData.details).toEqual({
        documentNumber: '900123456',
        dv: 4
      });
    });
  });
});
