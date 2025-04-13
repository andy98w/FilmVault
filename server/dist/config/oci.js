"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ociConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parUrl = process.env.OCI_PAR_URL || '';
exports.ociConfig = {
    objectStorage: {
        parUrl,
        getProfilePictureUrl: (objectName) => {
            return `${parUrl}${objectName}`;
        }
    },
    isConfigValid: () => {
        return false;
    },
    isObjectStorageConfigValid: () => {
        if (!parUrl) {
            console.error('OCI_PAR_URL environment variable is not set');
            return false;
        }
        return true;
    },
    createObjectStorageClient: () => {
        console.log('Using PAR for object storage access');
        return null;
    }
};
console.log('Using PAR URL for profile pictures: ' + (parUrl ? 'Configured' : 'Not configured'));
exports.default = exports.ociConfig;
