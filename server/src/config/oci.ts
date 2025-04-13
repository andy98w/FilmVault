import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PAR URL for profile pictures
const parUrl = process.env.OCI_PAR_URL || '';

// Export simplified configuration
export const ociConfig = {
  // Object Storage configuration using PAR
  objectStorage: {
    parUrl,
    
    // Get URL for a profile picture using PAR
    getProfilePictureUrl: (objectName: string): string => {
      return `${parUrl}${objectName}`;
    }
  },
  
  // Always return false to disable OCI SDK usage
  isConfigValid: (): boolean => {
    return false;
  },
  
  // Simple check for PAR URL
  isObjectStorageConfigValid: (): boolean => {
    if (!parUrl) {
      console.error('OCI_PAR_URL environment variable is not set');
      return false;
    }
    return true;
  },
  
  // Return null to disable OCI client creation
  createObjectStorageClient: () => {
    console.log('OCI SDK client disabled, using PAR for object access');
    return null;
  }
};

// Log configuration status
console.log('Using PAR URL for profile pictures: ' + (parUrl ? 'Configured' : 'Not configured'));

export default ociConfig;