/**
 * Script to generate OCI config file from environment variables
 * 
 * Usage: node scripts/generate-oci-config.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredVars = [
  'OCI_USER_OCID',
  'OCI_FINGERPRINT',
  'OCI_TENANCY_OCID',
  'OCI_REGION',
  'OCI_KEY_FILE'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: The following environment variables are missing:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('Please add them to your .env file and try again.');
  process.exit(1);
}

// Generate OCI config content
const configContent = `[DEFAULT]
user=${process.env.OCI_USER_OCID}
fingerprint=${process.env.OCI_FINGERPRINT}
tenancy=${process.env.OCI_TENANCY_OCID}
region=${process.env.OCI_REGION}
key_file=${process.env.OCI_KEY_FILE}
`;

// Path to the oci_config file
const configPath = path.join(__dirname, '..', 'oci_config');

// Write the file
fs.writeFileSync(configPath, configContent);

console.log(`OCI config file generated at ${configPath}`);
console.log('Content:');
console.log(configContent);

// Check if key file exists
if (!fs.existsSync(process.env.OCI_KEY_FILE)) {
  console.warn(`Warning: The key file specified at ${process.env.OCI_KEY_FILE} does not exist.`);
  console.warn('Make sure to create or move your private key to this location.');
}