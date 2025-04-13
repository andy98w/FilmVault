"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
class StorageService {
    /**
     * Get the bucket name
     * @returns The bucket name
     */
    getBucketName() {
        return this.bucketName;
    }
    constructor() {
        this.bucketName = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
        this.baseUrl = process.env.OCI_BUCKET_URL || 'http://localhost:3000/profile-pictures';
        // For local development, store files in the server directory
        this.localStoragePath = path_1.default.join(__dirname, '../../profile-pictures');
        // Create the profile pictures directory if it doesn't exist
        this.initLocalStorage();
    }
    initLocalStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!fs_1.default.existsSync(this.localStoragePath)) {
                    yield fs_2.promises.mkdir(this.localStoragePath, { recursive: true });
                    console.log(`Created local storage directory at ${this.localStoragePath}`);
                }
                console.log('Local storage for profile pictures initialized');
            }
            catch (error) {
                console.error('Error initializing local storage:', error);
            }
        });
    }
    /**
     * Generate a unique object name for a profile picture
     * @param userId The user ID
     * @param fileExt The file extension (e.g., .jpg, .png)
     * @returns A unique object name
     */
    generateObjectName(userId, fileExt) {
        const timestamp = Date.now();
        const randomStr = crypto_1.default.randomBytes(4).toString('hex');
        return `profile-${userId}-${timestamp}-${randomStr}${fileExt}`;
    }
    /**
     * Upload a profile picture to storage
     * @param userId The user ID
     * @param file The file buffer
     * @param filename The original filename
     * @returns The URL of the uploaded profile picture
     */
    uploadProfilePicture(userId, file, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate a unique object name
                const fileExt = path_1.default.extname(filename).toLowerCase();
                const objectName = this.generateObjectName(userId, fileExt);
                // For local development, save to the filesystem
                const filePath = path_1.default.join(this.localStoragePath, objectName);
                yield fs_2.promises.writeFile(filePath, file);
                console.log(`Profile picture saved locally to ${filePath}`);
                // Return a URL-like string that points to the file
                return `${this.baseUrl}/${objectName}`;
            }
            catch (error) {
                console.error('Error saving profile picture:', error);
                throw new Error('Failed to save profile picture');
            }
        });
    }
    /**
     * Delete a profile picture from storage
     * @param objectNameOrUrl The name of the object or URL to delete
     * @returns A boolean indicating success or failure
     */
    deleteProfilePicture(objectNameOrUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract the object name from the URL if a full URL is provided
                const objectName = this.extractObjectNameFromUrl(objectNameOrUrl);
                // For local development, delete from the filesystem
                const filePath = path_1.default.join(this.localStoragePath, objectName);
                if (fs_1.default.existsSync(filePath)) {
                    yield fs_2.promises.unlink(filePath);
                    console.log(`Profile picture deleted locally from ${filePath}`);
                    return true;
                }
                else {
                    console.log(`File does not exist: ${filePath}`);
                    return false;
                }
            }
            catch (error) {
                console.error('Error deleting profile picture:', error);
                return false;
            }
        });
    }
    /**
     * Get the content type based on file extension
     * @param ext The file extension
     * @returns The content type
     */
    getContentType(ext) {
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return contentTypes[ext] || 'application/octet-stream';
    }
    /**
     * Extract the object name from a URL
     * @param url The URL or object name
     * @returns The extracted object name
     */
    extractObjectNameFromUrl(url) {
        // If it's already just an object name (no slashes)
        if (!url.includes('/')) {
            return url;
        }
        try {
            // Extract the object name from the URL
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            // The object name is the last part of the path
            return pathParts[pathParts.length - 1];
        }
        catch (error) {
            // If URL parsing fails, try a simple approach
            const parts = url.split('/');
            return parts[parts.length - 1];
        }
    }
}
exports.default = new StorageService();
