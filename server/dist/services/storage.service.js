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
const sharp_1 = __importDefault(require("sharp"));
const oci_1 = __importDefault(require("../config/oci"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const util_1 = require("util");
class StorageService {
    getBucketName() {
        return this.bucketName;
    }
    constructor() {
        this.sleep = (0, util_1.promisify)(setTimeout);
        this.bucketName = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
        this.baseUrl = process.env.OCI_BUCKET_URL || 'http://localhost:3000/profile-pictures';
        this.parUrl = process.env.OCI_PAR_URL || 'https://objectstorage.ca-toronto-1.oraclecloud.com/p/j760BvPoSbgh7gfqrrAHfcdRpnlyiHgLdXdwhIq5m9MZR48ygD8XcD4N32g6AFZg/n/yzep9haqilyk/b/filmvault-profile-pictures/o/';
        this.localStoragePath = path_1.default.join(__dirname, '../../profile-pictures');
        this.useOCI = oci_1.default.isConfigValid() && oci_1.default.isObjectStorageConfigValid();
        this.ociClient = this.useOCI ? oci_1.default.createObjectStorageClient() : null;
        if (!this.useOCI) {
            this.initLocalStorage();
        }
    }
    initLocalStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!fs_1.default.existsSync(this.localStoragePath)) {
                    yield fs_2.promises.mkdir(this.localStoragePath, { recursive: true });
                }
            }
            catch (error) {
                console.error('Error initializing local storage:', error);
            }
        });
    }
    generateObjectName(userId, fileExt) {
        const timestamp = Date.now();
        const randomStr = crypto_1.default.randomBytes(4).toString('hex');
        return `profile-${userId}-${timestamp}-${randomStr}${fileExt}`;
    }
    processImage(file_1) {
        return __awaiter(this, arguments, void 0, function* (file, format = 'jpeg') {
            try {
                return yield (0, sharp_1.default)(file)
                    .rotate()
                    .resize({
                    width: 400,
                    height: 400,
                    fit: 'cover',
                    position: 'center'
                })
                    .toFormat(format, { quality: 90 })
                    .toBuffer();
            }
            catch (error) {
                console.error('Error processing image:', error);
                throw new Error('Failed to process image');
            }
        });
    }
    uploadProfilePicture(userId, file, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const processedImage = yield this.processImage(file);
                const objectName = this.generateObjectName(userId, '.jpg');
                try {
                    const parUrl = `${this.parUrl}${objectName}`;
                    yield (0, node_fetch_1.default)(parUrl, { method: 'HEAD' });
                    return parUrl;
                }
                catch (parError) {
                    const encodedObjectName = encodeURIComponent(objectName);
                    const directUrl = `${this.baseUrl}${encodedObjectName}`;
                    return directUrl;
                }
                const filePath = path_1.default.join(this.localStoragePath, objectName);
                yield fs_2.promises.writeFile(filePath, processedImage);
                return `${this.baseUrl}/${objectName}`;
            }
            catch (error) {
                console.error('Error saving profile picture:', error);
                throw new Error('Failed to save profile picture');
            }
        });
    }
    deleteProfilePicture(objectNameOrUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const objectName = this.extractObjectNameFromUrl(objectNameOrUrl);
                const filePath = path_1.default.join(this.localStoragePath, objectName);
                if (fs_1.default.existsSync(filePath)) {
                    yield fs_2.promises.unlink(filePath);
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                console.error('Error deleting profile picture:', error);
                return false;
            }
        });
    }
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
    extractObjectNameFromUrl(url) {
        if (!url.includes('/')) {
            return url;
        }
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            return pathParts[pathParts.length - 1];
        }
        catch (error) {
            const parts = url.split('/');
            let objectName = parts[parts.length - 1];
            if (objectName.includes('?')) {
                objectName = objectName.split('?')[0];
            }
            return objectName;
        }
    }
}
exports.default = new StorageService();
