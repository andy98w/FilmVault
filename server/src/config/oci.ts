import dotenv from 'dotenv';

dotenv.config();

const parUrl = process.env.OCI_PAR_URL || '';

export const ociConfig = {
  objectStorage: {
    parUrl,
    getProfilePictureUrl: (objectName: string): string => {
      return `${parUrl}${objectName}`;
    }
  },
  
  isConfigValid: (): boolean => {
    return false;
  },
  
  isObjectStorageConfigValid: (): boolean => {
    return !!parUrl;
  },
  
  createObjectStorageClient: () => {
    return null;
  }
};

export default ociConfig;