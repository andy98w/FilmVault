import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import sharp from 'sharp';
import ociConfig from '../config/oci';
import fetch from 'node-fetch';
import { promisify } from 'util';

class StorageService {
  private bucketName: string;
  private localStoragePath: string;
  private baseUrl: string;
  private useOCI: boolean;
  private ociClient: any | null;
  private sleep = promisify(setTimeout);
  private parUrl: string;
  
  getBucketName(): string {
    return this.bucketName;
  }
  
  constructor() {
    this.bucketName = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
    this.baseUrl = process.env.OCI_BUCKET_URL || 'http://localhost:3000/profile-pictures';
    this.parUrl = process.env.OCI_PAR_URL || 'https://objectstorage.ca-toronto-1.oraclecloud.com/p/j760BvPoSbgh7gfqrrAHfcdRpnlyiHgLdXdwhIq5m9MZR48ygD8XcD4N32g6AFZg/n/yzep9haqilyk/b/filmvault-profile-pictures/o/';
    this.localStoragePath = path.join(__dirname, '../../profile-pictures');
    this.useOCI = ociConfig.isConfigValid() && ociConfig.isObjectStorageConfigValid();
    this.ociClient = this.useOCI ? ociConfig.createObjectStorageClient() : null;
    
    if (!this.useOCI) {
      this.initLocalStorage();
    }
  }
  
  private async initLocalStorage() {
    try {
      if (!fs.existsSync(this.localStoragePath)) {
        await fsPromises.mkdir(this.localStoragePath, { recursive: true });
      }
    } catch (error) {
      console.error('Error initializing local storage:', error);
    }
  }
  
  private generateObjectName(userId: number, fileExt: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    return `profile-${userId}-${timestamp}-${randomStr}${fileExt}`;
  }
  
  private async processImage(file: Buffer, format: 'jpeg' | 'png' = 'jpeg'): Promise<Buffer> {
    try {
      return await sharp(file)
        .rotate()
        .resize({
          width: 400,
          height: 400,
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format, { quality: 90 })
        .toBuffer();
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }
  
  async uploadProfilePicture(userId: number, file: Buffer, filename: string): Promise<string> {
    try {
      const processedImage = await this.processImage(file);
      const objectName = this.generateObjectName(userId, '.jpg');
      
      try {
        const parUrl = `${this.parUrl}${objectName}`;
        await fetch(parUrl, { method: 'HEAD' });
        return parUrl;
      } catch (parError) {
        const encodedObjectName = encodeURIComponent(objectName);
        const directUrl = `${this.baseUrl}${encodedObjectName}`;
        return directUrl;
      }
      
      const filePath = path.join(this.localStoragePath, objectName);
      await fsPromises.writeFile(filePath, processedImage);
      return `${this.baseUrl}/${objectName}`;
    } catch (error) {
      console.error('Error saving profile picture:', error);
      throw new Error('Failed to save profile picture');
    }
  }
  
  async deleteProfilePicture(objectNameOrUrl: string): Promise<boolean> {
    try {
      const objectName = this.extractObjectNameFromUrl(objectNameOrUrl);
      const filePath = path.join(this.localStoragePath, objectName);
      
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  }
  
  private getContentType(ext: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
  
  private extractObjectNameFromUrl(url: string): string {
    if (!url.includes('/')) {
      return url;
    }
    
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (error) {
      const parts = url.split('/');
      let objectName = parts[parts.length - 1];
      
      if (objectName.includes('?')) {
        objectName = objectName.split('?')[0];
      }
      return objectName;
    }
  }
}

export default new StorageService();