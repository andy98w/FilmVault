import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { common, objectstorage } from 'oci-sdk';

// Load environment variables
dotenv.config();

// Check for OCI configuration file
const ociConfigPath = path.join(__dirname, '../../oci_config');
const ociKeyPath = process.env.OCI_KEY_FILE || '';

// Object Storage specific configuration
const objectStorageNamespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE;
const profilePicturesBucket = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
const bucketPublicUrl = process.env.OCI_BUCKET_URL || '';

// Export OCI configuration for use in other parts of the application
export const ociConfig = {
  configPath: ociConfigPath,
  keyPath: ociKeyPath,
  profile: 'DEFAULT',
  region: process.env.OCI_REGION || 'ca-toronto-1',
  
  // Object Storage specific configuration
  objectStorage: {
    namespace: objectStorageNamespace,
    profilePicturesBucket,
    bucketPublicUrl,
    
    // URL to access a profile picture
    getProfilePictureUrl: (objectName: string): string => {
      if (bucketPublicUrl) {
        return `${bucketPublicUrl}/${objectName}`;
      }
      
      // Fallback format (works when object storage allows public access)
      return `https://objectstorage.${ociConfig.region}.oraclecloud.com/n/${objectStorageNamespace}/b/${profilePicturesBucket}/o/${objectName}`;
    }
  },
  
  // Helper function to check if OCI configuration is valid
  isConfigValid: (): boolean => {
    try {
      return fs.existsSync(ociConfigPath) && fs.existsSync(ociKeyPath);
    } catch (error) {
      console.error('Error checking OCI configuration:', error);
      return false;
    }
  },
  
  // Check if Object Storage configuration is valid
  isObjectStorageConfigValid: (): boolean => {
    if (!objectStorageNamespace) {
      console.error('OCI_OBJECT_STORAGE_NAMESPACE environment variable is not set');
      return false;
    }
    
    if (!profilePicturesBucket) {
      console.error('OCI_PROFILE_PICTURES_BUCKET environment variable is not set');
      return false;
    }
    
    return true;
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
  },
  
  // Create Object Storage client
  createObjectStorageClient: () => {
    try {
      // For simplicity, let's just use the config file authentication for now
      // Instance principal authentication requires async setup which is more complex
      console.log('Using configuration file authentication for OCI');
      
      // Check if OCI config file exists
      if (!fs.existsSync(ociConfigPath)) {
        console.error(`OCI configuration file not found at: ${ociConfigPath}`);
        return null;
      }
      
      const provider = new common.ConfigFileAuthenticationDetailsProvider(
        ociConfigPath,
        process.env.OCI_CONFIG_PROFILE || 'DEFAULT'
      );
      
      return new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: provider
      });
    } catch (error) {
      console.error('Error setting up OCI authentication:', error);
      return null;
    }
  }
};

// Log OCI configuration status
console.log(`OCI Configuration status: ${ociConfig.isConfigValid() ? 'Valid' : 'Invalid'}`);
console.log(`OCI Object Storage configuration status: ${ociConfig.isObjectStorageConfigValid() ? 'Valid' : 'Invalid'}`);

if (!ociConfig.isConfigValid()) {
  console.warn('OCI configuration is not valid. Some features may not work correctly.');
}

if (!ociConfig.isObjectStorageConfigValid()) {
  console.warn('OCI Object Storage configuration is not valid. Profile picture uploads may not work correctly.');
}

export default ociConfig;