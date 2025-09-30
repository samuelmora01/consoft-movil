# 🧪 Testing del Endpoint SignIn

Esta guía explica cómo probar el endpoint `/oauth/signin` con el usuario real proporcionado.

## 📋 Usuario de Prueba

```json
{
  "email": "mlholdingcolombia@gmail.com",
  "password": "Especial2025!"
}
```

## 🚀 Ejecutar Prueba

### **Opción 1: Con Variables de Entorno (Recomendado)**

```bash
# Configurar variables de entorno
export COGNITO_PORTAL_USER_POOL_ID="us-east-1_TuUserPoolIdReal"
export COGNITO_PORTAL_CLIENT_ID="TuClientIdReal"

# Ejecutar prueba
node test-signin-with-config.js
```

### **Opción 2: Editando el Archivo**

1. Abrir `test-signin-with-config.js`
2. Reemplazar en las líneas 12-13:
   ```javascript
   USER_POOL_ID: 'us-east-1_TuUserPoolIdReal',
   CLIENT_ID: 'TuClientIdReal'
   ```
3. Ejecutar: `node test-signin-with-config.js`

## 📊 Resultado Esperado

### ✅ **Prueba Exitosa**
```
🎉 ¡SIGNIN EXITOSO!
El endpoint /oauth/signin está funcionando correctamente

🎫 TOKENS GENERADOS:
-------------------
🔑 Access Token: ✅ Generado (1234 chars)
🔄 Refresh Token: ✅ Generado (5678 chars)
🆔 ID Token: ✅ Generado (9012 chars)
⏰ Expiración: 2025-09-18T23:00:00Z
```

### ❌ **Errores Comunes**

#### **1. Auth Flow Not Enabled**
```
🔧 SOLUCIÓN - AUTH FLOW ERROR:
1. Ir a AWS Console → Cognito → User pools
2. Seleccionar tu User Pool
3. App integration → App clients → Seleccionar tu app client
4. Habilitar estos Authentication flows:
   ☑️ ALLOW_USER_PASSWORD_AUTH
   ☑️ ALLOW_REFRESH_TOKEN_AUTH
```

#### **2. Usuario No Encontrado**
```
👤 Causa: El usuario no existe en la base de datos local
💡 Solución: Primero registrar el usuario con POST /oauth/signup
```

#### **3. Usuario No Confirmado**
```
✉️ Causa: Usuario no confirmado
💡 Solución: Primero confirmar con POST /oauth/confirm
```

## 🔧 Prerrequisitos

### **1. Usuario Registrado y Confirmado**
El usuario debe existir y estar confirmado en:
- ✅ Amazon Cognito User Pool
- ✅ Base de datos local (tabla Users)

### **2. Configuración de Cognito**
- ✅ Auth flows habilitados (ver `docs/COGNITO_SETUP.md`)
- ✅ Variables de entorno configuradas
- ✅ Permisos IAM correctos

### **3. Dependencias**
```bash
npm install
npm run build
```

## 🔄 Flujo Completo de Prueba

Para probar el flujo completo desde cero:

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/oauth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "userTypeId": "PROPERTY_OWNER",
    "firstName": "ML",
    "lastName": "Holding",
    "email": "mlholdingcolombia@gmail.com",
    "document": {
      "documentTypeId": "CC",
      "documentNumber": "123456789"
    },
    "birthDate": "1990-01-01",
    "password": "Especial2025!"
  }'

# 2. Confirmar usuario (requiere código OTP del email)
curl -X POST http://localhost:3000/oauth/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mlholdingcolombia@gmail.com",
    "code": "123456",
    "flow": "signup"
  }'

# 3. Hacer SignIn
curl -X POST http://localhost:3000/oauth/signin \
  -H "Content-Type: application/json" \
  -H "appVersion: 1.0.0" \
  -H "platform: web" \
  -d '{
    "email": "mlholdingcolombia@gmail.com",
    "password": "Especial2025!"
  }'
```

## 📁 Archivos de Prueba

- `test-signin-with-config.js` - Script de prueba principal
- `docs/COGNITO_SETUP.md` - Configuración de Cognito
- `docs/TESTING_SIGNIN.md` - Esta guía

## 🎯 Lo Que Verifica la Prueba

1. **✅ Configuración**: Variables de entorno y Cognito
2. **✅ Validaciones**: Email y contraseña
3. **✅ Autenticación**: Conexión con Cognito
4. **✅ Base de Datos**: Usuario existe y está confirmado
5. **✅ Sesiones**: Creación de sesión con metadata
6. **✅ Tokens**: Generación de Access, Refresh e ID tokens
7. **✅ Respuesta**: Formato correcto de respuesta HTTP

## 📞 Soporte

Si tienes problemas:
1. Verificar `docs/COGNITO_SETUP.md`
2. Revisar logs del script de prueba
3. Confirmar configuración de AWS credentials
4. Verificar que el usuario esté registrado y confirmado
