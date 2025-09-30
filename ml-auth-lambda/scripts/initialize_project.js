#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const CONFIGURATION_PATHS = [
  'deployment/aws/template.yaml',
  'deployment/aws/samconfig.toml',
  'openapi/private.yaml',
  'openapi/public.yaml'
];

// Helper for colored output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  // Get repo name from git
  let repoName = '';
  try {
    const gitTopLevel = require('child_process')
      .execSync('git rev-parse --show-toplevel')
      .toString().trim();
    repoName = path.basename(gitTopLevel);
  } catch (e) {
    repoName = path.basename(process.cwd());
  }

  const environments = [
    { key: 'aws', name: 'AWS' }
    // Add more environments here in the future
  ];

  console.log(`${colors.green}Which environment do you want to initialize the project for?${colors.reset}`);
  environments.forEach((env, idx) => {
    console.log(`${idx + 1}) ${env.name}`);
  });
  let selectedIdx = await askQuestion(`\nSelect an option [1]: `);
  selectedIdx = selectedIdx.trim() || '1';
  const idx = parseInt(selectedIdx, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= environments.length) {
    console.log(`${colors.yellow}Invalid option. Exiting.${colors.reset}`);
    process.exit(1);
  }
  const environment = environments[idx].key;

  if (environment !== 'aws') {
    console.log(`${colors.yellow}Currently only AWS initialization is supported. More environments coming soon.${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}Initializing project ${repoName} for ${environment} environment${colors.reset}`);
  const apiBasePath = await askQuestion(`${colors.green}Enter the API base (Example: users): ${colors.reset}`);
  const lambdaDescription = await askQuestion(`${colors.green}Enter a description for this project: ${colors.reset}`);

  console.log('Configuring the project with the provided data...');
  CONFIGURATION_PATHS.forEach(configPath => {
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      content = content.replace(/\{\{\{GITHUB_REPO_NAME\}\}\}/g, repoName);
      content = content.replace(/\{\{\{API_BASE_PATH\}\}\}/g, apiBasePath);
      content = content.replace(/\{\{\{LAMBDA_FUNCTION_DESCRIPTION\}\}\}/g, lambdaDescription);
      fs.writeFileSync(configPath, content, 'utf8');
    }
  });
  console.log(`${colors.green}Configuration completed successfully for AWS!${colors.reset}`);

  // --- NUEVO: Copiar el workflow de GitHub Actions sin pedir ARNs ---
  const deployWorkflowTemplatePath = path.join('.github', 'workflows', 'deploy.yml.template');
  const deployWorkflowPath = path.join('.github', 'workflows', 'deploy.yml');
  if (fs.existsSync(deployWorkflowTemplatePath)) {
    // Copia el archivo template a deploy.yml sin modificaciones
    fs.copyFileSync(deployWorkflowTemplatePath, deployWorkflowPath);
    console.log(`${colors.green}GitHub Actions workflow has been created from template!${colors.reset}`);
    console.log(`${colors.yellow}Note: You may need to configure DEV_ROLE_ARN and PROD_ROLE_ARN secrets in your GitHub repository settings.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}GitHub Actions workflow template not found at ${deployWorkflowTemplatePath}.${colors.reset}`);
  }

  console.log('');
  console.log(`${colors.green}Installing packages and updating libraries${colors.reset}`);
  // Optional: you can add an automatic npm install here if you want
}

main();
