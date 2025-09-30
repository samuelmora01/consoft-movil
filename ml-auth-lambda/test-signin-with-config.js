require('reflect-metadata');

// Configurar variables de entorno básicas
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.COGNITO_REGION = 'us-east-1';

// CONFIGURACIÓN DE COGNITO - Reemplazar con valores reales
const COGNITO_CONFIG = {
  // TODO: Reemplazar con valores reales de tu User Pool de Cognito
  // Ejemplo: USER_POOL_ID: 'us-east-1_ABC123DEF',
  // Ejemplo: CLIENT_ID: '1a2b3c4d5e6f7g8h9i0j1k2l3m',
  USER_POOL_ID: process.env.COGNITO_PORTAL_USER_POOL_ID || 'us-east-1_TuUserPoolId',
  CLIENT_ID: process.env.COGNITO_PORTAL_CLIENT_ID || 'TuClientId'
};

// Configurar variables de entorno para el test
process.env.COGNITO_PORTAL_USER_POOL_ID = COGNITO_CONFIG.USER_POOL_ID;
process.env.COGNITO_PORTAL_CLIENT_ID = COGNITO_CONFIG.CLIENT_ID;
process.env.USER_REPOSITORY = 'DYNAMO';
process.env.SESSIONS_REPOSITORY = 'DYNAMO';

const { authUseCases } = require('./dist/interfaces/http/authUseCases');

async function testSignInWithRealUser() {
  console.log('🔐 PRUEBA DE SIGNIN - USUARIO REAL');
  console.log('================================');
  console.log('📧 Email: mlholdingcolombia@gmail.com');
  console.log('🔑 User Pool ID:', COGNITO_CONFIG.USER_POOL_ID);
  console.log('📱 Client ID:', COGNITO_CONFIG.CLIENT_ID);
  console.log('🌍 Región:', process.env.AWS_REGION);
  console.log('');
  
  // Verificar configuración
  if (COGNITO_CONFIG.USER_POOL_ID.includes('TuUserPoolId') || 
      COGNITO_CONFIG.CLIENT_ID.includes('TuClientId')) {
    console.log('⚠️  CONFIGURACIÓN REQUERIDA');
    console.log('Para ejecutar esta prueba, necesitas configurar:');
    console.log('');
    console.log('Opción 1 - Variables de entorno:');
    console.log('export COGNITO_PORTAL_USER_POOL_ID="us-east-1_XXXXXXXXX"');
    console.log('export COGNITO_PORTAL_CLIENT_ID="XXXXXXXXXXXXXXXXXXXXXXXXXX"');
    console.log('node test-signin-with-config.js');
    console.log('');
    console.log('Opción 2 - Editar el archivo test-signin-with-config.js:');
    console.log('Reemplazar "TuUserPoolId" y "TuClientId" con valores reales');
    console.log('');
    console.log('📚 Consultar docs/COGNITO_SETUP.md para más información');
    return;
  }
  
  try {
    // Simular evento HTTP del API Gateway
    const mockEvent = {
      payload: {
        body: {
          email: "mlholdingcolombia@gmail.com",
          password: "Especial2025!"
        },
        headers: {
          'appVersion': '1.0.0',
          'platform': 'web',
          'x-forwarded-for': '192.168.1.1',
          'geo': JSON.stringify({ 
            country: 'CO', 
            city: 'Bogotá',
            timezone: 'America/Bogota'
          })
        }
      },
      queryParams: {},
      token: null,
      requestContext: {
        requestId: 'test-request-id',
        stage: 'test'
      },
      eventRaw: {}
    };
    
    console.log('⏳ Ejecutando POST /oauth/signin...');
    console.log('');
    
    // Llamar al handler HTTP
    const startTime = Date.now();
    const result = await authUseCases.signIn(mockEvent);
    const duration = Date.now() - startTime;
    
    console.log('📊 RESULTADO DE LA PRUEBA');
    console.log('========================');
    console.log('⏱️  Tiempo de respuesta:', duration + 'ms');
    console.log('📡 Status Code:', result.statusCode);
    
    const body = JSON.parse(result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Estado: ÉXITO');
      console.log('📝 Código:', body.code);
      
      if (body.data) {
        console.log('');
        console.log('🎫 TOKENS GENERADOS:');
        console.log('-------------------');
        console.log('🔑 Access Token:', body.data.accessToken ? '✅ Generado (' + body.data.accessToken.length + ' chars)' : '❌ No generado');
        console.log('🔄 Refresh Token:', body.data.refreshToken ? '✅ Generado (' + body.data.refreshToken.length + ' chars)' : '❌ No generado');
        console.log('🆔 ID Token:', body.data.idToken ? '✅ Generado (' + body.data.idToken.length + ' chars)' : '❌ No generado');
        console.log('⏰ Expiración:', body.data.expiration);
        
        console.log('');
        console.log('🎉 ¡SIGNIN EXITOSO!');
        console.log('El endpoint /oauth/signin está funcionando correctamente');
        
        // Mostrar preview del token
        if (body.data.accessToken) {
          console.log('');
          console.log('🔍 Preview del Access Token:');
          console.log(body.data.accessToken.substring(0, 80) + '...');
        }
      }
      
    } else {
      console.log('❌ Estado: ERROR');
      console.log('📝 Código:', body.code || 'UNKNOWN');
      console.log('💬 Mensaje:', body.message || body.data || 'Error desconocido');
      
      console.log('');
      console.log('🔧 DIAGNÓSTICO DEL ERROR:');
      console.log('-------------------------');
      
      if (result.statusCode === 400) {
        console.log('🔍 Error 400 - Bad Request');
        
        if (body.message && body.message.includes('Usuario no encontrado')) {
          console.log('👤 Causa: El usuario no existe en la base de datos local');
          console.log('💡 Solución: Primero registrar el usuario con POST /oauth/signup');
        }
        
        if (body.message && body.message.includes('Credenciales inválidas')) {
          console.log('🔐 Causa: Email o contraseña incorrectos');
          console.log('💡 Verificar las credenciales en Cognito');
        }
        
        if (body.message && body.message.includes('no confirmado')) {
          console.log('✉️  Causa: Usuario no confirmado');
          console.log('💡 Solución: Primero confirmar con POST /oauth/confirm');
        }
      }
      
      if (result.statusCode === 500) {
        console.log('🔍 Error 500 - Internal Server Error');
        console.log('🔧 Posibles causas:');
        console.log('  - Error de configuración de Cognito');
        console.log('  - Auth flow no habilitado');
        console.log('  - Problema de permisos IAM');
        console.log('  - Error de conexión con AWS');
      }
    }
    
    console.log('');
    console.log('📄 Respuesta completa:');
    console.log(JSON.stringify(body, null, 2));
    
  } catch (error) {
    console.error('');
    console.error('💥 ERROR DURANTE LA EJECUCIÓN');
    console.error('=============================');
    console.error('📝 Mensaje:', error.message);
    console.error('🏷️  Tipo:', error.name || 'Error');
    
    if (error.message && error.message.includes('Auth flow not enabled')) {
      console.error('');
      console.error('🔧 SOLUCIÓN - AUTH FLOW ERROR:');
      console.error('1. Ir a AWS Console → Cognito → User pools');
      console.error('2. Seleccionar tu User Pool:', COGNITO_CONFIG.USER_POOL_ID);
      console.error('3. App integration → App clients → Seleccionar tu app client');
      console.error('4. Habilitar estos Authentication flows:');
      console.error('   ☑️ ALLOW_USER_PASSWORD_AUTH');
      console.error('   ☑️ ALLOW_REFRESH_TOKEN_AUTH');
      console.error('5. Guardar cambios');
      console.error('');
      console.error('📚 Ver docs/COGNITO_SETUP.md para guía detallada');
    }
    
    if (error.message && error.message.includes('Region is missing')) {
      console.error('');
      console.error('🔧 SOLUCIÓN - REGIÓN AWS:');
      console.error('export AWS_REGION=us-east-1');
      console.error('o configurar credenciales AWS');
    }
    
    console.error('');
    console.error('📋 Stack trace:');
    console.error(error.stack);
  }
}

// Ejecutar la prueba
console.log('🚀 Iniciando prueba de SignIn...');
testSignInWithRealUser()
  .then(() => {
    console.log('');
    console.log('🏁 Prueba completada');
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Error fatal en la prueba:', error.message);
    process.exit(1);
  });
