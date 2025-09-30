const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Ejecutando test directo contra DynamoDB...\n');

try {
  // Compilar TypeScript si es necesario
  console.log('📦 Compilando TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Ejecutar el test
  console.log('\n🚀 Ejecutando test directo...\n');
  execSync('node dist/_tests_/manual/DirectDBTest.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error ejecutando test:', error.message);
  process.exit(1);
}
