const fs = require('fs');
const path = require('path');

// Validar argumentos
if (process.argv.length < 3) {
  console.error('❌ Error: Debes proporcionar el nombre del modelo');
  console.error('Uso: npm run delete:model <NombreDelModelo>');
  process.exit(1);
}

const modelName = process.argv[2];

// Validar que el nombre del modelo no esté vacío
if (!modelName || modelName.trim() === '') {
  console.error('❌ Error: El nombre del modelo no puede estar vacío');
  process.exit(1);
}

// Capitalizar la primera letra
const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

console.log(`🗑️  Eliminando modelo: ${capitalizedModelName}`);
console.log('');

// Rutas de los archivos a eliminar
const entitiesDir = path.join(__dirname, '../src/domain/entities');
const repositoriesDir = path.join(__dirname, '../src/domain/repositories');
const dynamoDir = path.join(__dirname, '../src/infrastructure/adapters/dynamo');
const modelsDir = path.join(__dirname, '../src/domain/models/db/dynamo');
const containerDir = path.join(__dirname, '../src/infrastructure/container/repositories');
const containerIndexPath = path.join(__dirname, '../src/infrastructure/container/index.ts');

const entityFilePath = path.join(entitiesDir, `${capitalizedModelName}.ts`);
const repositoryFilePath = path.join(repositoriesDir, `I${capitalizedModelName}Repository.ts`);
const dynamoRepositoryFilePath = path.join(dynamoDir, `Dynamo${capitalizedModelName}Repository.ts`);
const modelFilePath = path.join(modelsDir, `${capitalizedModelName}Model.ts`);
const configFilePath = path.join(containerDir, `${capitalizedModelName}RepositoryConfig.ts`);

// Lista de archivos a verificar y eliminar
const filesToDelete = [
  { path: entityFilePath, name: 'Entidad', icon: '📄' },
  { path: repositoryFilePath, name: 'Interfaz del Repositorio', icon: '🔌' },
  { path: dynamoRepositoryFilePath, name: 'Implementación DynamoDB', icon: '🔧' },
  { path: modelFilePath, name: 'Modelo DynamoDB', icon: '💾' },
  { path: configFilePath, name: 'Configuración de DI', icon: '⚙️' }
];

// Verificar qué archivos existen
const existingFiles = filesToDelete.filter(file => fs.existsSync(file.path));

if (existingFiles.length === 0) {
  console.log(`⚠️  No se encontraron archivos para el modelo ${capitalizedModelName}`);
  console.log('');
  console.log('Los siguientes archivos no existen:');
  filesToDelete.forEach(file => {
    console.log(`   ${file.icon} ${file.path}`);
  });
  process.exit(0);
}

console.log(`📋 Se encontraron ${existingFiles.length} archivo(s) para eliminar:`);
existingFiles.forEach(file => {
  console.log(`   ${file.icon} ${file.name}: ${file.path}`);
});
console.log('');

try {
  // Eliminar archivos
  let deletedCount = 0;
  existingFiles.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`✅ Eliminado: ${file.name}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Error eliminando ${file.name}: ${error.message}`);
    }
  });

  // Remover la importación del index.ts del contenedor
  if (fs.existsSync(containerIndexPath)) {
    let indexContent = fs.readFileSync(containerIndexPath, 'utf8');
    const importLine = `import "./repositories/${capitalizedModelName}RepositoryConfig";`;
    
    if (indexContent.includes(importLine)) {
      // Remover la línea de importación (incluyendo el salto de línea)
      indexContent = indexContent.replace(importLine + '\n', '');
      // Si no había salto de línea al final, intentar sin él
      indexContent = indexContent.replace(importLine, '');
      
      fs.writeFileSync(containerIndexPath, indexContent);
      console.log(`✅ Removida importación del index.ts del contenedor`);
    }
  }

  console.log('');
  console.log(`🎉 Eliminación completada!`);
  console.log(`   📊 Archivos eliminados: ${deletedCount}/${filesToDelete.length}`);
  console.log(`   🔄 Importación removida del contenedor`);
  console.log('');
  console.log(`💡 El modelo ${capitalizedModelName} ha sido completamente eliminado del proyecto.`);

} catch (error) {
  console.error('❌ Error durante la eliminación:', error.message);
  process.exit(1);
}
