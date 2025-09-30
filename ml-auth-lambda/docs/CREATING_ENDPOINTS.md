# 🚀 Guía para Crear Nuevos Endpoints

Esta guía te ayudará a crear nuevos endpoints en el proyecto siguiendo la arquitectura establecida y las mejores prácticas implementadas.

## 📋 Tabla de Contenidos

- [Prerequisitos](#prerequisitos)
- [Paso 1: Crear el Modelo](#paso-1-crear-el-modelo)
- [Paso 2: Crear la Entidad](#paso-2-crear-la-entidad)
- [Paso 3: Crear el Repositorio](#paso-3-crear-el-repositorio)
- [Paso 4: Crear los Use Cases](#paso-4-crear-los-use-cases)
- [Paso 5: Crear los Handlers HTTP](#paso-5-crear-los-handlers-http)
- [Paso 6: Configurar el Router](#paso-6-configurar-el-router)
- [Paso 7: Configurar la Inyección de Dependencias](#paso-7-configurar-la-inyección-de-dependencias)
- [Paso 8: Generar Documentación OpenAPI](#paso-8-generar-documentación-openapi)
- [Paso 9: Testing](#paso-9-testing)
- [Ejemplo Completo](#ejemplo-completo)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisitos

- Node.js instalado
- Dependencias del proyecto instaladas (`npm install`)
- Conocimiento básico de TypeScript y arquitectura hexagonal

## 📝 Paso 1: Crear el Modelo

**IMPORTANTE**: Siempre comienza ejecutando el comando de creación de modelos. Este script automatiza la creación de todos los archivos necesarios.

```bash
npm run create:model <NombreDelModelo>
```

**Ejemplo:**
```bash
npm run create:model Product
```

### ¿Qué hace este comando?

El script `create-model.js` crea automáticamente:

- ✅ **Entidad**: `src/domain/entities/Product.ts`
- ✅ **Interfaz del Repositorio**: `src/domain/repositories/IProductRepository.ts`
- ✅ **Implementación DynamoDB**: `src/infrastructure/adapters/dynamo/DynamoProductRepository.ts`
- ✅ **Modelo DynamoDB**: `src/domain/models/db/dynamo/ProductModel.ts`
- ✅ **Configuración de Inyección**: `src/infrastructure/container/repositories/ProductRepositoryConfig.ts`
- ✅ **Importación automática** en el contenedor principal

## 🏗️ Paso 2: Crear la Entidad

La entidad representa el dominio de tu negocio. El script ya crea una estructura básica, pero debes personalizarla:

```typescript
// src/domain/entities/Product.ts
export class Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  stock: number;

  constructor(
    id: string,
    name: string,
    price: number,
    category: string,
    stock: number,
    description?: string
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.category = category;
    this.stock = stock;
    this.description = description;
  }
}
```

## 🗄️ Paso 3: Crear el Repositorio

### 3.1 Interfaz del Repositorio

```typescript
// src/domain/repositories/IProductRepository.ts
import { Product } from "../entities/Product";
import { IRepository } from "./IRepository";

export interface IProductRepository extends IRepository<Product> {
  // Métodos específicos para Product
  findByName(name: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  updateStock(id: string, quantity: number): Promise<Product>;
}
```

### 3.2 Implementación DynamoDB

```typescript
// src/infrastructure/adapters/dynamo/DynamoProductRepository.ts
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { Product } from '../../../domain/entities/Product';
import { Product_Model } from '../../../domain/models/db/dynamo/ProductModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoProductRepository extends DynamoRepository<Product> implements IProductRepository {
  
  constructor() {
    super(Product_Model);
  }

  protected mapToEntity(item: any): Product {
    return new Product(
      item.id,
      item.name,
      item.price,
      item.category,
      item.stock,
      item.description
    );
  }

  async findByName(name: string): Promise<Product | null> {
    const result = await this.model.scan().where('name').eq(name).exec();
    return result.count > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const result = await this.model.scan().where('category').eq(category).exec();
    return result.map(item => this.mapToEntity(item));
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const updatedProduct = new Product(
      product.id,
      product.name,
      product.price,
      product.category,
      product.stock + quantity,
      product.description
    );
    
    return await this.update(updatedProduct);
  }
}
```

### 3.3 Modelo DynamoDB

```typescript
// src/domain/models/db/dynamo/ProductModel.ts
import dynamoose, { model } from 'dynamoose';

const EntityName = 'Product';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  saveUnknown: false
});

export const Product_Model = model(EntityName, schema, { create: true, waitForActive: true });
```

### ⚠️ **Configuración Importante para Creación Automática de Tablas**

La configuración `{ create: true, waitForActive: true }` en el modelo es **CRÍTICA** para el desarrollo:

- **`create: true`**: Permite que Dynamoose cree automáticamente la tabla en DynamoDB si no existe
- **`waitForActive: true`**: Espera a que la tabla esté completamente activa antes de continuar

**IMPORTANTE**: 
- ✅ **Desarrollo/Testing**: Mantén `create: true` para crear tablas automáticamente
- ⚠️ **Producción**: Considera cambiar a `create: false` si prefieres crear las tablas manualmente
- 🔒 **Seguridad**: Asegúrate de que tu rol de Lambda tenga permisos para crear tablas DynamoDB

## 🎯 Paso 4: Crear los Use Cases

Los use cases contienen la lógica de negocio:

```typescript
// src/application/use-cases/product/CreateProduct.ts
import { IResponse } from "serverless-request-manager";
import { IProductRepository } from "../../../domain/repositories/IProductRepository";
import { Product } from "../../../domain/entities/Product";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateProduct {
  constructor(
    @inject("IProductRepository")
    private productRepository: IProductRepository
  ) {}

  async execute(productData: any): Promise<IResponse> {
    try {
      // Validaciones
      if (!productData.name || !productData.price || !productData.category) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: 'Nombre, precio y categoría son requeridos'
          })
        };
      }

      // Crear entidad
      const product = new Product(
        productData.id || crypto.randomUUID(),
        productData.name,
        productData.price,
        productData.category,
        productData.stock || 0,
        productData.description
      );

      // Guardar en repositorio
      const savedProduct = await this.productRepository.create(product);

      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: savedProduct,
          message: 'Producto creado exitosamente'
        })
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }
}
```

## 🌐 Paso 5: Crear los Handlers HTTP

Los handlers conectan las peticiones HTTP con los use cases:

```typescript
// src/interfaces/http/productUseCases.ts
import { IResponse } from "serverless-request-manager";
import { IEvent } from "serverless-request-manager/dist/interfaces/IEvent";
import { container } from "../../infrastructure/container";
import CreateProduct from "../../application/use-cases/product/CreateProduct";
import GetProduct from "../../application/use-cases/product/GetProduct";
// ... otros imports

async function createProduct(event: IEvent): Promise<IResponse> {
  try {
    const createProductUseCase = container.resolve(CreateProduct);
    const productData = event.payload?.body || {};
    return await createProductUseCase.execute(productData);
  } catch (error) {
    console.error('Error in createProduct HTTP handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor'
      })
    };
  }
}

async function getProduct(event: IEvent): Promise<IResponse> {
  try {
    const getProductUseCase = container.resolve(GetProduct);
    const productId = event.payload?.pathParameters?.id;
    
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'ID del producto es requerido'
        })
      };
    }
    
    return await getProductUseCase.execute(productId);
  } catch (error) {
    console.error('Error in getProduct HTTP handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor'
      })
    };
  }
}

export const productUseCases = {
  create: createProduct,
  get: {
    byId: getProduct,
    // ... otros métodos
  }
};
```

## 🛣️ Paso 6: Configurar el Router

Agrega las rutas en el HTTPRouter:

```typescript
// src/infrastructure/http/HTTPRouter.ts
import { HttpRouter } from "aws-events-adapter";
import { userUseCases } from "../../interfaces/http/userUseCases";
import { propertyUseCases } from "../../interfaces/http/propertyUseCases";
import { productUseCases } from "../../interfaces/http/productUseCases"; // Nuevo import

export const httpRouter: HttpRouter = {
  get: {
    // ... rutas existentes
    '/products': {
      handler: productUseCases.get.all,
    },
    '/products/{id}': {
      handler: productUseCases.get.byId,
    },
    '/products/search': {
      handler: productUseCases.get.search,
    }
  },
  post: {
    // ... rutas existentes
    '/products': {
      handler: productUseCases.create,
    }
  },
  put: {
    '/products/{id}': {
      handler: productUseCases.update,
    }
  },
  delete: {
    '/products/{id}': {
      handler: productUseCases.delete,
    }
  }
};
```

## 🔌 Paso 7: Configurar la Inyección de Dependencias

### 7.1 Configuración del Repositorio

El script ya crea el archivo de configuración, pero asegúrate de que esté correcto:

```typescript
// src/infrastructure/container/repositories/ProductRepositoryConfig.ts
import { container } from "tsyringe";
import { IProductRepository } from "../../../domain/repositories/IProductRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoProductRepository } from "../../adapters/dynamo/DynamoProductRepository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.PRODUCT_REPOSITORY;

let repoClass: RepositoryConstructor<IProductRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoProductRepository;
    break;  
  default:
    repoClass = DynamoProductRepository;
}

container.register<IProductRepository>("IProductRepository", {
  useClass: repoClass
});
```

### 7.2 Variables de Entorno

Agrega la variable de entorno en tu archivo `.env`:

```bash
PRODUCT_REPOSITORY=DYNAMO
```

### 7.3 Importación en el Contenedor

El script ya agrega automáticamente la importación en `src/infrastructure/container/index.ts`:

```typescript
import "./repositories/UserRepositoryConfig";
import "./repositories/PropertyRepositoryConfig";
import "./repositories/ProductRepositoryConfig"; // Agregado automáticamente
//Import all repository configs for dependency injection

export { container } from "tsyringe";
```

## 📚 Paso 8: Generar Documentación OpenAPI

Después de crear todos los endpoints, genera la documentación automáticamente:

```bash
npm run generate:openapi
```

Este comando:
- Analiza el `HTTPRouter.ts`
- Detecta todas las rutas y métodos HTTP
- Genera la especificación OpenAPI en YAML
- Soporta múltiples plataformas (AWS, Generic)

### Ubicaciones de salida:
- **AWS**: `deployment/aws/openapi/openapi.yaml`
- **Generic**: `docs/openapi/openapi.yaml`

## 🧪 Paso 9: Testing

Crea tests para tus nuevos endpoints:

```typescript
// src/_tests_/infrastructure/http/productEndpoints.test.ts
import { productUseCases } from '../../../interfaces/http/productUseCases';

describe('Product Endpoints', () => {
  test('should create product successfully', async () => {
    const mockEvent = {
      payload: {
        body: {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          stock: 10
        }
      }
    };

    const response = await productUseCases.create(mockEvent);
    expect(response.statusCode).toBe(201);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Test Product');
  });
});
```

## 📖 Ejemplo Completo

Aquí tienes un ejemplo completo de cómo se vería un endpoint para "Product":

### Estructura de archivos creada:
```
src/
├── domain/
│   ├── entities/
│   │   └── Product.ts
│   ├── repositories/
│   │   └── IProductRepository.ts
│   └── models/db/dynamo/
│       └── ProductModel.ts
├── infrastructure/
│   ├── adapters/dynamo/
│   │   └── DynamoProductRepository.ts
│   └── container/repositories/
│       └── ProductRepositoryConfig.ts
├── application/use-cases/product/
│   ├── CreateProduct.ts
│   ├── GetProduct.ts
│   └── UpdateProduct.ts
└── interfaces/http/
    └── productUseCases.ts
```

### Flujo de ejecución:
1. **HTTP Request** → `HTTPRouter.ts`
2. **Handler** → `productUseCases.ts`
3. **Use Case** → `CreateProduct.ts`
4. **Repository** → `DynamoProductRepository.ts`
5. **Database** → DynamoDB

## 🚀 Comandos Útiles

```bash
# Crear un nuevo modelo completo
npm run create:model Product

# Generar documentación OpenAPI
npm run generate:openapi

# Construir el proyecto
npm run build

# Ejecutar tests
npm test

# Limpiar build
npm run clean
```

## ⚠️ Puntos Importantes a Recordar

### 🔑 Inyección de Dependencias
- **Siempre** usa `@injectable()` en tus use cases
- **Siempre** usa `@inject("INombreRepository")` para inyectar repositorios
- **Nunca** instancies repositorios directamente con `new`
- **Siempre** usa `container.resolve()` en los handlers HTTP

### 🗄️ Manejo de Base de Datos
- **Siempre** extiende de `DynamoRepository<T>` para nuevos repositorios
- **Siempre** implementa `mapToEntity()` correctamente
- **Siempre** valida los datos antes de guardar
- **Siempre** maneja errores de base de datos
- **Siempre** usa `{ create: true, waitForActive: true }` en modelos para desarrollo
- **Siempre** verifica permisos de creación de tablas en el rol de Lambda

### 🛣️ Configuración de Rutas
- **Siempre** agrega las rutas en `HTTPRouter.ts`
- **Siempre** sigue el patrón `methodUseCases.operation`
- **Siempre** usa parámetros de ruta para IDs: `/{id}`
- **Siempre** documenta las rutas con comentarios

### 📚 Documentación
- **Siempre** ejecuta `npm run generate:openapi` después de crear endpoints
- **Siempre** verifica que las rutas aparezcan en el OpenAPI generado
- **Siempre** mantén la documentación actualizada

## 🔧 Troubleshooting

### 🗄️ **Problemas Comunes con DynamoDB**

#### Error: "Table not found" o "Cannot find table"
- **Causa**: La tabla no existe y `create: false` está configurado
- **Solución**: Cambia a `{ create: true, waitForActive: true }` en el modelo
- **Verificación**: Asegúrate de que el rol de Lambda tenga permisos `dynamodb:CreateTable`

#### Error: "Access Denied" al crear tabla
- **Causa**: Falta de permisos en el rol de Lambda
- **Solución**: Agrega la política `AmazonDynamoDBFullAccess` o una personalizada con:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:CreateTable",
          "dynamodb:DescribeTable",
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        "Resource": "*"
      }
    ]
  }
  ```

#### Error: "Table is being created"
- **Causa**: La tabla se está creando pero `waitForActive: false`
- **Solución**: Cambia a `waitForActive: true` para esperar a que esté activa

### Error: "Cannot resolve dependency"
- Verifica que el repositorio esté registrado en el contenedor
- Asegúrate de que la variable de entorno esté configurada
- Verifica que la importación esté en `container/index.ts`

### Error: "Model not found"
- Verifica que el modelo DynamoDB esté correctamente definido
- Asegúrate de que el schema tenga las propiedades correctas
- Verifica que el nombre de la entidad coincida
- **Verifica que `create: true` esté configurado en el modelo**
- **Asegúrate de que el rol de Lambda tenga permisos para crear tablas DynamoDB**

### Error: "Route not found"
- Verifica que la ruta esté agregada en `HTTPRouter.ts`
- Asegúrate de que el handler esté correctamente referenciado
- Verifica que el use case exista y esté exportado

### OpenAPI no se genera
- Verifica que las rutas estén en el formato correcto en `HTTPRouter.ts`
- Asegúrate de que los handlers sigan el patrón `useCases.method`
- Verifica que no haya errores de sintaxis en el router

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa esta documentación
2. Verifica los logs de consola
3. Ejecuta `npm run build` para detectar errores de TypeScript
4. Revisa que todos los archivos estén en las ubicaciones correctas

---

**¡Recuerda!** Siempre comienza con `npm run create:model <Nombre>` para automatizar la creación de la estructura básica. 🎯
