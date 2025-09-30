## Autenticación para Portal Inmobiliario con Amazon Cognito (Visión de Alto Nivel)

Este documento describe, a nivel conceptual, cómo funcionará el sistema de autenticación de este Lambda utilizando Amazon Cognito. Aquí definimos el alcance, los componentes de Cognito, los endpoints a exponer, los flujos principales (signup, confirmación por OTP, signin), las variables de entorno y consideraciones de despliegue. La implementación vendrá después siguiendo el template de la guía `CREATING_ENDPOINTS.md`.

### 1) Objetivo

- Proveer registro, verificación por código (OTP vía email) y login para dos tipos de aplicaciones del ecosistema inmobiliario:
  - Backoffice (operadores internos).
  - Portal de usuarios finales (compradores, arrendatarios, agentes, propietarios).
- Entregar tokens JWT (ID/Access/Refresh) y validar grupos (roles) de usuario mediante Cognito User Groups.

### 2) Componentes en Cognito

- Dos User Pools (por ambiente) con email como identificador:
  - Backoffice User Pool.
  - Portal User Pool.
- App Clients por cada User Pool:
  - Backoffice Client: recomendado con secret (confidential client) para mayor seguridad desde backend/servidor.
  - Web Client (Portal): sin secret (public client) para SPA/mobile.
- User Groups (roles) para segmentar permisos. Propuesta inicial (ajustable durante implementación):
  - BACKOFFICE_ADMIN, BACKOFFICE_OPERATOR
  - AGENT
  - OWNER (propietario), TENANT (inquilino) / BUYER (comprador)
  - Nota MVP1: se excluye el rol "Constructora".

### 3) Endpoints a exponer (HTTP, prefijo /auth)

- POST `/auth/signup`: registro de usuario.
- POST `/auth/confirm`: validación de OTP (código de verificación) para confirmar la cuenta y emitir tokens cuando `flow=signup`.
- POST `/auth/signin`: inicio de sesión con email y contraseña; retorna tokens JWT.
- POST `/auth/resend`: reenvío del código de verificación (OTP) según `flow`.
- POST `/auth/recovery`: inicio de recuperación de contraseña (envío de código/link por Cognito).
- POST `/auth/change-password`: cambio de contraseña; soporta `flow="recovery"` y `flow="change-password"`.
- POST `/auth/refresh`: intercambio de refresh token por nuevos tokens.

Notas:
- La selección del App Client usado por cada endpoint dependerá del canal:
  - Backoffice → App Client con secret (enviando `SECRET_HASH`).
  - Portal/usuarios → App Client sin secret.
  - Portal (SPA): no se envía `SECRET_HASH`; usar SRP (USER_PASSWORD_AUTH) y/o PKCE con Hosted UI según el flujo.

### 4) Flujos principales

- Signup (email + password) → Cognito crea usuario en estado UNCONFIRMED y envía OTP por email.
- Confirmación (OTP) → Usuario pasa a CONFIRMED. Los tokens (Id/Access/Refresh) solo se entregan después de confirmar, para todos los tipos de usuario.
- Signin → Entrega `IdToken`, `AccessToken` y `RefreshToken`. El `IdToken` contendrá grupos en `cognito:groups` si el usuario tiene roles asignados.
- Refresh (opcional) → Uso de `RefreshToken` para renovar tokens sin credenciales.
- Social (Google/Facebook/Apple) → Alta/login como `prospect` por defecto; si aplica OTP según configuración del IdP/Cognito Hosted UI, los tokens se emiten tras la autenticación/confirmación. Insertar rol por defecto en `UserRoles` y registrar sesión como en `signin`.
 - Recuperación → En `flow: "recovery"`, Cognito puede emitir nuevos tokens al completar el proceso; propagar `accessToken`, `refreshToken`, `expiration` si están disponibles.

### 5) Atributos y grupos

- Atributo principal: `email` (username).
- Atributos adicionales opcionales: nombre, teléfono, etc. (definiremos en implementación si se persisten en Cognito o fuera).
- Asignación de grupos:
  - Por defecto: usuarios del portal podrían ir a `CUSTOMER`/`TENANT`/`BUYER` según el caso.
  - Backoffice: asignados manualmente o por flujo de invitación a `BACKOFFICE_*`.
 - Rol canónico: se deriva de la asociación principal en `UserRoles` (catálogo `Roles`); no existe `userRoleId` en `Users`.

### 6) Variables de entorno (Lambda)

- `COGNITO_REGION`
- `COGNITO_BACKOFFICE_USER_POOL_ID`
- `COGNITO_BACKOFFICE_CLIENT_ID`
- `COGNITO_BACKOFFICE_CLIENT_SECRET` (opcional; si está presente se enviará `SECRET_HASH`)
- `COGNITO_PORTAL_USER_POOL_ID`
- `COGNITO_PORTAL_CLIENT_ID`

Directrices:
- Cuando exista secret, calcularemos `SECRET_HASH` (HMAC-SHA256 Base64) para las operaciones que lo requieran.
- Mantendremos los IDs/secret fuera del código fuente (parámetros SAM/Secrets en CI/CD).
 - Para Portal (SPA) no se requiere ni se envía `SECRET_HASH`.

### 7) Seguridad y buenas prácticas

- Forzar `Content-Type: application/json` y parseo seguro del body.
- Validaciones mínimas de entrada en los casos de uso.
 - Enviar `SECRET_HASH` únicamente cuando el cliente tenga secret (Backoffice).
- Uso de `cognito:groups` para autorización coarse-grained; validaciones finas podrán resolverse en servicios downstream.
- Configurar políticas IAM mínimas para que la Lambda invoque Cognito (signUp, confirmSignUp, initiateAuth, respondToAuthChallenge, etc.).
 - Portal (SPA): preferir SRP (USER_PASSWORD_AUTH) y/o PKCE con Hosted UI; no `SECRET_HASH`.

### 8) Despliegue y configuración

- SAM Template parametrizado con: región, `UserPoolIds` (backoffice y portal), `ClientId(s)` y `ClientSecret` del backoffice (opcional).
- Entornos: dev/staging/prod con sus propios User Pools y App Clients.
- CI/CD (GitHub Actions): los parámetros se inyectarán desde Secrets.

### 9) Documentación y OpenAPI

- Las rutas se declararán en `src/infrastructure/http/HTTPRouter.ts` siguiendo el template del proyecto.
- `npm run generate:openapi` actualizará `deployment/aws/openapi/openapi.yaml` a partir del router.

### 10) Próximos pasos (implementación)

1. Crear casos de uso: `SignUp`, `ConfirmSignUp`, `SignIn`, `Resend`, `Recovery`, `ChangePassword`, `Refresh`.
2. Crear handlers HTTP en `interfaces/http` y rutas en `HTTPRouter.ts` bajo `/auth/*`.
3. Gestionar cálculo de `SECRET_HASH` condicionado al uso de cliente con secret.
4. Añadir pruebas unitarias de cada flujo y generación de OpenAPI.

Este README define el “qué” y las decisiones de alto nivel. La siguiente etapa será materializar estos endpoints y flujos conforme a la arquitectura hexagonal del repo y a la guía `CREATING_ENDPOINTS.md`.


