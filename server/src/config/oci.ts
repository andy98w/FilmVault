import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for OCI configuration file
const ociConfigPath = path.join(__dirname, '../../oci_config');
const ociKeyPath = process.env.OCI_KEY_FILE || '';

// Export OCI configuration for use in other parts of the application
export const ociConfig = {
  configPath: ociConfigPath,
  keyPath: ociKeyPath,
  profile: 'DEFAULT',
  region: process.env.OCI_REGION || 'ca-toronto-1',
  
  // Helper function to check if OCI configuration is valid
  isConfigValid: (): boolean => {
    try {
      return fs.existsSync(ociConfigPath) && fs.existsSync(ociKeyPath);
    } catch (error) {
      console.error('Error checking OCI configuration:', error);
      return false;
    }
  },
  
  // Load OCI config file content
  loadConfig: (): string | null => {
    try {
      if (fs.existsSync(ociConfigPath)) {
        return fs.readFileSync(ociConfigPath, 'utf8');
      }
      return null;
    } catch (error) {
      console.error('Error loading OCI configuration:', error);
      return null;
    }
  }
};

// Log OCI configuration status
console.log(`OCI Configuration status: ${ociConfig.isConfigValid() ? 'Valid' : 'Invalid'}`);
if (!ociConfig.isConfigValid()) {
  console.warn('OCI configuration is not valid. Some features may not work correctly.');
}

export default ociConfig;