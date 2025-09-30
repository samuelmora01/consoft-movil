## Plan de Autenticación (Alto Nivel) — Portal Inmobiliario

Este README describe a alto nivel qué construiremos en este Lambda para autenticación usando Amazon Cognito, y cómo se relaciona con las tablas del dominio definidas en `docs/tables.d.ts`.

### Objetivo

- Habilitar registro, verificación por OTP (email), inicio de sesión y gestión básica de sesiones para dos aplicaciones: Backoffice y Portal de Usuarios.
- Emitir tokens JWT (ID/Access/Refresh) y exponer en el JWT los grupos de Cognito para autorización a alto nivel.
- Persistir información de usuario, perfiles y actividad en nuestras tablas para reporting, permisos finos y features futuras.

### Componentes Cognito

- Dos User Pools por ambiente (email como identificador):
  - Backoffice User Pool.
  - Portal User Pool.
- App Clients por pool:
  - Backoffice (confidential, con secret) → requiere `SECRET_HASH`.
  - Portal (public, sin secret) → no requiere `SECRET_HASH`.
- Grupos (roles macro) en Cognito para reflejar el rol principal en el JWT:
  - `BACKOFFICE_ADMIN`, `BACKOFFICE_OPERATOR`
  - `AGENT`, `LANDLORD`, `TENANT`/`BUYER`

### Mapeo con tablas de dominio (docs/tables.d.ts)

- `Users`
  - `id`: usaremos el `sub` de Cognito como UUID del usuario (o UUID local según el flujo, pero referenciable con `sub`).
  - `email`: email de Cognito.
  - `status`: `"unconfirmed"` tras `signup`; `"confirmed"` después de `/auth/confirm`; `"suspended"` si aplica.
  - `userTypeId`: FK a `UserTypes`. Puede actualizarse (ej. a `real-estate-agent`) al aprobar membresía.
  - `countryId`, `createdAt`, `updatedAt`.

- `UserTypes`
  - Catálogo de tipos de usuario (ej. `owner`, `real-estate-agent`, `interested-user`, etc.).
  - Se usa para defaulting de flujos y vistas; no necesariamente controla permisos.

- `Roles` y `Permissions`
  - Fuente de verdad para autorización fina (RBAC/ABAC) dentro del dominio.
  - Un subconjunto se reflejará como grupos de Cognito para autorización coarse-grained vía JWT (`cognito:groups`).

- `UserRoles` (tabla de asociación usuario-rol)
  - Estructura: `id` (UUID), `userId` (string), `roleId` (string), `createdAt` (string), `updatedAt` (string).
  - Propósito: permitir múltiples roles por usuario. `userId` referencia `Users.id`; `roleId` referencia el catálogo de roles del dominio.
  - Relación con `Users`: no existe campo `userRoleId` en `Users`. El rol canónico expuesto en Cognito (grupos) se deriva de la asociación principal del usuario en `UserRoles` (según reglas de prioridad del dominio). `UserRoles` almacena todas las asociaciones usuario↔rol para permisos finos, auditoría y consultas.
  - Regla operativa: al asignar un rol por defecto en signup, también se inserta el par (`userId`, `roleId`) en `UserRoles`.

- `PersonProfile` y `OrgProfile`
  - Perfiles extendidos para personas u organizaciones.
  - Se crean/actualizan post-signup según el tipo de usuario.

- `Documents` y `DocumentTypes`
  - Gestión de documentos e identidad (KYC). No se usa en el flujo de autenticación base, pero se integra en pasos posteriores de verificación.

- `AgencyMembers` y `AgencyJoinCodes`
  - Flujos de membresía a agencias/organizaciones. Fuera del alcance del MVP de auth, pero el diseño de usuarios lo habilita.

- `Sessions`
  - Registro de sesiones (último acceso, plataforma, IP, geo) tras cada login/refresh relevante.

### Endpoints previstos (prefijo /auth)

- POST `/auth/signup` — alta de usuario (queda `unconfirmed` en DB y Cognito).
- POST `/auth/confirm` — valida OTP (flow=`signup`) y actualiza `Users.status` a `confirmed`. NO devuelve tokens.
- POST `/auth/signin` — autentica en Cognito y devuelve tokens; registra `Sessions`.
- POST `/auth/recovery` — solicita link/código de recuperación (Cognito).
- POST `/auth/change-password` — cambia contraseña (flow=`recovery` | `change-password`).
- POST  `/auth/resend` — reenvía el código OTP
 - POST `/auth/refresh` — renueva tokens usando `refreshToken`; registra `Sessions`.

Notas de canal:
- Backoffice utiliza su User Pool dedicado y su App Client con secret (aplicaremos `SECRET_HASH`).
- Portal utiliza su User Pool dedicado y su App Client público (sin secret).

### Notas MVP1 y proveedores sociales (Google/Facebook/Apple)

- Para MVP1 no se contempla el rol "Constructora" en el catálogo de `Roles`.
- Alta/login mediante proveedores sociales (Google, Facebook, Apple):
  - Se crea el usuario con `UserTypes.code = "prospect"` por defecto.
  - Se omite la validación por OTP; Cognito emite tokens tras la autenticación con el IdP.
  - El usuario se considera confirmado; en `Users.status` se asigna `"confirmed"`.
  - Se registra la asociación de rol por defecto en `UserRoles` conforme a las reglas del dominio.
  - Las sesiones se registran igual que en `signin` (headers `appVersion`, `platform`, `ip`, `geo`).

### Flujos y reglas clave

- Signup
  - Siempre crea usuario en Cognito en estado `UNCONFIRMED` y en DB con `status = "unconfirmed"`.
  - Crea entidades según tipo: `PersonProfile` (personas), `OrgProfile` (inmobiliarias), `Documents` y, si aplica luego de confirmar `real-estate`, `AgencyJoinCodes`.
  - No devuelve tokens en `signup`.

- Confirmación OTP (`/auth/confirm` con `flow=signup`)
  - Valida OTP para el `email`; actualiza `Users.status` a `confirmed`.
  - NO devuelve tokens (los tokens se obtienen posteriormente en `/auth/signin`).
  - NO crea sesiones (las sesiones se crean en `/auth/signin`).
  - Si el tipo es `real-estate`, genera `AgencyJoinCodes` tras confirmar.

- Signin
  - Autenticación en Cognito; devuelve tokens.
  - Registra `Sessions` (`appVersion`, `platform`, `ip`, `geo`).

- Roles y permisos
  - Rol canónico derivado de `UserRoles` (catálogo `Roles`)
  - Permisos finos consultados desde `Permissions` en servicios downstream.

### Variables de entorno (Lambda)

- `COGNITO_REGION`
- `COGNITO_BACKOFFICE_USER_POOL_ID`
- `COGNITO_BACKOFFICE_CLIENT_ID`
- `COGNITO_BACKOFFICE_CLIENT_SECRET` (opcional)
- `COGNITO_PORTAL_USER_POOL_ID`
- `COGNITO_PORTAL_CLIENT_ID`

Reglas:
- Enviar `SECRET_HASH` solo cuando exista `COGNITO_BACKOFFICE_CLIENT_SECRET`.
- Mantener credenciales/IDs vía parámetros de SAM/Secrets en CI/CD.

### Despliegue y documentación

- SAM template parametrizado para región, UserPoolIds (backoffice y portal) y App Clients.
- `HTTPRouter.ts` definirá las rutas; `npm run generate:openapi` producirá OpenAPI en `deployment/aws/openapi/openapi.yaml`.

### Fuera de alcance inmediato (pero contemplado)

- Vinculación a agencias mediante `AgencyJoinCodes`.
- Validaciones/documentos avanzados con `Documents`/`DocumentTypes`.
- Sincronización incremental de roles/permissions avanzados en JWT.

---

Con este plan, pasaremos a implementar los casos de uso, handlers y rutas siguiendo la guía `docs/CREATING_ENDPOINTS.md`, asegurando consistencia con las tablas del dominio.

### Flujo de Signup (owner/prospect)

Este es el primer caso de uso del endpoint `POST /auth/signup` cuando el `userTypeId` referencia un registro en `UserTypes` cuyo `id` corresponde a `owner` o `prospect`.

#### 1) Endpoint y payload

```json
{
  "userTypeId": "USER_TYPE_ID_OWNER_OR_PROSPECT",
  "firstName": "Carlos",
  "lastName": "Mora",
  "email": "carlos.mora@example.com",
  "document": {
    "documentTypeId": "CC",
    "documentNumber": "1023456789"
  },
  "birthDate": "2001-06-23",
  "password": "password123"
}
```

#### 2) Reglas iniciales

- Validar que el `email` no esté registrado.
- Validar que el documento no esté registrado (por `documentTypeId` + `documentNumber`).
- Aceptar el flujo solo si el `userTypeId` provisto corresponde a uno de `UserTypes.id` en {`owner`, `prospect`}.
- Requiere confirmación por OTP: tras `signup` se envía un código y el usuario queda `"unconfirmed"`.
- Este endpoint no devuelve tokens; los tokens se entregan en `/auth/confirm` al validar el OTP.

#### 3) Inserciones en tablas

- Users
  - `id`: UUID generado automáticamente (local para este flujo)
  - `email`: del body
  - `status`: `"unconfirmed"`
  - `userTypeId`: (id del body, FK a `UserTypes`)
  - `countryId`: `170` (Colombia)
  - `createdAt` / `updatedAt`: automáticos

- PersonProfile
  - `id`: UUID
  - `userId`: FK a `Users`
  - `firstName`, `lastName`, `birthDate`: del body
  - `hasOrgMembership`: `false`
  - `createdAt` / `updatedAt`: automáticos

- Documents
  - `id`: UUID
  - `userId`: FK a `Users`
  - `documentTypeId`: del body
  - `details`: `{ "documentNumber": <valor del body> }`
  - `createdAt` / `updatedAt`: automáticos

#### 4) Respuesta

Éxito:

```json
{
  "code": "PROCESS_OK",
  "msg": "Usuario registrado, pendiente de confirmación"
}
```

### Flujo de Signup (independent-agent)

Caso de uso del endpoint `POST /auth/signup` cuando el `userTypeId` referencia `UserTypes.id = "independent-agent"`.

#### 1) Endpoint y datos enviados

```json
{
  "userTypeId": "USER_TYPE_ID_INDEPENDENT_AGENT",
  "firstName": "Carlos",
  "lastName": "Mora",
  "email": "carlos.mora@example.com",
  "document": {
    "documentTypeId": "CC",
    "documentNumber": "1023456789"
  },
  "birthDate": "2001-06-23",
  "password": "password123"
}
```

#### 2) Paso inicial (signup)

- Validar que `email` y el documento (por `documentTypeId` + `documentNumber`) no existan previamente.
- Registrar usuario en Cognito.
-
 Persistir en BD con estado inicial `"unconfirmed"` en `Users`.
- Importante: este endpoint NO devuelve tokens. Los tokens se entregan posteriormente en `/auth/signin`.

#### 3) Inserciones en tablas

### a) Users

- `id`: uuid generado automáticamente
- `email`: (body)
- `status`: `"unconfirmed"`
- `userTypeId`: (id del body, FK a `UserTypes` con `id = "independent-agent"`)
- `countryId`: `170` (Colombia)
- `createdAt` / `updatedAt`: automáticos

### b) PersonProfile

- `id`: uuid
- `userId`: FK a `Users`
- `firstName`, `lastName`, `birthDate`: (body)
- `hasOrgMembership`: `false` (por defecto)
- `createdAt` / `updatedAt`: automáticos

### c) Documents

- `id`: uuid
- `userId`: FK a `Users`
- `documentTypeId`: (body)
- `details`: `{ documentNumber: (body) }`
- `createdAt` / `updatedAt`: automáticos

#### 4) Respuesta del endpoint

El endpoint responde únicamente con el estado de la operación:

```json
{
  "code": "PROCESS_OK",
  "msg": "Usuario registrado, pendiente de confirmación"
}
```

- No se retorna `accessToken`, `refreshToken` ni `expiration` en este paso.
- Los tokens se entregan posteriormente en `/auth/signin`.

Error (por ejemplo, email/documento ya usados):

```json
{
  "code": "BAD_REQUEST",
  "msg": "El correo o documento ya está en uso"
}
```

### Flujo de Signup (real-estate)

Caso de uso del endpoint `POST /auth/signup` cuando el `userTypeId` referencia `UserTypes.id = "real-estate"`.

#### 1) Endpoint y datos enviados

```json
{
  "userTypeId": "USER_TYPE_ID_REAL_ESTATE",
  "orgName": "Inmobiliaria1",
  "email": "inmobiliaria@example.com",
  "document": {
    "documentTypeId": "NIT",
    "documentNumber": "1023456789",
    "dv": 4
  },
  "password": "password123"
}
```

#### 2) Paso inicial (signup)

- Validar que `email` y el documento (NIT: `documentTypeId` + `documentNumber`) no estén registrados.
- Registrar usuario en Cognito → usuario queda `"unconfirmed"`.
- Nota importante:
  - `signup` solo prepara el usuario y sus entidades asociadas.
  - El flujo continúa por `/auth/confirm` (que genera `AgencyJoinCode` para real-estate) y luego `/auth/signin` para obtener tokens.

#### 3) Inserciones en tablas

### a) Users

- `id`: uuid
- `email`: (body)
- `status`: `"unconfirmed"`
- `userTypeId`: (id del body, FK a `UserTypes` con `id = "real-estate"`)
- `countryId`: `170`
- `createdAt` / `updatedAt`: automáticos

### b) OrgProfile

- `id`: uuid
- `userId`: FK a `Users`
- `orgName`: (body)
- `description`: `null`
- `createdAt` / `updatedAt`: automáticos

### c) Documents

- `id`: uuid
- `userId`: FK a `Users`
- `documentTypeId`: (body)
- `details`: `{ documentNumber: (body), dv: (body) }`
- `createdAt` / `updatedAt`: automáticos

### d) AgencyJoinCodes (después de /auth/confirm)

- `id`: uuid
- `orgProfileId`: FK a la inmobiliaria creada
- `joinCode`: código generado (6 caracteres alfanuméricos)
- `title`: "Código" + "OrgName" de la inmobiliaria
- `type`: `"multi-use"`
- `maxUses`: por defecto 3
- `expiresAt`: 2 años desde la fecha de generación
- `createdBy`: uuid (userId)
- `createdAt` / `updatedAt`: automáticos

#### 4) Respuesta del endpoint

- `/auth/signup`: responde solo estado (success/error), sin tokens.
- `/auth/confirm`: tras confirmar, NO devuelve tokens. Solo confirma al usuario.
- `/auth/signin`: para obtener tokens (`accessToken`, `refreshToken`, `expiration`).
- `AgencyJoinCode`: se genera después de confirmar para invitar agentes.

Ejemplo de respuesta de confirmación:

```json
{
  "code": "PROCESS_OK",
  "message": "Usuario confirmado exitosamente. Puedes proceder a iniciar sesión."
}
```

### Flujo de Confirmación (POST /auth/confirm)

#### 1) Endpoint y body de entrada

`POST /auth/confirm`

```json
{
  "email": "ejemplo@example.com",
  "code": "123456",
  "flow": "signup",
  "userTypeId": "REAL_ESTATE | PROPERTY_OWNER | INDEPENDENT_AGENT | PROSPECT"
}
```

#### 2) Validaciones y lógica principal

- Validar que el código OTP corresponda al `email` y que `flow === "signup"`.
- Si es válido:
  - Actualizar `Users.status` → `"confirmed"`.
  - NO registrar sesión (las sesiones se crean en `/auth/signin`).
- Cambio clave:
  - El endpoint `/auth/confirm` NO devuelve tokens.
  - Los tokens se obtienen posteriormente en `/auth/signin`.
  - Solo se encarga de confirmar al usuario y generar `AgencyJoinCode` si es necesario.

#### 3) Inserciones/updates en tablas

### a) Users

- `status`: `"confirmed"`
- `updatedAt`: automático

### b) AgencyJoinCodes (solo si el usuario confirmado es de tipo `REAL_ESTATE`)

- Generar código permanente asociado al `OrgProfile` de la inmobiliaria para invitar agentes.
- `expiresAt`: 2 años desde la fecha de generación.
- `maxUses`: 3 por defecto.
- `type`: `"multi-use"`.

#### 4) Respuesta del endpoint

El endpoint `/auth/confirm` NO devuelve tokens:

```json
{
  "code": "PROCESS_OK",
  "message": "Usuario confirmado exitosamente. Puedes proceder a iniciar sesión."
}
```

- `independent-agent`: confirmado, debe hacer `/auth/signin` para obtener tokens.
- `real-estate`: confirmado, se genera su `AgencyJoinCode`, debe hacer `/auth/signin` para obtener tokens.
- `owner/prospect`: confirmado, debe hacer `/auth/signin` para obtener tokens.

### Flujos de Reset Password

#### 1) Solicitar recuperación — `POST /auth/recovery`

**a) Body (entrada)**

```json
{
  "email": "carlos.mora@example.com"
}
```

**b) ¿Qué hace?**
Llama a Cognito para enviar un correo con el link de recuperación de contraseña.

**c) Cambios en tablas**
No escribe en tablas de BD.

**d) Respuesta**

```json
{
  "code": "PROCESS_OK" | "BAD_REQUEST",
  "msg": "",
  "data": {}
}
```

---

#### 2) Cambiar contraseña — `POST /auth/change-password`

> Se usa tanto para el flujo de recuperación (usuario desde link) como para cambio autenticado (usuario recuerda la contraseña). Se diferencia por `flow`.

### a) Body (entrada)

Opción A — `flow: "recovery"`

```json
{
  "email": "carlos.mora@example.com",
  "password": "NuevaPassword#2025",
  "flow": "recovery"
}
```

Opción B — `flow: "change-password"`

```json
{
  "email": "carlos.mora@example.com",
  "lastPassword": "Anterior#2024",
  "newPassword": "NuevaPassword#2025",
  "flow": "change-password"
}
```

### b) ¿Qué hace?

- Valida `flow`.
  - Si `flow === "recovery"`: aplica la nueva contraseña indicada en `password`.
  - Si `flow === "change-password"`: verifica `lastPassword` y, si es correcta, establece `newPassword`.
- Toda la operación se realiza en Cognito.
  - Tokens: en `flow: "recovery"`, Cognito puede emitir nuevos tokens al completar la confirmación de contraseña; debemos validar y propagar `accessToken`, `refreshToken`, `expiration` en la respuesta según disponibilidad.

### c) Cambios en tablas

No hay escrituras en tablas de BD.

### d) Respuesta

Para `flow: "change-password"`:

```json
{
  "code": "PROCESS_OK" | "BAD_REQUEST",
  "msg": "",
  "data": {}
}
```

Para `flow: "recovery"`:

```json
{
  "code": "PROCESS_OK" | "BAD_REQUEST",
  "msg": "",
  "data": {
    "accessToken": "…",
    "refreshToken": "…",
    "expiration": "2025-09-10T22:00:00Z"
  }
}
```

> En recovery se devuelven tokens; en cambio autenticado, `data` es vacío.

### Flujo de Signin (POST /auth/signin)

#### 1) Endpoint y body de entrada

`POST /auth/signin`

Body:

```json
{
  "email": "carlos.mora@example.com",
  "password": "password123"
}
```

#### 2) Lógica principal

- Validaciones básicas: presencia y formato de `email`, presencia de `password`.
- Autenticación: invocar Cognito para verificar credenciales; si son correctas, iniciar sesión.
- Manejo de errores: credenciales inválidas o usuario bloqueado (según Cognito) → `BAD_REQUEST` con mensaje.
  - Nota sobre headers: en `geo` solo se aceptan `latitude` y `longitude` (o alias `lat`/`lng`). Cualquier otro campo será descartado.

#### 3) Inserciones / actualizaciones en tablas

### a) Sessions (registro de la sesión iniciada)

- `id`: uuid (auto)
- `userId`: FK al usuario autenticado
- `lastSession`: automático (momento del login)
- `appVersion`: headers
- `platform`: headers
- `ip`: headers
- `geo`: headers
- `createdAt` / `updatedAt`: automáticos

> Nota: el flujo de signin no crea ni modifica `Users`/perfiles; solo registra la nueva sesión.

#### 4) Respuesta del endpoint

Éxito (tokens emitidos por Cognito):

```json
{
  "code": "PROCESS_OK",
  "msg": "",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiration": "2025-09-10T22:00:00Z"
  }
}
```

Error (ejemplos):

```json
{
  "code": "BAD_REQUEST",
  "msg": "Credenciales inválidas"
}
```

### Reenvío de código OTP (POST /auth/resend)

#### 1) Endpoint y body de entrada

`POST /auth/resend`

```json
{
  "email": "ejemplo@example.com",
  "flow": "signup"
}
```

#### 2) ¿Qué hace?

- Reenvía el código OTP al correo indicado usando Cognito.
- Validaciones básicas: presencia y formato de `email`; `flow` obligatorio.
- Si `flow === "signup"`: invoca el reenvío del código de confirmación de registro.
- No hay escrituras en tablas de BD.

#### 3) Respuesta del endpoint

```json
{
  "code": "PROCESS_OK" | "BAD_REQUEST",
  "msg": "",
  "data": {}
}
```

### Refresh de Token (POST /auth/refresh)

#### 1) Endpoint y body de entrada

`POST /auth/refresh`

```json
{
  "refreshToken": "eyJraWQiOiJ..."
}
```

#### 2) Lógica principal

- Validaciones básicas: presencia de `refreshToken`.
- Intercambia el `refreshToken` en Cognito para obtener nuevos tokens.
- Registra/actualiza una `Session` con info de headers (`appVersion`, `platform`, `ip`, `geo`).

#### 3) Inserciones / actualizaciones en tablas

### a) Sessions

- `id`: uuid (auto)
- `userId`: FK al usuario dueño del token
- `lastSession`: automático (momento del refresh)
- `appVersion`, `platform`, `ip`, `geo`: headers
- `createdAt` / `updatedAt`: automáticos

#### 4) Respuesta del endpoint

Éxito (tokens emitidos por Cognito):

```json
{
  "code": "PROCESS_OK",
  "msg": "",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiration": "2025-09-10T22:00:00Z"
  }
}
```

Error (ejemplos):

```json
{
  "code": "BAD_REQUEST",
  "msg": "Refresh token inválido o expirado"
}
```