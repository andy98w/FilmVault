"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ociConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Check for OCI configuration file
const ociConfigPath = path_1.default.join(__dirname, '../../oci_config');
const ociKeyPath = '/Users/andywu/Documents/andywu47.pem';
// Export OCI configuration for use in other parts of the application
exports.ociConfig = {
    configPath: ociConfigPath,
    keyPath: ociKeyPath,
    profile: 'DEFAULT',
    region: 'ca-toronto-1',
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
    }
};
// Log OCI configuration status
console.log(`OCI Configuration status: ${exports.ociConfig.isConfigValid() ? 'Valid' : 'Invalid'}`);
if (!exports.ociConfig.isConfigValid()) {
    console.warn('OCI configuration is not valid. Some features may not work correctly.');
}
exports.default = exports.ociConfig;
