"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ociConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const oci_sdk_1 = require("oci-sdk");
// Load environment variables
dotenv_1.default.config();
// Check for OCI configuration file
const ociConfigPath = path_1.default.join(__dirname, '../../oci_config');
const ociKeyPath = process.env.OCI_KEY_FILE || '';
// Object Storage specific configuration
const objectStorageNamespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE;
const profilePicturesBucket = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
const bucketPublicUrl = process.env.OCI_BUCKET_URL || '';
// Export OCI configuration for use in other parts of the application
exports.ociConfig = {
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
        getProfilePictureUrl: (objectName) => {
            if (bucketPublicUrl) {
                return `${bucketPublicUrl}/${objectName}`;
            }
            // Fallback format (works when object storage allows public access)
            return `https://objectstorage.${exports.ociConfig.region}.oraclecloud.com/n/${objectStorageNamespace}/b/${profilePicturesBucket}/o/${objectName}`;
        }
    },
    // Helper function to check if OCI configuration is valid
    isConfigValid: () => {
        try {
            return fs_1.default.existsSync(ociConfigPath) && fs_1.default.existsSync(ociKeyPath);
        }
        catch (error) {
            console.error('Error checking OCI configuration:', error);
            return false;
        }
    },
    // Check if Object Storage configuration is valid
    isObjectStorageConfigValid: () => {
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
    loadConfig: () => {
        try {
            if (fs_1.default.existsSync(ociConfigPath)) {
                return fs_1.default.readFileSync(ociConfigPath, 'utf8');
            }
            return null;
        }
        catch (error) {
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
            if (!fs_1.default.existsSync(ociConfigPath)) {
                console.error(`OCI configuration file not found at: ${ociConfigPath}`);
                return null;
            }
            const provider = new oci_sdk_1.common.ConfigFileAuthenticationDetailsProvider(ociConfigPath, process.env.OCI_CONFIG_PROFILE || 'DEFAULT');
            return new oci_sdk_1.objectstorage.ObjectStorageClient({
                authenticationDetailsProvider: provider
            });
        }
        catch (error) {
            console.error('Error setting up OCI authentication:', error);
            return null;
        }
    }
};
// Log OCI configuration status
console.log(`OCI Configuration status: ${exports.ociConfig.isConfigValid() ? 'Valid' : 'Invalid'}`);
console.log(`OCI Object Storage configuration status: ${exports.ociConfig.isObjectStorageConfigValid() ? 'Valid' : 'Invalid'}`);
if (!exports.ociConfig.isConfigValid()) {
    console.warn('OCI configuration is not valid. Some features may not work correctly.');
}
if (!exports.ociConfig.isObjectStorageConfigValid()) {
    console.warn('OCI Object Storage configuration is not valid. Profile picture uploads may not work correctly.');
}
exports.default = exports.ociConfig;
