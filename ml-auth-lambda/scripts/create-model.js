#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Obtener el nombre del modelo desde argumentos
const modelName = process.argv[2];

if (!modelName) {
  console.error('❌ Error: Debes proporcionar el nombre del modelo');
  console.log('💡 Uso: npm run create:model <NombreDelModelo>');
  console.log('📝 Ejemplo: npm run create:model Product');
  process.exit(1);
}

// Capitalizar la primera letra del modelo
const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

// Rutas donde se crearán los archivos
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

// Verificar si los archivos ya existen
if (fs.existsSync(entityFilePath)) {
  console.error(`❌ Error: La entidad ${capitalizedModelName} ya existe en ${entityFilePath}`);
  process.exit(1);
}

if (fs.existsSync(repositoryFilePath)) {
  console.error(`❌ Error: La interfaz I${capitalizedModelName}Repository ya existe en ${repositoryFilePath}`);
  process.exit(1);
}

if (fs.existsSync(dynamoRepositoryFilePath)) {
  console.error(`❌ Error: El repositorio Dynamo${capitalizedModelName}Repository ya existe en ${dynamoRepositoryFilePath}`);
  process.exit(1);
}

if (fs.existsSync(modelFilePath)) {
  console.error(`❌ Error: El modelo ${capitalizedModelName}Model ya existe en ${modelFilePath}`);
  process.exit(1);
}

if (fs.existsSync(configFilePath)) {
  console.error(`❌ Error: La configuración ${capitalizedModelName}RepositoryConfig ya existe en ${configFilePath}`);
  process.exit(1);
}

// Template de la entidad
const entityTemplate = `export class ${capitalizedModelName} {
  id: string;

  constructor(
    id: string
  ) {
    this.id = id;
  }
}
`;

// Template de la interfaz del repositorio
const repositoryTemplate = `import { ${capitalizedModelName} } from "../entities/${capitalizedModelName}";
import { IRepository } from "./IRepository";

export interface I${capitalizedModelName}Repository extends IRepository<${capitalizedModelName}> {
  // You can add specific methods for ${capitalizedModelName} repository here
  // For example: findByName(name: string): Promise<${capitalizedModelName} | null>;
}
`;

// Template del DynamoRepository
const dynamoRepositoryTemplate = `import { I${capitalizedModelName}Repository } from '../../../domain/repositories/I${capitalizedModelName}Repository';
import { ${capitalizedModelName} } from '../../../domain/entities/${capitalizedModelName}';
import { ${capitalizedModelName}_Model } from '../../../domain/models/db/dynamo/${capitalizedModelName}Model';
import { DynamoRepository } from './base/DynamoRepository';

export class Dynamo${capitalizedModelName}Repository extends DynamoRepository<${capitalizedModelName}> implements I${capitalizedModelName}Repository {
  
  constructor() {
    super(${capitalizedModelName}_Model);
  }

  protected mapToEntity(item: any): ${capitalizedModelName} {
    return new ${capitalizedModelName}(item.id);
  }
}
`;

// Template del modelo DynamoDB
const modelTemplate = `import dynamoose, { model } from 'dynamoose';

const EntityName = '${capitalizedModelName}';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  }
  // Add more properties here as needed

}, {
  timestamps: true,
  saveUnknown: false
});

export const ${capitalizedModelName}_Model = model(EntityName, schema, { create: true, waitForActive: true});
`;

// Template del archivo de configuración
const configTemplate = `import { container } from "tsyringe";
import { I${capitalizedModelName}Repository } from "../../../domain/repositories/I${capitalizedModelName}Repository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { Dynamo${capitalizedModelName}Repository } from "../../adapters/dynamo/Dynamo${capitalizedModelName}Repository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.${capitalizedModelName.toUpperCase()}_REPOSITORY;

let repoClass: RepositoryConstructor<I${capitalizedModelName}Repository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = Dynamo${capitalizedModelName}Repository;
    break;  
  default:
    repoClass = Dynamo${capitalizedModelName}Repository;
}

container.register<I${capitalizedModelName}Repository>("I${capitalizedModelName}Repository", {
  useClass: repoClass
});
`;

try {
  // Crear los directorios si no existen
  if (!fs.existsSync(entitiesDir)) {
    fs.mkdirSync(entitiesDir, { recursive: true });
  }
  
  if (!fs.existsSync(repositoriesDir)) {
    fs.mkdirSync(repositoriesDir, { recursive: true });
  }
  
  if (!fs.existsSync(dynamoDir)) {
    fs.mkdirSync(dynamoDir, { recursive: true });
  }
  
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  if (!fs.existsSync(containerDir)) {
    fs.mkdirSync(containerDir, { recursive: true });
  }

  // Escribir los archivos
  fs.writeFileSync(entityFilePath, entityTemplate);
  fs.writeFileSync(repositoryFilePath, repositoryTemplate);
  fs.writeFileSync(dynamoRepositoryFilePath, dynamoRepositoryTemplate);
  fs.writeFileSync(modelFilePath, modelTemplate);
  fs.writeFileSync(configFilePath, configTemplate);

  // Actualizar el index.ts del contenedor
  if (fs.existsSync(containerIndexPath)) {
    let indexContent = fs.readFileSync(containerIndexPath, 'utf8');
    const importLine = `import "./repositories/${capitalizedModelName}RepositoryConfig";`;
    
    // Verificar si la importación ya existe
    if (!indexContent.includes(importLine)) {
      // Buscar la última importación de repositorio y agregar después
      const repositoryImportRegex = /import "\.\/repositories\/.*RepositoryConfig";/g;
      const matches = [...indexContent.matchAll(repositoryImportRegex)];
      
      if (matches.length > 0) {
        // Insertar después de la última importación de repositorio
        const lastMatch = matches[matches.length - 1];
        const insertIndex = lastMatch.index + lastMatch[0].length;
        indexContent = indexContent.slice(0, insertIndex) + '\n' + importLine + indexContent.slice(insertIndex);
      } else {
        // Si no hay importaciones de repositorio, agregar al principio
        indexContent = importLine + '\n' + indexContent;
      }
      
      fs.writeFileSync(containerIndexPath, indexContent);
    }
  }

  console.log('✅ Archivos creados exitosamente!');
  console.log('');
  console.log('📁 Entidad:');
  console.log(`   📄 ${entityFilePath}`);
  console.log(`   🏗️  Clase: ${capitalizedModelName}`);
  console.log('');
  console.log('📁 Interfaz del Repositorio:');
  console.log(`   📄 ${repositoryFilePath}`);
  console.log(`   🔌 Interfaz: I${capitalizedModelName}Repository`);
  console.log('');
  console.log('📁 Implementación DynamoDB:');
  console.log(`   📄 ${dynamoRepositoryFilePath}`);
  console.log(`   🔧 Clase: Dynamo${capitalizedModelName}Repository`);
  console.log('');
  console.log('📁 Modelo DynamoDB:');
  console.log(`   📄 ${modelFilePath}`);
  console.log(`   💾 Modelo: ${capitalizedModelName}_Model`);
  console.log('');
  console.log('📁 Configuración de Inyección:');
  console.log(`   📄 ${configFilePath}`);
  console.log(`   ⚙️  Config: ${capitalizedModelName}RepositoryConfig`);
  console.log(`   🌍 Variable: ${capitalizedModelName.toUpperCase()}_REPOSITORY`);
  console.log('');
  console.log('📝 Próximos pasos recomendados:');
  console.log(`   1. Agregar propiedades específicas a la clase ${capitalizedModelName}`);
  console.log(`   2. Actualizar el schema en ${capitalizedModelName}Model con las propiedades necesarias`);
  console.log(`   3. Actualizar mapToEntity() en Dynamo${capitalizedModelName}Repository con las propiedades correctas`);
  console.log(`   4. Agregar variable de entorno ${capitalizedModelName.toUpperCase()}_REPOSITORY=DYNAMO`);
  console.log(`   5. Agregar métodos específicos a I${capitalizedModelName}Repository si es necesario`);
  console.log(`   ✅ La importación en el contenedor se agregó automáticamente!`);

} catch (error) {
  console.error('❌ Error al crear los archivos:', error.message);
  process.exit(1);
}
