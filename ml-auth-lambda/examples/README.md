# 🧪 Ejemplos y Pruebas para SignUp

Este directorio contiene ejemplos de requests y scripts para probar el endpoint de SignUp.

## 📁 Estructura

```
examples/
├── signup-requests/           # Casos de éxito
│   ├── owner-signup.json
│   ├── prospect-signup.json
│   ├── independent-agent-signup.json
│   ├── real-estate-signup.json
│   └── error-cases/          # Casos de error
│       ├── missing-email.json
│       ├── invalid-email.json
│       └── missing-document.json
├── test-signup.sh            # Script automatizado de pruebas
└── README.md                 # Este archivo
```

## 🚀 Usar el Script Automatizado

### Prerequisitos

```bash
# Instalar jq para formateo JSON (opcional)
brew install jq  # macOS
# o
sudo apt-get install jq  # Ubuntu

# Para pruebas locales, iniciar SAM
sam local start-api
```

### Ejecutar Pruebas

```bash
# Pruebas locales (con SAM local)
cd examples
./test-signup.sh local

# Pruebas en desarrollo
./test-signup.sh dev

# Pruebas en producción
./test-signup.sh prod
```

### Qué hace el script

1. **🌱 Seed de datos**: Crea UserTypes de prueba (solo local)
2. **✅ Casos de éxito**: Prueba los 4 flujos de signup
3. **❌ Casos de error**: Validaciones de entrada
4. **🔄 Casos de duplicados**: Emails/documentos ya registrados

## 📋 Pruebas Manuales con curl

### 1. Crear UserTypes (solo local)

```bash
curl -X POST http://localhost:3000/bootstrap/seed-user-types \
  -H "Content-Type: application/json"
```

### 2. SignUp Owner (genera tokens)

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-app-version: 1.0.0" \
  -H "x-platform: web" \
  -H "x-geo-location: CO" \
  -d @signup-requests/owner-signup.json
```

**Respuesta esperada (200):**
```json
{
  "code": "PROCESS_OK",
  "message": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiration": "2025-09-16T22:00:00Z"
  }
}
```

### 3. SignUp Independent Agent (sin tokens)

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-app-version: 1.0.0" \
  -H "x-platform: mobile" \
  -H "x-geo-location: CO" \
  -d @signup-requests/independent-agent-signup.json
```

**Respuesta esperada (200):**
```json
{
  "code": "PROCESS_OK",
  "message": {}
}
```

### 4. SignUp Real Estate (sin tokens)

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-app-version: 1.0.0" \
  -H "x-platform: web" \
  -H "x-geo-location: CO" \
  -d @signup-requests/real-estate-signup.json
```

**Respuesta esperada (200):**
```json
{
  "code": "PROCESS_OK", 
  "message": {}
}
```

## ❌ Casos de Error

### Email inválido

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d @signup-requests/error-cases/invalid-email.json
```

**Respuesta esperada (400):**
```json
{
  "code": "BAD_REQUEST",
  "message": "Formato de email inválido"
}
```

### Email duplicado

Ejecutar el mismo request dos veces:

**Respuesta esperada (400):**
```json
{
  "code": "BAD_REQUEST",
  "message": "El correo electrónico ya está registrado"
}
```

## 🔧 Personalizar Pruebas

### Modificar Datos de Prueba

Edita los archivos JSON en `signup-requests/`:

```json
{
  "userTypeId": "ut-owner-001",
  "firstName": "Tu Nombre",
  "lastName": "Tu Apellido", 
  "email": "tu.email@example.com",
  "document": {
    "documentTypeId": "CC",
    "documentNumber": "1234567890"
  },
  "birthDate": "1990-01-01",
  "password": "TuPassword123!"
}
```

### Agregar Headers Personalizados

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-app-version: 2.0.0" \
  -H "x-platform: ios" \
  -H "x-geo-location: MX" \
  -H "x-forwarded-for: 192.168.1.100" \
  -d @signup-requests/owner-signup.json
```

## 🐛 Troubleshooting

### SAM Local no responde

```bash
# Verificar que SAM esté corriendo
curl http://localhost:3000/bootstrap/seed-user-types

# Reiniciar SAM si es necesario
sam local start-api --port 3000
```

### Error "UserType not found"

```bash
# Ejecutar seed de UserTypes primero
curl -X POST http://localhost:3000/bootstrap/seed-user-types
```

### Error de Cognito

Si usas datos reales de Cognito, asegúrate de que:
1. Las variables de entorno están configuradas en `.env`
2. El User Pool y Client ID son correctos
3. Tienes permisos AWS configurados

### Error de DynamoDB

Para pruebas locales:
```bash
# DynamoDB local (si lo usas)
docker run -p 8000:8000 amazon/dynamodb-local

# O usar DynamoDB en AWS (configurar credenciales)
aws configure
```

## 📊 Interpretar Resultados

### Status Codes

- **200**: Éxito
- **400**: Error de validación (datos incorrectos)
- **500**: Error interno (Cognito, DynamoDB, etc.)

### Headers de Seguimiento

El sistema registra estos headers para análisis:
- `x-app-version`: Versión de la aplicación
- `x-platform`: Plataforma (web, mobile, ios, android)
- `x-geo-location`: Código de país
- `x-forwarded-for` / `x-real-ip`: IP del cliente
