import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config(); // Para testing local

// Configurar AWS para DynamoDB local testing
import dynamoose from "dynamoose";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

// Configurar cliente DynamoDB - usará credenciales por defecto (AWS CLI, IAM roles, etc.)
const ddbClient = new DynamoDB({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Configurar Dynamoose
dynamoose.aws.ddb.set(ddbClient);

import { DynamoUserRepository } from "../../infrastructure/adapters/dynamo/DynamoUserRepository";
import { DynamoUserTypesRepository } from "../../infrastructure/adapters/dynamo/DynamoUserTypesRepository";
import { DynamoPersonProfileRepository } from "../../infrastructure/adapters/dynamo/DynamoPersonProfileRepository";
import { DynamoOrgProfileRepository } from "../../infrastructure/adapters/dynamo/DynamoOrgProfileRepository";
import { DynamoDocumentsRepository } from "../../infrastructure/adapters/dynamo/DynamoDocumentsRepository";
import { DynamoSessionsRepository } from "../../infrastructure/adapters/dynamo/DynamoSessionsRepository";
import { DynamoDocumentTypesRepository } from "../../infrastructure/adapters/dynamo/DynamoDocumentTypesRepository";
import { DynamoRolesRepository } from "../../infrastructure/adapters/dynamo/DynamoRolesRepository";
import { DynamoUserRolesRepository } from "../../infrastructure/adapters/dynamo/DynamoUserRolesRepository";
import { User } from "../../domain/entities/User";
import { PersonProfile } from "../../domain/entities/PersonProfile";
import { Documents } from "../../domain/entities/Documents";
import { Sessions } from "../../domain/entities/Sessions";
import { DocumentTypes } from "../../domain/entities/DocumentTypes";
import { Roles } from "../../domain/entities/Roles";
import { UserRoles } from "../../domain/entities/UserRoles";
import { v4 as uuidv4 } from "uuid";

export class DirectDBTest {
  private userRepo = new DynamoUserRepository();
  private userTypesRepo = new DynamoUserTypesRepository();
  private personProfileRepo = new DynamoPersonProfileRepository();
  private orgProfileRepo = new DynamoOrgProfileRepository();
  private documentsRepo = new DynamoDocumentsRepository();
  private sessionsRepo = new DynamoSessionsRepository();
  private documentTypesRepo = new DynamoDocumentTypesRepository();
  private rolesRepo = new DynamoRolesRepository();
  private userRolesRepo = new DynamoUserRolesRepository();

  async testFullSignUpFlow() {
    console.log("🚀 Iniciando test directo contra DynamoDB...");
    
    try {
      // 1. Verificar que existe el UserType
      console.log("1. Verificando UserType PROPERTY_OWNER...");
      const userType = await this.userTypesRepo.findById("PROPERTY_OWNER");
      if (!userType) {
        throw new Error("UserType PROPERTY_OWNER no existe");
      }
      console.log("✅ UserType encontrado:", userType);

      // 2. Verificar que el email no existe
      const email = `test-${Date.now()}@example.com`;
      console.log(`2. Verificando que email ${email} no existe...`);
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        console.log("⚠️ Usuario ya existe, continuando...");
      } else {
        console.log("✅ Email disponible");
      }

      // 3. Crear usuario
      console.log("3. Creando usuario...");
      const userId = uuidv4();
      const user = new User(
        userId,
        email,
        'unconfirmed',
        'PROPERTY_OWNER',
        '170'
      );
      const createdUser = await this.userRepo.save(user);
      console.log("✅ Usuario creado:", createdUser);

      // 4. Crear PersonProfile
      console.log("4. Creando PersonProfile...");
      const personProfile = new PersonProfile(
        uuidv4(),
        userId,
        "Carlos",
        "Test",
        false,
        "1990-06-23"
      );
      const createdProfile = await this.personProfileRepo.save(personProfile);
      console.log("✅ PersonProfile creado:", createdProfile);

      // 5. Crear Document
      console.log("5. Creando Document...");
      const document = new Documents(
        uuidv4(),
        userId,
        "CC",
        {
          documentNumber: "1023456789",
          issuedBy: "Registraduría Nacional",
          issuedDate: "2010-01-01"
        }
      );
      const createdDocument = await this.documentsRepo.save(document);
      console.log("✅ Document creado:", createdDocument);

      // 6. Crear Session
      console.log("6. Creando Session...");
      const session = new Sessions(
        uuidv4(),
        userId,
        new Date().toISOString(),
        "1.0.0",
        "test",
        "127.0.0.1",
        "CO"
      );
      const createdSession = await this.sessionsRepo.save(session);
      console.log("✅ Session creada:", createdSession);

      console.log("\n🎉 ¡Test completo exitoso!");
      console.log("📋 Resumen:");
      console.log(`   - Usuario ID: ${userId}`);
      console.log(`   - Email: ${email}`);
      console.log(`   - UserType: ${userType.id}`);
      console.log(`   - PersonProfile ID: ${personProfile.id}`);
      console.log(`   - Document ID: ${document.id}`);
      console.log(`   - Session ID: ${session.id}`);

      return {
        success: true,
        userId,
        email,
        userType: userType.id
      };

    } catch (error) {
      console.error("❌ Error en test:", error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async testEmailDuplicateCheck() {
    console.log("\n🔍 Test: Verificación de email duplicado");
    
    try {
      const email = "test-duplicate@example.com";
      
      // Buscar usuario existente
      const existingUser = await this.userRepo.findByEmail(email);
      
      if (existingUser) {
        console.log("✅ Email duplicado detectado correctamente:", existingUser);
        return { success: true, found: true, user: existingUser };
      } else {
        console.log("ℹ️ Email no existe (correcto para email nuevo)");
        return { success: true, found: false };
      }
      
    } catch (error) {
      console.error("❌ Error en verificación de email:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async testUserTypeValidation() {
    console.log("\n🔍 Test: Validación de UserTypes");
    console.log("📋 Configuración AWS:");
    console.log(`   - Region: ${process.env.AWS_REGION}`);
    console.log(`   - Access Key: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET'}`);
    console.log(`   - Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET'}`);
    
    try {
      const userTypes = ['PROPERTY_OWNER', 'PROSPECT', 'INDEPENDENT_AGENT', 'REAL_ESTATE'];
      
      for (const userTypeId of userTypes) {
        const userType = await this.userTypesRepo.findById(userTypeId);
        if (userType) {
          console.log(`✅ ${userTypeId}:`, userType.description || 'Sin descripción');
        } else {
          console.log(`❌ ${userTypeId}: No encontrado`);
        }
      }
      
      // Test de userType inválido
      const invalidUserType = await this.userTypesRepo.findById("INVALID_TYPE");
      if (!invalidUserType) {
        console.log("✅ UserType inválido rechazado correctamente");
      }
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error en validación de UserTypes:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async testDocumentTypeValidation() {
    console.log("\n📋 Testeando DocumentTypes existentes...");
    
    try {
      const documentTypeIds = ['CC', 'NIT', 'CE'];
      
      for (const docTypeId of documentTypeIds) {
        console.log(`\n🔍 Verificando DocumentType: ${docTypeId}`);
        const documentType = await this.documentTypesRepo.findById(docTypeId);
        
        if (documentType) {
          console.log(`✅ ${docTypeId}:`, {
            id: documentType.id,
            attributes: documentType.attributes,
            countryId: documentType.countryId,
            createdAt: documentType.createdAt
          });
        } else {
          console.log(`❌ DocumentType ${docTypeId} no encontrado`);
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error en validación de DocumentTypes:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async testDynamicDocumentCreation() {
    console.log("\n🧪 Testeando creación dinámica de documentos...");
    
    try {
      // Test CC document
      console.log("\n1. Creando documento CC...");
      const ccDocType = await this.documentTypesRepo.findById('CC');
      if (ccDocType) {
        const details: Record<string, any> = {};
        for (const attr of ccDocType.attributes) {
          if (attr === 'documentNumber') {
            details.documentNumber = '123456789';
          }
        }
        
        const ccDocument = new Documents(
          uuidv4(),
          'test-user-id',
          'CC',
          details
        );
        
        console.log("✅ Documento CC creado:", {
          documentTypeId: ccDocument.documentTypeId,
          details: ccDocument.details
        });
      }

      // Test NIT document  
      console.log("\n2. Creando documento NIT...");
      const nitDocType = await this.documentTypesRepo.findById('NIT');
      if (nitDocType) {
        const details: Record<string, any> = {};
        for (const attr of nitDocType.attributes) {
          if (attr === 'documentNumber') {
            details.documentNumber = '900123456';
          } else if (attr === 'dv') {
            details.dv = 4;
          }
        }
        
        const nitDocument = new Documents(
          uuidv4(),
          'test-user-id',
          'NIT',
          details
        );
        
        console.log("✅ Documento NIT creado:", {
          documentTypeId: nitDocument.documentTypeId,
          details: nitDocument.details
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error en creación dinámica de documentos:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async testRoleValidation() {
    console.log("\n🎭 Testeando Roles existentes...");
    
    try {
      const roleCodes = ['ROLE_PROPERTY_OWNER', 'ROLE_PROSPECT', 'ROLE_INDEPENDENT_AGENT', 'ROLE_REAL_ESTATE'];
      
      for (const roleCode of roleCodes) {
        console.log(`\n🔍 Verificando Role: ${roleCode}`);
        const role = await this.rolesRepo.findByCode(roleCode);
        
        if (role) {
          console.log(`✅ ${roleCode}:`, {
            id: role.id,
            code: role.code,
            scope: role.scope,
            status: role.status,
            permissionsCount: role.permissions.length,
            description: role.description
          });
        } else {
          console.log(`❌ Role ${roleCode} no encontrado`);
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error en validación de Roles:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async testUserRoleAssignment() {
    console.log("\n🔗 Testeando asignación de UserRoles...");
    
    try {
      // Test crear una asociación UserRole
      const testUserId = uuidv4();
      const role = await this.rolesRepo.findByCode('ROLE_PROPERTY_OWNER');
      
      if (role) {
        const userRole = new UserRoles(
          uuidv4(),
          testUserId,
          role.id
        );
        
        console.log("✅ UserRole creado:", {
          id: userRole.id,
          userId: userRole.userId,
          roleId: userRole.roleId,
          createdAt: userRole.createdAt
        });
        
        return { success: true };
      } else {
        console.log("❌ No se pudo encontrar rol para test");
        return { success: false, error: "Role not found" };
      }
      
    } catch (error) {
      console.error("❌ Error en asignación de UserRoles:", error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Para ejecutar directamente
if (require.main === module) {
  const tester = new DirectDBTest();
  
  async function runTests() {
    console.log("🧪 Ejecutando tests directos contra DynamoDB\n");
    
    await tester.testUserTypeValidation();
    await tester.testDocumentTypeValidation();
    await tester.testRoleValidation();
    await tester.testDynamicDocumentCreation();
    await tester.testEmailDuplicateCheck();
    await tester.testFullSignUpFlow();
    
    console.log("\n✅ Tests completados");
    process.exit(0);
  }
  
  runTests().catch(error => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
}
