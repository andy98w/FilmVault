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
        return !!parUrl;
    },
    createObjectStorageClient: () => {
        return null;
    }
};
exports.default = exports.ociConfig;
