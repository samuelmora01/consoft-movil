import { HttpRouter } from "aws-events-adapter";
import { userUseCases } from "../../interfaces/http/userUseCases";
import { authUseCases } from "../../interfaces/http/authUseCases";

export const httpRouter: HttpRouter = {
  get: {
    // Add your GET endpoints here
    // Example: '/users/{id}': { handler: userUseCases.get.getUserById }
  },
  post: {
    // Add your POST endpoints here
    // Example: '/users': { handler: userUseCases.post.createUser }
    '/signup': { 
      handler: authUseCases.signUp 
    },
    '/confirm': {
      handler: authUseCases.confirm
    },
    '/signin': {
      handler: authUseCases.signIn
    }
  },
  put: {
    // Add your PUT endpoints here
    // Example: '/users/{id}': { handler: userUseCases.put.updateUser }
  },
  patch: {
    // Add your PATCH endpoints here
    // Example: '/users/{id}': { handler: userUseCases.patch.partialUpdateUser }
  },
  delete: {
    // Add your DELETE endpoints here
    // Example: '/users/{id}': { handler: userUseCases.delete.deleteUser }
  }
};

