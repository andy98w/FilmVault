"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ociConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// PAR URL for profile pictures
const parUrl = process.env.OCI_PAR_URL || '';
// Export simplified configuration
exports.ociConfig = {
    // Object Storage configuration using PAR
    objectStorage: {
        parUrl,
        // Get URL for a profile picture using PAR
        getProfilePictureUrl: (objectName) => {
            return `${parUrl}${objectName}`;
        }
    },
    // Always return false to disable OCI SDK usage
    isConfigValid: () => {
        return false;
    },
    // Simple check for PAR URL
    isObjectStorageConfigValid: () => {
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
exports.default = exports.ociConfig;
