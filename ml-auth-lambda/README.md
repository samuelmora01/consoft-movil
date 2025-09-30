## Biznagi Serverless App (AWS SAM + TypeScript)

Plantilla opinionada para construir APIs serverless con AWS SAM, API Gateway, Lambda (Node.js 22) y TypeScript, siguiendo arquitectura hexagonal con inyección de dependencias.

### Requisitos
- Node.js 18+ (recomendado; la Lambda corre en Node.js 22)
- AWS SAM CLI
- AWS CLI configurado con credenciales

### Instalación rápida
- `npm install`
- `npm run build`

## Arquitectura y carpetas

```
lambda-test-repo/
├── deployment/
│   └── aws/
│       ├── openapi/openapi.yaml          # OpenAPI generado
│       └── template.yaml                 # SAM stack (ApiGateway + Lambda)
├── scripts/                              # Utilidades CLI
│   ├── generate-openapi.js               # Genera OpenAPI desde rutas
│   ├── create-model.js | delete-model.js # Scaffold de modelos
│   └── initialize_project.js
├── src/
│   ├── interfaces/                       # Capa de entrada (drivers)
│   │   ├── aws-lambda/handler.ts         # Entrypoint Lambda (dispatcher)
│   │   ├── http/userUseCases.ts          # Handlers HTTP
│   │   ├── events/eventUseCases.ts       # Handlers EventBridge
│   │   └── queue/queueUseCases.ts        # Handlers SQS
│   ├── infrastructure/                   # Routers, DI, adapters
│   │   ├── http/HTTPRouter.ts            # Rutas HTTP -> handlers
│   │   ├── events/EventsRouter.ts        # Rutas EventBridge
│   │   ├── queue/QueueRouter.ts          # Rutas SQS
│   │   ├── adapters/dynamo/...           # Repos DynamoDB (dynamoose)
│   │   └── container/                    # Registro de dependencias
│   ├── application/                      # Casos de uso
│   │   ├── common/                       # Common use cases
│   │   └── user/                         # User-related use cases
│   └── domain/                           # Entidades, repos, modelos
│       ├── entities/User.ts
│       ├── repositories/IUserRepository.ts
│       └── models/db/dynamo/UserModel.ts # Modelo dynamoose "User"
├── tsconfig.json
├── package.json
└── README.md
```

## Cómo funciona el enrutamiento

1. API Gateway recibe peticiones HTTP según la configuración en `deployment/aws/openapi/openapi.yaml`.
2. La integración es `aws_proxy` hacia la Lambda declarada en `deployment/aws/template.yaml` (`Handler: dist/interfaces/aws-lambda/handler.handler`).
3. En `src/interfaces/aws-lambda/handler.ts` se usa `dispatchEvent` de `aws-events-adapter` para enrutar por tipo de evento:
   - `apigateway` -> `src/infrastructure/http/HTTPRouter.ts`.
4. `src/infrastructure/http/HTTPRouter.ts` mapea las rutas HTTP a los handlers correspondientes.
5. Los handlers en `src/interfaces/http/` resuelven por DI los casos de uso y extraen parámetros de `queryParams`, `pathParameters` o `body`.
6. Los casos de uso en `src/application/use-cases/` contienen la lógica de negocio y utilizan repositorios.
7. Los repositorios implementan el patrón Repository para acceder a bases de datos (DynamoDB por defecto).
8. La respuesta se construye con `ResponseService` de `serverless-request-manager` y se retorna al API Gateway.

### Estructura de código

```typescript
// src/infrastructure/http/HTTPRouter.ts
import { HttpRouter } from "aws-events-adapter";
import { userUseCases } from "../../interfaces/http/userUseCases";

export const httpRouter: HttpRouter = {
  get: {
    // Add your GET endpoints here
    // Example: '/users/{id}': { handler: userUseCases.get.getUserById }
  },
  post: {
    // Add your POST endpoints here
    // Example: '/users': { handler: userUseCases.post.createUser }
  }
  // ... other HTTP methods
};
```

```1:21:src/interfaces/aws-lambda/handler.ts
import "reflect-metadata";
import { Context } from 'aws-lambda';
import {dispatchEvent, DispatchRoutes} from 'aws-events-adapter';
import { httpRouter } from '../../infrastructure/http/HTTPRouter';
import { eventsRouter } from '../../infrastructure/events/EventsRouter';
import { queueRouter } from '../../infrastructure/queue/QueueRouter';

const handlers:DispatchRoutes = {
  apigateway:httpRouter,
  eventbridge: eventsRouter,
  lambda: {},
  sqs: queueRouter,
}

export const handler = async (
  event: any,
  context: Context
): Promise<any> => {
  const resp = await dispatchEvent(event, handlers);
  return resp;
}
```

## OpenAPI y despliegue (SAM)

- El OpenAPI se genera automáticamente desde las rutas con `npm run generate:openapi` y se guarda en `deployment/aws/openapi/openapi.yaml`.
- El stack SAM (`deployment/aws/template.yaml`) incluye:
  - `AWS::Serverless::Api` que hace `Include` de `openapi/openapi.yaml`.
  - `AWS::Serverless::Function` (la Lambda) con integración a ese API.
  - Un `BasePathMapping` opcional para dominio personalizado (se lee de Secrets Manager: `sam-deploy:SecretString:DomainName`).

## Variables de entorno

- `USER_REPOSITORY`: tipo de repositorio para `IUserRepository`. Soportado: `DYNAMO` (por defecto).
- Credenciales/region de AWS para que `dynamoose` acceda a DynamoDB.
- Tabla DynamoDB: el modelo `User_Model` usa el nombre lógico `User`. Asegúrate de que exista en la cuenta/entorno, o configura `dynamoose` para creación automática si aplica a tu entorno.

## Scripts disponibles

- `npm run build`: compila TypeScript a `dist/`.
- `npm test`: ejecuta tests con Jest.
- `npm run generate:openapi`: genera/actualiza OpenAPI desde `HTTPRouter` y `interfaces/http`.
- `npm run create:model` / `npm run delete:model`: utilidades para modelos.

## Ejecutar localmente

1. `npm install`
2. `npm run build`
3. `sam build`
4. `sam local start-api` (sirve los endpoints de `openapi.yaml`)

Una vez que agregues tus endpoints, podrás probar la API:

```bash
# Ejemplo de cómo probar endpoints una vez creados
curl "http://127.0.0.1:3000/your-endpoint"
curl -X POST "http://127.0.0.1:3000/your-endpoint" -H "Content-Type: application/json" -d '{"data": "value"}'
```

## Desplegar

Opción CLI:

```bash
sam build
sam deploy --guided
```

CI/CD con GitHub Actions: revisa `.github/workflows/deploy.yml`. El `StageName` se infiere de la rama.

## 📚 Documentación Detallada

Para una guía completa y paso a paso sobre cómo crear nuevos endpoints, consulta:

**[🚀 Guía para Crear Nuevos Endpoints](./docs/CREATING_ENDPOINTS.md)**

Esta guía incluye:
- ✅ Uso del script de creación de modelos (`npm run create:model`)
- ✅ Configuración de inyección de dependencias
- ✅ Manejo de repositorios y base de datos
- ✅ Generación automática de documentación OpenAPI
- ✅ Ejemplos completos y troubleshooting

## 🚀 Paso a paso: crear un nuevo endpoint HTTP

**Nota**: Para una guía detallada, consulta [CREATING_ENDPOINTS.md](./docs/CREATING_ENDPOINTS.md)

Supongamos que quieres crear `GET /users/{id}`.

1) **Crear modelo completo** (recomendado):
   ```bash
   npm run create:model User
   ```

2) Caso de uso
- Crea una clase en `src/application/use-cases/...`, por ejemplo `src/application/use-cases/user/GetUser.ts`.
- Anota con `@injectable()` y recibe dependencias (p. ej. `IUserRepository`) vía constructor.

3) Handler HTTP
- En `src/interfaces/http/`, crea/actualiza un archivo (p. ej. `userUseCases.ts`) y agrega una función `async function getUser(event): Promise<IResponse>` que llame al caso de uso. Extrae parámetros desde `event.queryParams`, `event.payload.pathParameters` o `event.body` según corresponda.

4) Enrutador HTTP
- Edita `src/infrastructure/http/HTTPRouter.ts` y agrega la ruta:
  - `get: { '/users/{id}': { handler: userUseCases.get.getUser } }` (o el método que corresponda: post/put/delete/patch).

5) Dependencias / Repositorios (si aplica)
- Si requieres un nuevo repositorio: define la interfaz en `src/domain/repositories/`, su implementación en `src/infrastructure/adapters/...`, y regístrala en `src/infrastructure/container/repositories/...` usando `container.register(...)`.

6) OpenAPI
- Ejecuta `npm run generate:openapi` y elige `aws` cuando lo pida. Esto actualizará `deployment/aws/openapi/openapi.yaml` con la nueva ruta.

7) Compilar y probar
- `npm run build`
- `npm test`
- Local: `sam local start-api` y prueba con `curl`.

8) Desplegar
- `sam deploy` (o push a la rama si usas GitHub Actions para desplegar).

## Formato de respuestas

El framework utiliza un formato estándar para todas las respuestas:

```json
{
  "success": true,
  "data": "your-response-data",
  "message": null
}
```

En caso de error:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Error message"
}
```

## Pruebas

- Pruebas base en `src/_tests_/aws/`. Ejecuta `npm test`.

## Troubleshooting

- 403 al invocar API Gateway: verifica la política `execute-api:Invoke` en `template.yaml` y que el stage sea correcto.
- 500 desde Lambda: revisa logs en CloudWatch; valida que la tabla DynamoDB `User` exista y que el role de la Lambda tenga permisos.
- OpenAPI no se actualiza: asegúrate de haber añadido la ruta en `HTTPRouter.ts` y el handler en `interfaces/http` antes de ejecutar el generador.
