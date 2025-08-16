#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'lib', 'config.ts');

const environments = {
  dev: 'development',
  prod: 'production',
  staging: 'staging'
};

const targetEnv = process.argv[2];

if (!targetEnv || !environments[targetEnv]) {
  console.log('Usage: node switch-env.js <environment>');
  console.log('Available environments:');
  console.log('  dev     - Switch to development (localhost:5000)');
  console.log('  prod    - Switch to production (3.111.169.32:5050)');
  console.log('  staging - Switch to staging (3.111.169.32:5050)');
  process.exit(1);
}

try {
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update the CURRENT environment
  const newEnv = environments[targetEnv];
  configContent = configContent.replace(
    /CURRENT: 'development' as 'development' \| 'production' \| 'staging'/,
    `CURRENT: '${newEnv}' as 'development' | 'production' | 'staging'`
  );
  
  fs.writeFileSync(configPath, configContent);
  
  console.log(`✅ Switched to ${newEnv} environment`);
  console.log(`🌐 API Base URL: ${newEnv === 'development' ? 'http://localhost:5000/api' : 'http://3.111.169.32:5050/api'}`);
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
  process.exit(1);
}
