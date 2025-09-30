import 'reflect-metadata';
import { authUseCases } from '../../../interfaces/http/authUseCases';
import { IEvent } from 'serverless-request-manager/dist/interfaces/IEvent';

// Mock the container and SignUp use case
jest.mock('../../../infrastructure/container', () => ({
  container: {
    resolve: jest.fn()
  }
}));

jest.mock('../../../application/use-cases/auth/SignUp');
jest.mock('../../../application/use-cases/auth/ConfirmSignUp');
jest.mock('../../../application/use-cases/auth/SignIn');

import { container } from '../../../infrastructure/container';
import { SignUp } from '../../../application/use-cases/auth/SignUp';
import { ConfirmSignUp } from '../../../application/use-cases/auth/ConfirmSignUp';
import { SignIn } from '../../../application/use-cases/auth/SignIn';

const mockContainer = container as jest.Mocked<typeof container>;
const MockSignUp = SignUp as jest.MockedClass<typeof SignUp>;
const MockConfirmSignUp = ConfirmSignUp as jest.MockedClass<typeof ConfirmSignUp>;
const MockSignIn = SignIn as jest.MockedClass<typeof SignIn>;

describe('AuthUseCases HTTP Handlers', () => {
  let mockSignUpInstance: jest.Mocked<SignUp>;
  let mockConfirmSignUpInstance: jest.Mocked<ConfirmSignUp>;
  let mockSignInInstance: jest.Mocked<SignIn>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignUpInstance = {
      execute: jest.fn()
    } as any;

    mockConfirmSignUpInstance = {
      execute: jest.fn()
    } as any;

    mockSignInInstance = {
      execute: jest.fn()
    } as any;

    mockContainer.resolve.mockImplementation((token) => {
      if (token === SignUp) return mockSignUpInstance;
      if (token === ConfirmSignUp) return mockConfirmSignUpInstance;
      if (token === SignIn) return mockSignInInstance;
      return mockSignUpInstance; // fallback
    });
  });

  describe('signUp handler', () => {
    it('should successfully process signup request', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            userTypeId: 'owner-type-id',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            document: {
              documentTypeId: 'CC',
              documentNumber: '123456789'
            }
          },
          headers: {
            'x-app-version': '1.0.0',
            'x-platform': 'web',
            'x-forwarded-for': '127.0.0.1',
            'x-geo-location': 'CO'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          message: 'Usuario registrado, pendiente de confirmación'
        })
      };

      mockSignUpInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.signUp(mockEvent);

      expect(result).toEqual(mockResponse);
      expect(mockContainer.resolve).toHaveBeenCalledWith(SignUp);
      expect(mockSignUpInstance.execute).toHaveBeenCalledWith(mockEvent.payload.body);
    });

    it('should handle missing body in request', async () => {
      const mockEvent: IEvent = {
        payload: {
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 400,
        body: JSON.stringify({
          code: 'BAD_REQUEST',
          message: 'Email, contraseña y tipo de usuario son requeridos'
        })
      };

      mockSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.signUp(mockEvent);

      expect(mockSignUpInstance.execute).toHaveBeenCalledWith({});
    });

    it('should handle signup without tokens', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            userTypeId: 'test-type',
            email: 'test@example.com',
            password: 'password123',
            document: {
              documentTypeId: 'CC',
              documentNumber: '123456789'
            }
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({ 
          code: 'PROCESS_OK', 
          message: 'Usuario registrado, pendiente de confirmación' 
        })
      };

      mockSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.signUp(mockEvent);

      expect(mockSignUpInstance.execute).toHaveBeenCalledWith(mockEvent.payload.body);
    });

    it('should handle use case throwing error', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            userTypeId: 'test-type',
            email: 'test@example.com',
            password: 'password123',
            document: {
              documentTypeId: 'CC',
              documentNumber: '123456789'
            }
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      mockSignUpInstance.execute.mockRejectedValue(new Error('Use case error'));

      const result = await authUseCases.signUp(mockEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.message).toBe('Error interno del servidor');
    });

    it('should handle container resolve throwing error', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {},
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      mockContainer.resolve.mockImplementation(() => {
        throw new Error('Container resolution error');
      });

      const result = await authUseCases.signUp(mockEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.message).toBe('Error interno del servidor');
    });

    it('should handle missing payload in event', async () => {
      const mockEvent: IEvent = {
        payload: undefined,
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      } as any;

      const mockResponse = {
        statusCode: 400,
        body: JSON.stringify({
          code: 'BAD_REQUEST',
          message: 'Email, contraseña y tipo de usuario son requeridos'
        })
      };

      mockSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.signUp(mockEvent);

      expect(mockSignUpInstance.execute).toHaveBeenCalledWith({});
    });
  });

  describe('confirm handler', () => {
    it('should successfully process confirm request with tokens', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            code: '123456',
            flow: 'signup',
            password: 'password123'
          },
          headers: {
            'app-version': '1.0.0',
            'platform': 'web',
            'x-forwarded-for': '127.0.0.1',
            'geo': '{"lat": "10.0", "lng": "-74.0"}'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiration: '2025-09-18T22:00:00.000Z'
          }
        })
      };

      mockConfirmSignUpInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.confirm(mockEvent);

      expect(result).toEqual(mockResponse);
      expect(mockContainer.resolve).toHaveBeenCalledWith(ConfirmSignUp);
      expect(mockConfirmSignUpInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body
      );
    });

    it('should handle missing body in confirm request', async () => {
      const mockEvent: IEvent = {
        payload: {
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 400,
        body: JSON.stringify({
          code: 'BAD_REQUEST',
          message: 'Email, código y flow son requeridos'
        })
      };

      mockConfirmSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.confirm(mockEvent);

      expect(mockConfirmSignUpInstance.execute).toHaveBeenCalledWith({});
    });

    it('should handle missing headers in confirm request', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            code: '123456',
            flow: 'signup',
            password: 'password123'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiration: '2025-09-18T22:00:00.000Z'
          }
        })
      };

      mockConfirmSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.confirm(mockEvent);

      expect(mockConfirmSignUpInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body
      );
    });

    it('should handle confirm use case throwing error', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            code: '123456',
            flow: 'signup',
            password: 'password123'
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      mockConfirmSignUpInstance.execute.mockRejectedValue(new Error('Confirm use case error'));

      const result = await authUseCases.confirm(mockEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.message).toBe('Error interno del servidor');
    });

    it('should handle container resolve throwing error for confirm', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {},
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      mockContainer.resolve.mockImplementation(() => {
        throw new Error('Container resolution error');
      });

      const result = await authUseCases.confirm(mockEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.message).toBe('Error interno del servidor');
    });

    it('should parse geo header correctly when provided as JSON string', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            code: '123456',
            flow: 'signup',
            password: 'password123'
          },
          headers: {
            'geo': '{"latitude": "4.6097", "longitude": "-74.0817"}'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiration: '2025-09-18T22:00:00.000Z'
          }
        })
      };

      mockConfirmSignUpInstance.execute.mockResolvedValue(mockResponse);

      await authUseCases.confirm(mockEvent);

      expect(mockConfirmSignUpInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body
      );
    });

    it('should handle malformed geo header gracefully', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            code: '123456',
            flow: 'signup',
            password: 'password123'
          },
          headers: {
            'geo': 'invalid-json'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK'
        })
      };

      mockConfirmSignUpInstance.execute.mockResolvedValue(mockResponse);

      // Should not throw an error
      const result = await authUseCases.confirm(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(mockConfirmSignUpInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body
      );
    });
  });

  describe('signIn handler', () => {
    it('should successfully process signin request', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          headers: {
            'appVersion': '1.0.0',
            'platform': 'web',
            'x-forwarded-for': '192.168.1.1, 10.0.0.1',
            'true-client-ip': '198.51.100.5',
            'geo': '{"country":"CO","city":"Bogotá"}'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            idToken: 'mock-id-token',
            expiration: '2025-09-10T22:00:00Z'
          }
        })
      };

      mockSignInInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.signIn(mockEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('PROCESS_OK');
      expect(body.data).toHaveProperty('accessToken');
      
      expect(mockSignInInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body,
        {
          appVersion: '1.0.0',
          platform: 'web',
          ip: '192.168.1.1',
          geo: {}
        }
      );
    });

    it('should handle missing headers gracefully', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            idToken: 'mock-id-token',
            expiration: '2025-09-10T22:00:00Z'
          }
        })
      };

      mockSignInInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.signIn(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(mockSignInInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body,
        {
          appVersion: undefined,
          platform: undefined,
          ip: 'unknown',
          geo: {}
        }
      );
    });

    it('should handle malformed geo header gracefully', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          headers: {
            'geo': 'invalid-json'
          }
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify({
          code: 'PROCESS_OK',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            idToken: 'mock-id-token',
            expiration: '2025-09-10T22:00:00Z'
          }
        })
      };

      mockSignInInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.signIn(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(mockSignInInstance.execute).toHaveBeenCalledWith(
        mockEvent.payload.body,
        {
          appVersion: undefined,
          platform: undefined,
          ip: 'unknown',
          geo: {}
        }
      );
    });

    it('should handle signin use case errors', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      const mockResponse = {
        statusCode: 400,
        body: JSON.stringify({
          code: 'BAD_REQUEST',
          data: 'Credenciales inválidas'
        })
      };

      mockSignInInstance.execute.mockResolvedValue(mockResponse);

      const result = await authUseCases.signIn(mockEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('BAD_REQUEST');
      expect(body.data).toBe('Credenciales inválidas');
    });

    it('should handle unexpected errors', async () => {
      const mockEvent: IEvent = {
        payload: {
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          headers: {}
        },
        queryParams: {},
        token: null,
        requestContext: {},
        eventRaw: {}
      };

      mockSignInInstance.execute.mockRejectedValue(new Error('Unexpected error'));

      const result = await authUseCases.signIn(mockEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.message).toBe('Error interno del servidor');
    });
  });
});
