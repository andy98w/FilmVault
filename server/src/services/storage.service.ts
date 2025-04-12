import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

class StorageService {
  private bucketName: string;
  private localStoragePath: string;
  private baseUrl: string;
  
  /**
   * Get the bucket name
   * @returns The bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
  
  constructor() {
    this.bucketName = process.env.OCI_PROFILE_PICTURES_BUCKET || 'filmvault-profile-pictures';
    this.baseUrl = process.env.OCI_BUCKET_URL || 'http://localhost:3000/profile-pictures';
    
    // For local development, store files in the server directory
    this.localStoragePath = path.join(__dirname, '../../profile-pictures');
    
    // Create the profile pictures directory if it doesn't exist
    this.initLocalStorage();
  }
  
  private async initLocalStorage() {
    try {
      if (!fs.existsSync(this.localStoragePath)) {
        await fsPromises.mkdir(this.localStoragePath, { recursive: true });
        console.log(`Created local storage directory at ${this.localStoragePath}`);
      }
      console.log('Local storage for profile pictures initialized');
    } catch (error) {
      console.error('Error initializing local storage:', error);
    }
  }
  
  /**
   * Generate a unique object name for a profile picture
   * @param userId The user ID
   * @param fileExt The file extension (e.g., .jpg, .png)
   * @returns A unique object name
   */
  private generateObjectName(userId: number, fileExt: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    return `profile-${userId}-${timestamp}-${randomStr}${fileExt}`;
  }
  
  /**
   * Upload a profile picture to storage
   * @param userId The user ID
   * @param file The file buffer
   * @param filename The original filename
   * @returns The URL of the uploaded profile picture
   */
  async uploadProfilePicture(userId: number, file: Buffer, filename: string): Promise<string> {
    try {
      // Generate a unique object name
      const fileExt = path.extname(filename).toLowerCase();
      const objectName = this.generateObjectName(userId, fileExt);
      
      // For local development, save to the filesystem
      const filePath = path.join(this.localStoragePath, objectName);
      await fsPromises.writeFile(filePath, file);
      console.log(`Profile picture saved locally to ${filePath}`);
      
      // Return a URL-like string that points to the file
      return `${this.baseUrl}/${objectName}`;
    } catch (error) {
      console.error('Error saving profile picture:', error);
      throw new Error('Failed to save profile picture');
    }
  }
  
  /**
   * Delete a profile picture from storage
   * @param objectNameOrUrl The name of the object or URL to delete
   * @returns A boolean indicating success or failure
   */
  async deleteProfilePicture(objectNameOrUrl: string): Promise<boolean> {
    try {
      // Extract the object name from the URL if a full URL is provided
      const objectName = this.extractObjectNameFromUrl(objectNameOrUrl);
      
      // For local development, delete from the filesystem
      const filePath = path.join(this.localStoragePath, objectName);
      
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        console.log(`Profile picture deleted locally from ${filePath}`);
        return true;
      } else {
        console.log(`File does not exist: ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  }
  
  /**
   * Get the content type based on file extension
   * @param ext The file extension
   * @returns The content type
   */
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
  
  /**
   * Extract the object name from a URL
   * @param url The URL or object name
   * @returns The extracted object name
   */
  private extractObjectNameFromUrl(url: string): string {
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
    } catch (error) {
      // If URL parsing fails, try a simple approach
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
  }
}

export default new StorageService();