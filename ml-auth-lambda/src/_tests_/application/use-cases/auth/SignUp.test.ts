import 'reflect-metadata';
import { SignUp } from '../../../../application/use-cases/auth/SignUp';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IUserTypesRepository } from '../../../../domain/repositories/IUserTypesRepository';
import { IPersonProfileRepository } from '../../../../domain/repositories/IPersonProfileRepository';
import { IOrgProfileRepository } from '../../../../domain/repositories/IOrgProfileRepository';
import { IDocumentsRepository } from '../../../../domain/repositories/IDocumentsRepository';
import { IDocumentTypesRepository } from '../../../../domain/repositories/IDocumentTypesRepository';
import { IRolesRepository } from '../../../../domain/repositories/IRolesRepository';
import { IUserRolesRepository } from '../../../../domain/repositories/IUserRolesRepository';
import { ISessionsRepository } from '../../../../domain/repositories/ISessionsRepository';
import { UserTypes } from '../../../../domain/entities/UserTypes';
import { User } from '../../../../domain/entities/User';
import { Documents } from '../../../../domain/entities/Documents';
import { DocumentTypes } from '../../../../domain/entities/DocumentTypes';
import { Roles } from '../../../../domain/entities/Roles';
import { UserRoles } from '../../../../domain/entities/UserRoles';

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

const mockUserTypesRepository: jest.Mocked<IUserTypesRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

const mockPersonProfileRepository: jest.Mocked<IPersonProfileRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
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

const mockDocumentsRepository: jest.Mocked<IDocumentsRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByDocumentNumber: jest.fn(),
  findByUserId: jest.fn(),
};

const mockDocumentTypesRepository: jest.Mocked<IDocumentTypesRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

const mockRolesRepository: jest.Mocked<IRolesRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByCode: jest.fn(),
};

const mockUserRolesRepository: jest.Mocked<IUserRolesRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
};

const mockSessionsRepository: jest.Mocked<ISessionsRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};


// Mock AWS Cognito
const mockCognitoSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: mockCognitoSend
  })),
  SignUpCommand: jest.fn(),
  AdminGetUserCommand: jest.fn(),
  ResendConfirmationCodeCommand: jest.fn()
}));

// Mock environment variables
process.env.COGNITO_PORTAL_CLIENT_ID = '3po7rl2up2quqerr1ba02a4qo5'; // Valid client ID format
process.env.COGNITO_REGION = 'us-east-1';

describe('SignUp Use Case', () => {
  let signUpUseCase: SignUp;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset Cognito mock to return success by default
    mockCognitoSend.mockResolvedValue({
      UserSub: 'test-user-sub',
      CodeDeliveryDetails: {
        Destination: 'test@example.com',
        DeliveryMedium: 'EMAIL'
      }
    });

    // Mock DocumentTypes by default
    const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');
    mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);

    // Mock Roles by default
    const mockRole = new Roles('role-id', 'ROLE_PROPERTY_OWNER', 'app', ['permission1'], 'active');
    mockRolesRepository.findByCode.mockResolvedValue(mockRole);
    
    signUpUseCase = new SignUp(
      mockUserRepository,
      mockUserTypesRepository,
      mockPersonProfileRepository,
      mockOrgProfileRepository,
      mockDocumentsRepository,
      mockDocumentTypesRepository,
      mockRolesRepository,
      mockUserRolesRepository,
      mockSessionsRepository
    );
  });

  describe('Input Validation', () => {
    it('should return BAD_REQUEST when email is missing', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: '',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Email, contraseña y tipo de usuario son requeridos');
    });

    it('should return BAD_REQUEST when password is missing', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'test@example.com',
        password: '',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Email, contraseña y tipo de usuario son requeridos');
    });

    it('should return BAD_REQUEST when userTypeId is missing', async () => {
      const signUpData = {
        userTypeId: '',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Email, contraseña y tipo de usuario son requeridos');
    });

    it('should return BAD_REQUEST when document info is missing', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: '',
          documentNumber: ''
        }
      };

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Información del documento es requerida');
    });

    it('should return BAD_REQUEST for invalid email format', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'invalid-email',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Formato de email inválido');
    });
  });

  describe('Business Logic Validation', () => {
    it('should return BAD_REQUEST when userType does not exist', async () => {
      const signUpData = {
        userTypeId: 'non-existent-type',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      mockUserTypesRepository.findById.mockResolvedValue(null);

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Tipo de usuario no válido');
      expect(mockUserTypesRepository.findById).toHaveBeenCalledWith('non-existent-type');
    });

    it('should return BAD_REQUEST when email is already registered', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'existing@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('test-user-type', 'Test user type');
      const mockExistingUser = new User('existing-id', 'existing@example.com', 'confirmed', 'test-user-type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(mockExistingUser);

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('ya está registrado y confirmado');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('existing@example.com');
    });

    it('should allow retry when email is registered but UNCONFIRMED', async () => {
      const signUpData = {
        userTypeId: 'PROPERTY_OWNER',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');
      const existingUnconfirmedUser = new User('existing-id', 'test@example.com', 'unconfirmed', 'PROPERTY_OWNER');
      const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(existingUnconfirmedUser);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).data).toBe("Código OTP reenviado, pendiente de confirmación");
      
      // Verificar que se sobreescribieron los datos (no se eliminó)
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-id',
          email: 'test@example.com',
          status: 'unconfirmed'
        })
      );
      
      // Verificar que se reenvi\u00f3 el OTP
      expect(mockCognitoSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Username: 'test@example.com'
          })
        })
      );
    });

    it('should return BAD_REQUEST when document is already registered', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('test-user-type', 'Test user type');
      const mockExistingDocument = new Documents('doc-id', 'user-id', 'CC', { documentNumber: '123456789' });

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(mockExistingDocument);

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('El documento ya está registrado');
      expect(mockDocumentsRepository.findByDocumentNumber).toHaveBeenCalledWith('CC', '123456789');
    });
  });

  describe('Owner/Prospect Signup Flow', () => {
    it('should successfully register owner/prospect user without tokens (requires OTP confirmation)', async () => {
      const signUpData = {
        userTypeId: 'PROPERTY_OWNER',
        email: 'owner@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(expect.any(User));
      mockPersonProfileRepository.save.mockResolvedValue(expect.any(Object));
      mockDocumentsRepository.save.mockResolvedValue(expect.any(Documents));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario registrado, pendiente de confirmación');

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockPersonProfileRepository.save).toHaveBeenCalled();
      expect(mockDocumentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('Independent Agent Signup Flow', () => {
    it('should successfully register independent agent without tokens (requires OTP confirmation)', async () => {
      const signUpData = {
        userTypeId: 'INDEPENDENT_AGENT',
        email: 'agent@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        birthDate: '1985-05-15',
        document: {
          documentTypeId: 'CC',
          documentNumber: '987654321'
        }
      };

      const mockUserType = new UserTypes('INDEPENDENT_AGENT', 'Agent user type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(expect.any(User));
      mockPersonProfileRepository.save.mockResolvedValue(expect.any(Object));
      mockDocumentsRepository.save.mockResolvedValue(expect.any(Documents));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario registrado, pendiente de confirmación');

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockPersonProfileRepository.save).toHaveBeenCalled();
      expect(mockDocumentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('Real Estate Signup Flow', () => {
    it('should successfully register real estate organization without tokens (requires OTP confirmation)', async () => {
      const signUpData = {
        userTypeId: 'REAL_ESTATE',
        email: 'realestate@example.com',
        password: 'password123',
        orgName: 'Best Real Estate Company',
        document: {
          documentTypeId: 'NIT',
          documentNumber: '900123456',
          dv: 4
        }
      };

      const mockUserType = new UserTypes('REAL_ESTATE', 'Real estate user type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(expect.any(User));
      mockOrgProfileRepository.save.mockResolvedValue(expect.any(Object));
      mockDocumentsRepository.save.mockResolvedValue(expect.any(Documents));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.message).toBe('Usuario registrado, pendiente de confirmación');

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockOrgProfileRepository.save).toHaveBeenCalled();
      expect(mockDocumentsRepository.save).toHaveBeenCalled();
      expect(mockPersonProfileRepository.save).not.toHaveBeenCalled(); // No person profile for org
    });
  });

  describe('Dynamic Document Creation', () => {
    it('should create document with correct details based on DocumentType attributes', async () => {
      const signUpData = {
        userTypeId: 'PROPERTY_OWNER',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-01',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');
      const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);
      mockUserRepository.save.mockResolvedValue(expect.any(User));
      mockPersonProfileRepository.save.mockResolvedValue(expect.any(Object));
      mockDocumentsRepository.save.mockResolvedValue(expect.any(Documents));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      
      // Verificar que se guardó el documento con los detalles correctos
      expect(mockDocumentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentTypeId: 'CC',
          details: {
            documentNumber: '123456789'
          }
        })
      );

      // Verificar que se asignó el rol correcto
      expect(mockRolesRepository.findByCode).toHaveBeenCalledWith('ROLE_PROPERTY_OWNER');
      expect(mockUserRolesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          roleId: 'role-id'
        })
      );
    });

    it('should create document with multiple attributes for NIT document type', async () => {
      const signUpData = {
        userTypeId: 'REAL_ESTATE',
        email: 'realestate@example.com',
        password: 'password123',
        orgName: 'Test Real Estate',
        document: {
          documentTypeId: 'NIT',
          documentNumber: '900123456',
          dv: 4
        }
      };

      const mockUserType = new UserTypes('REAL_ESTATE', 'Real estate user type');
      const mockDocumentType = new DocumentTypes('NIT', ['documentNumber', 'dv'], '170');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);
      mockUserRepository.save.mockResolvedValue(expect.any(User));
      mockOrgProfileRepository.save.mockResolvedValue(expect.any(Object));
      mockDocumentsRepository.save.mockResolvedValue(expect.any(Documents));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      
      // Verificar que se guardó el documento con ambos atributos
      expect(mockDocumentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentTypeId: 'NIT',
          details: {
            documentNumber: '900123456',
            dv: 4
          }
        })
      );
    });

    it('should throw error when DocumentType is not found', async () => {
      const signUpData = {
        userTypeId: 'PROPERTY_OWNER',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        document: {
          documentTypeId: 'INVALID_TYPE',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(null); // DocumentType not found

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Error interno del servidor');
    });

    it('should handle real world signup data with correct document details - Mariana case', async () => {
      const signUpData = {
        userTypeId: "PROPERTY_OWNER",
        firstName: "Mariana",
        lastName: "Agudelo",
        email: "cam.mlholding@gmail.com",
        document: {
          documentTypeId: "CC",
          documentNumber: "10008971123"
        },
        birthDate: "2002-07-23",
        password: "Especial2025!"
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');
      const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(200);
      
      // Verificar que se guardó el documento con los detalles específicos del caso real
      expect(mockDocumentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentTypeId: 'CC',
          details: {
            documentNumber: '10008971123'
          }
        })
      );

      // Verificar que se creó el perfil de persona con birthDate
      expect(mockPersonProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Mariana',
          lastName: 'Agudelo',
          birthDate: '2002-07-23'
        })
      );
    });

    it('should handle role assignment errors gracefully', async () => {
      const signUpData = {
        userTypeId: 'PROPERTY_OWNER',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('PROPERTY_OWNER', 'Owner user type');
      const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
      mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);
      mockRolesRepository.findByCode.mockResolvedValue(null); // Role not found

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Error interno del servidor');
    });
  });

  describe('Role Assignment', () => {
    it('should assign correct roles for different user types', async () => {
      const testCases = [
        { userTypeId: 'PROPERTY_OWNER', expectedRoleCode: 'ROLE_PROPERTY_OWNER' },
        { userTypeId: 'PROSPECT', expectedRoleCode: 'ROLE_PROSPECT' },
        { userTypeId: 'INDEPENDENT_AGENT', expectedRoleCode: 'ROLE_INDEPENDENT_AGENT' },
        { userTypeId: 'REAL_ESTATE', expectedRoleCode: 'ROLE_REAL_ESTATE' }
      ];

      for (const testCase of testCases) {
        // Reset mocks
        jest.clearAllMocks();
        
        const signUpData = {
          userTypeId: testCase.userTypeId,
          email: `test-${testCase.userTypeId}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          ...(testCase.userTypeId === 'REAL_ESTATE' ? { orgName: 'Test Org' } : {}),
          document: {
            documentTypeId: 'CC',
            documentNumber: '123456789'
          }
        };

        const mockUserType = new UserTypes(testCase.userTypeId, 'Test user type');
        const mockDocumentType = new DocumentTypes('CC', ['documentNumber'], '170');
        const mockRole = new Roles('role-id', testCase.expectedRoleCode, 'app', ['permission1'], 'active');

        mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);
        mockDocumentTypesRepository.findById.mockResolvedValue(mockDocumentType);
        mockRolesRepository.findByCode.mockResolvedValue(mockRole);

        mockCognitoSend.mockResolvedValue({
          UserSub: 'test-user-sub',
          CodeDeliveryDetails: { Destination: 'test@example.com', DeliveryMedium: 'EMAIL' }
        });

        const result = await signUpUseCase.execute(signUpData);

        expect(result.statusCode).toBe(200);
        expect(mockRolesRepository.findByCode).toHaveBeenCalledWith(testCase.expectedRoleCode);
        expect(mockUserRolesRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            roleId: 'role-id'
          })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should return INTERNAL_SERVER_ERROR when repository throws error', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      mockUserTypesRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Error interno del servidor');
    });

    it('should return INTERNAL_SERVER_ERROR when Cognito throws error', async () => {
      const signUpData = {
        userTypeId: 'test-user-type',
        email: 'test@example.com',
        password: 'password123',
        document: {
          documentTypeId: 'CC',
          documentNumber: '123456789'
        }
      };

      const mockUserType = new UserTypes('test-user-type', 'Test user type');

      mockUserTypesRepository.findById.mockResolvedValue(mockUserType);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockDocumentsRepository.findByDocumentNumber.mockResolvedValue(null);

      // Mock Cognito error specifically for this test
      mockCognitoSend.mockRejectedValueOnce(new Error('Cognito service error'));

      const result = await signUpUseCase.execute(signUpData);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Error interno del servidor');
    });
  });
});
