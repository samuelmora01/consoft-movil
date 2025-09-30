#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Platform configuration
const PLATFORMS = {
  aws: {
    name: 'AWS API Gateway',
    outputDir: 'deployment/aws/openapi',
    filename: 'openapi.yaml'
  },
  generic: {
    name: 'Generic OpenAPI',
    outputDir: 'docs/openapi',
    filename: 'openapi.yaml'
  },
//   azure: {
//     name: 'Azure API Management',
//     outputDir: 'deployment/azure/openapi',
//     filename: 'openapi.yaml'
//   }
};

class OpenAPIGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  async generate() {
    try {
      console.log('🚀 OpenAPI Generator for Biznagi Serverless App\n');
      
      const platform = await this.selectPlatform();
      const routes = await this.parseRoutes();
      const useCases = await this.parseUseCases();
      
      const openApiSpec = this.generateOpenAPISpec(routes, useCases, platform);
      await this.saveOpenAPISpec(openApiSpec, platform);
      
      console.log(`✅ OpenAPI generated successfully for ${PLATFORMS[platform].name}`);
      
    } catch (error) {
      console.error('❌ Error generating OpenAPI:', error.message);
      process.exit(1);
    }
  }

  async selectPlatform() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('Select target platform:');
      Object.entries(PLATFORMS).forEach(([key, config], index) => {
        console.log(`${index + 1}. ${config.name} (${key})`);
      });
      
      rl.question('\nEnter option number (1-3): ', (answer) => {
        const platformKeys = Object.keys(PLATFORMS);
        const selectedIndex = parseInt(answer) - 1;
        
        if (selectedIndex >= 0 && selectedIndex < platformKeys.length) {
          const selectedPlatform = platformKeys[selectedIndex];
          console.log(`\n📋 Selected: ${PLATFORMS[selectedPlatform].name}\n`);
          rl.close();
          resolve(selectedPlatform);
        } else {
          console.log('❌ Invalid option. Using AWS by default.\n');
          rl.close();
          resolve('aws');
        }
      });
    });
  }

  async parseRoutes() {
    const httpRouterPath = path.join(this.srcPath, 'infrastructure/http/HTTPRouter.ts');
    
    if (!fs.existsSync(httpRouterPath)) {
      throw new Error('HTTPRouter.ts not found');
    }

    console.log('📖 Analyzing HTTPRouter...');
    
    const content = fs.readFileSync(httpRouterPath, 'utf8');
    
    // Search directly for httpRouter object in content
    const routerMatch = content.match(/export\s+const\s+httpRouter[^=]*=\s*{([\s\S]*?)};/);
    
    if (!routerMatch) {
      console.log('⚠️  Could not find httpRouter in file');
      return {};
    }
    
    const routerContent = routerMatch[1];
    
    const routes = {};
    
    // Search each HTTP method with a robust approach
    const lines = routerContent.split('\n');
    let currentMethod = null;
    let currentPath = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect HTTP method (avoid matching 'handler:')
      const methodMatch = trimmedLine.match(/^(get|post|put|delete|patch|options|head)\s*:\s*{/i);
      if (methodMatch) {
        currentMethod = methodMatch[1].toLowerCase();
        routes[currentMethod] = {};
        console.log(`  🔍 Method: ${currentMethod.toUpperCase()}`);
        continue;
      }
      
      // Detect route (support single or double quotes)
      const pathMatch = trimmedLine.match(/['"]([^'\"]+)['"]:\s*{/);
      if (pathMatch && currentMethod) {
        currentPath = pathMatch[1];
        continue;
      }
      
      // Detect handler (any *UseCases object)
      const handlerMatch = trimmedLine.match(/handler:\s*([\w]+UseCases)\.([\w.]+)/);
      if (handlerMatch && currentMethod && currentPath) {
        const useCasesObj = handlerMatch[1];
        const handlerFn = handlerMatch[2];
        routes[currentMethod][currentPath] = {
          handler: `${useCasesObj}.${handlerFn}`
        };
        console.log(`    ✓ ${currentPath} -> ${useCasesObj}.${handlerFn}`);
        currentPath = null; // Reset for next route
      }
    }

    return routes;
  }

  async parseUseCases() {
    const useCasesPath = path.join(this.srcPath, 'interfaces/http');
    const useCases = {};

    if (!fs.existsSync(useCasesPath)) {
      console.log('⚠️  Use cases directory not found');
      return useCases;
    }

    console.log('📖 Analyzing Use Cases...');
    const files = fs.readdirSync(useCasesPath).filter(file => file.endsWith('.ts'));
    
    for (const file of files) {
      const filePath = path.join(useCasesPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic parsing of async functions
      const functionMatches = content.match(/async function (\w+)\([^)]*\):\s*Promise<IResponse>/g);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const funcName = match.match(/async function (\w+)/)[1];
          useCases[funcName] = {
            file: file,
            returnType: 'IResponse'
          };
          console.log(`  ✓ Function: ${funcName} in ${file}`);
        });
      }
    }

    return useCases;
  }

  generateOpenAPISpec(routes, useCases, platform) {
    console.log('🔧 Generating OpenAPI specification...');
    
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Biznagi Serverless API',
        version: '1.0.0',
        description: 'API automatically generated from code structure'
      },
      servers: [
        {
          url: platform === 'aws' ? 'https://api.example.com' : 'http://localhost:3000'
        }
      ],
      paths: {},
      components: {
        schemas: {
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    // Generate paths from routes
    Object.entries(routes).forEach(([method, methodRoutes]) => {
      Object.entries(methodRoutes).forEach(([routePath, handlerPath]) => {
        const openApiPath = routePath.replace(/{([^}]+)}/g, '{$1}');
        
        if (!spec.paths[openApiPath]) {
          spec.paths[openApiPath] = {};
        }

        const operation = {
          summary: `${method.toUpperCase()} ${routePath}`,
          operationId: `${method}${routePath.replace(/[^a-zA-Z0-9]/g, '')}`,
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        };

        // Add path parameters if they exist
        const pathParams = routePath.match(/{([^}]+)}/g);
        if (pathParams) {
          if (!spec.paths[openApiPath].parameters) {
            spec.paths[openApiPath].parameters = [];
          }
          
          pathParams.forEach(param => {
            const paramName = param.replace(/[{}]/g, '');
            spec.paths[openApiPath].parameters.push({
              name: paramName,
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            });
          });
        }

        // Add platform-specific extensions
        if (platform === 'aws') {
          operation['x-amazon-apigateway-integration'] = {
            uri: {
              'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
            },
            responses: {
              default: {
                statusCode: '200'
              }
            },
            passthroughBehavior: 'when_no_match',
            httpMethod: 'POST',
            contentHandling: 'CONVERT_TO_TEXT',
            type: 'aws_proxy'
          };
        }

        spec.paths[openApiPath][method.toLowerCase()] = operation;
        console.log(`  ✓ Generated: ${method.toUpperCase()} ${openApiPath}`);
      });
    });

    return spec;
  }

  async saveOpenAPISpec(spec, platform) {
    const platformConfig = PLATFORMS[platform];
    const outputDir = path.join(this.projectRoot, platformConfig.outputDir);
    const outputFile = path.join(outputDir, platformConfig.filename);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Directory created: ${platformConfig.outputDir}`);
    }

    // Convert to YAML
    const yamlContent = this.toYAML(spec);
    
    // Save file
    fs.writeFileSync(outputFile, yamlContent, 'utf8');
    console.log(`💾 File saved: ${outputFile}`);
  }

  toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- ${this.toYAML(item, indent + 1).trim()}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
        } else {
          yaml += `${spaces}${key}: ${this.formatValue(value)}\n`;
        }
      });
    } else {
      return this.formatValue(obj);
    }

    return yaml;
  }

  formatValue(value) {
    if (typeof value === 'string') {
      // Handle special CloudFormation strings
      if (value.includes('Fn::Sub')) {
        return `'${value}'`;
      }
      return `'${value}'`;
    }
    return value;
  }
}

// Run the generator
if (require.main === module) {
  const generator = new OpenAPIGenerator();
  generator.generate();
}

module.exports = OpenAPIGenerator;