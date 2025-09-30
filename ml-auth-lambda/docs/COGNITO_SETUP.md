# 🔐 Configuración de Amazon Cognito para SignIn

El endpoint `/oauth/signin` requiere que ciertos flujos de autenticación estén habilitados en el App Client de Cognito. Esta guía explica cómo configurar Cognito correctamente.

## 🚨 Error Resuelto

**Error**: `InvalidParameterException: Auth flow not enabled for this client`

**Causa**: Los flujos de autenticación necesarios no están habilitados en el App Client de Cognito.

## 🔧 Solución Implementada

El código ahora maneja **múltiples flujos de autenticación con fallback automático**:

1. **Intenta primero**: `USER_PASSWORD_AUTH` (más común)
2. **Si falla**: `ADMIN_NO_SRP_AUTH` (como fallback)

## ⚙️ Configuración Requerida en AWS Cognito

### 1. Acceder al User Pool

1. Ve a **AWS Console** → **Cognito** → **User pools**
2. Selecciona tu User Pool (definido en `COGNITO_PORTAL_USER_POOL_ID`)
3. Ve a la pestaña **App integration**
4. Encuentra y selecciona tu **App client** (definido en `COGNITO_PORTAL_CLIENT_ID`)

### 2. Habilitar Auth Flows

En la sección **Authentication flows**, asegúrate de que estén **habilitados**:

#### ✅ **Opción Mínima (Recomendada)**
- ☑️ `ALLOW_USER_PASSWORD_AUTH`
- ☑️ `ALLOW_REFRESH_TOKEN_AUTH`

#### ✅ **Opción Completa (Máxima Compatibilidad)**
- ☑️ `ALLOW_USER_PASSWORD_AUTH`
- ☑️ `ALLOW_ADMIN_USER_PASSWORD_AUTH` 
- ☑️ `ALLOW_REFRESH_TOKEN_AUTH`
- ☑️ `ALLOW_USER_SRP_AUTH` (opcional)

### 3. Configuración del App Client

Verifica que el App Client tenga:

- **Client type**: `Public client` o `Confidential client`
- **Auth flows**: Como se definió arriba
- **Token validity**: Configurado según tus necesidades

## 🧪 Testing

Después de la configuración, el endpoint debería funcionar:

```bash
POST /oauth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta esperada**:
```json
{
  "code": "PROCESS_OK",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "idToken": "eyJhbGciOi...",
    "expiration": "2025-09-18T23:00:00Z"
  }
}
```

## 🔍 Logs de Diagnóstico

Si el primer flujo falla, verás en los logs:

```
USER_PASSWORD_AUTH no habilitado, intentando con ADMIN_NO_SRP_AUTH...
```

## 📋 Variables de Entorno Requeridas

Asegúrate de que estén configuradas:

```bash
COGNITO_REGION=us-east-1
COGNITO_PORTAL_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_PORTAL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🛠️ Troubleshooting

### Error: `USER_PASSWORD_AUTH flow not enabled`
- Habilita `ALLOW_USER_PASSWORD_AUTH` en el App Client

### Error: `Auth flow not enabled for this client` (ambos flujos)
- Verifica que hayas configurado el App Client correcto
- Asegúrate de haber guardado los cambios en AWS Console
- Verifica las variables de entorno

### Error: `Access Denied`
- Verifica que el rol de Lambda tenga permisos `cognito-idp:InitiateAuth` y `cognito-idp:AdminInitiateAuth`
- Confirma que el User Pool ID sea correcto

## 🎯 Notas Importantes

1. **Seguridad**: `USER_PASSWORD_AUTH` es generalmente más seguro que `ADMIN_NO_SRP_AUTH`
2. **Rendimiento**: El código intenta el flujo más eficiente primero
3. **Compatibilidad**: El fallback asegura que funcione independientemente de la configuración
4. **Logs**: Los intentos de fallback se registran para debugging

## 📚 Referencias

- [AWS Cognito App Client Settings](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Auth Flow Types](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
