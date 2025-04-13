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
    this.parUrl = process.env.OCI_PAR_URL || 'https://objectstorage.ca-toronto-1.oraclecloud.com/p/j760BvPoSbgh7gfqrrAHfcdRpnlyiHgLdXdwhIq5m9MZR48ygD8XcD4N32g6AFZg/n/yzep9haqilyk/b/filmvault-profile-pictures/o/';
    
    // For local development, store files in the server directory
    this.localStoragePath = path.join(__dirname, '../../profile-pictures');
    
    // Check if OCI configuration is valid
    this.useOCI = ociConfig.isConfigValid() && ociConfig.isObjectStorageConfigValid();
    this.ociClient = this.useOCI ? ociConfig.createObjectStorageClient() : null;
    
    console.log('Storage Configuration:');
    console.log(`- Using local path: ${this.localStoragePath}`);
    console.log(`- Using PAR URL: ${this.parUrl ? 'Yes' : 'No'}`);
    console.log(`- Base URL: ${this.baseUrl}`);
    
    if (this.useOCI && this.ociClient) {
      console.log('OCI storage configured for profile pictures');
    } else {
      console.log('OCI storage NOT configured, using local storage');
      // Create the profile pictures directory if it doesn't exist
      this.initLocalStorage();
    }
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
   * Process image to ensure consistent format and size
   * @param file The original file buffer
   * @param format The output format (default: jpeg)
   * @returns A processed image buffer
   */
  private async processImage(file: Buffer, format: 'jpeg' | 'png' = 'jpeg'): Promise<Buffer> {
    try {
      console.log('Processing image with Sharp...');
      // Process with sharp - resize to appropriate dimensions and maintain aspect ratio
      return await sharp(file)
        .rotate() // Auto-rotate based on EXIF data
        .resize({
          width: 400, // Standard profile picture size
          height: 400,
          fit: 'cover', // Crop to fill the dimensions
          position: 'center' // Focus on the center of the image
        })
        .toFormat(format, { quality: 90 }) // Use high quality
        .toBuffer();
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
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
      // Process the image to ensure consistent format and prevent distortion
      const processedImage = await this.processImage(file);
      
      // Generate a unique object name (always use .jpg since we're converting to JPEG)
      const objectName = this.generateObjectName(userId, '.jpg');
      
      if (false) { // Disabled OCI direct upload, using PAR only
        try {
          console.log('OCI upload disabled, using PAR for object access');
          
          // Upload to OCI Object Storage
          // OCI direct upload disabled
          return '';
          
          // OCI operations are disabled
          
          // Use existing PAR instead of creating a new one for each object
          try {
            console.log('Using pre-configured PAR URL...');
            const parUrl = `${this.parUrl}${objectName}`;
            console.log(`PAR URL: ${parUrl}`);
            
            // Verify the URL is accessible
            console.log('Verifying PAR URL is accessible...');
            const verifyResponse = await fetch(parUrl, { method: 'HEAD' });
            console.log(`PAR URL verification status: ${verifyResponse.status} ${verifyResponse.statusText}`);
            
            return parUrl;
          } catch (parError) {
            console.error('Error using PAR URL:', parError);
            
            // Fallback to standard URL with encoding
            const encodedObjectName = encodeURIComponent(objectName);
            const directUrl = `${this.baseUrl}${encodedObjectName}`;
            console.log(`Falling back to direct URL: ${directUrl}`);
            
            return directUrl;
          }
        } catch (ociError) {
          console.error('Error uploading to OCI, falling back to local storage:', ociError);
          // Fall back to local storage on OCI error
        }
      }
      
      // Fall back to local storage (either if OCI is not configured or if OCI upload failed)
      const filePath = path.join(this.localStoragePath, objectName);
      await fsPromises.writeFile(filePath, processedImage);
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
      
      if (false) { // Disabled OCI direct deletion
        // Delete from OCI Object Storage - disabled
        try {
          console.log('OCI direct deletion disabled');
          
          // Disabled OCI operations
          return false;
        } catch (ociError) {
          console.error('Error deleting profile picture from OCI:', ociError);
          return false;
        }
      } else {
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
      let objectName = parts[parts.length - 1];
      
      // Also remove any query parameters
      if (objectName.includes('?')) {
        objectName = objectName.split('?')[0];
      }
      
      console.log(`Extracted object name from URL: ${objectName}`);
      return objectName;
    }
  }
}

export default new StorageService();