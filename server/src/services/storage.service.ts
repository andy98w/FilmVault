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
  private localStoragePath: string = '/tmp/filmvault-uploads';
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
    
    // The baseUrl is kept for compatibility but not actively used
    this.baseUrl = 'https://filmvault.space/profile-pictures';
    
    // PAR URL for direct object access - ONLY use environment variable
    if (!process.env.OCI_PAR_URL) {
      console.error('OCI_PAR_URL environment variable is not set! Profile picture uploads will not work correctly');
    }
    
    this.parUrl = process.env.OCI_PAR_URL || '';
    console.log(`Using OCI PAR URL: ${this.parUrl ? '[URL SET]' : '[URL MISSING]'}`);
    
    // Set flags for OCI usage based on whether we have a PAR URL
    this.useOCI = !!process.env.OCI_PAR_URL;
    
    // Initialize OCI client with a simple configuration
    // In a real implementation, you would use credentials from the environment
    try {
      // Temporary directory for OCI operations if needed
      this.localStoragePath = '/tmp/filmvault-uploads';
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
      }
      
      // For the real version, we're using direct PUT to the PAR URL
      this.ociClient = null;
      
      // Log successful configuration
      console.log('Using OCI Object Storage with PUT to PAR URL for profile pictures');
      console.log(`PAR URL configured as: ${this.parUrl}`);
      console.log(`Temporary storage path: ${this.localStoragePath}`);
    } catch (error) {
      console.error('Failed to initialize OCI client:', error);
      this.ociClient = null;
      this.useOCI = false;
    }
  }
  
  // This method is no longer used in the stateless approach
  private async initLocalStorage() {
    // Intentionally empty - not used in stateless implementation
    console.log('initLocalStorage called, but this is a stateless implementation');
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
      console.log(`Processing profile picture upload for user ${userId}`);
      // Process the image in memory
      const processedImage = await this.processImage(file);
      console.log(`Image processed successfully (${processedImage.length} bytes)`);
      
      // Generate a unique object name
      const objectName = this.generateObjectName(userId, '.jpg');
      console.log(`Generated object name: ${objectName}`);
      
      // Create the full PAR URL for this specific object (for PUT operation)
      const objectPutUrl = `${this.parUrl}${objectName}`;
      console.log(`Object PUT URL: ${objectPutUrl}`);
      
      try {
        // Upload the image directly to OCI using PUT request to the PAR URL
        console.log('Uploading image to OCI Object Storage...');
        
        const uploadResponse = await fetch(objectPutUrl, {
          method: 'PUT',
          body: processedImage,
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': processedImage.length.toString()
          }
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload to OCI: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        console.log(`Upload successful! Status: ${uploadResponse.status}`);
        
        // Create a direct access URL for the uploaded image
        // This is the URL that will be used to access the image from the client
        // For OCI Object Storage with PAR URL, we remove any tokens or query parameters
        // and keep only the base URL
        
        // Extract just the base URL without any query parameters
        let accessUrl = objectPutUrl;
        if (objectPutUrl.includes('?')) {
          accessUrl = objectPutUrl.split('?')[0];
        }
        
        console.log(`OCI object access URL: ${accessUrl}`);
        
        // Save to local temporary directory for debugging purposes
        try {
          const tempPath = path.join(this.localStoragePath, objectName);
          await fsPromises.writeFile(tempPath, processedImage);
          console.log(`Saved image to temporary location: ${tempPath}`);
        } catch (tempSaveError) {
          console.warn(`Failed to save temporary copy: ${tempSaveError}`);
          // Continue anyway, as the OCI upload was successful
        }
        
        // Return the OCI URL for direct access
        return objectPutUrl;
      } catch (uploadError) {
        console.error('Error uploading to OCI:', uploadError);
        
        // Fallback: Save to local temporary directory
        try {
          const tempPath = path.join(this.localStoragePath, objectName);
          await fsPromises.writeFile(tempPath, processedImage);
          console.log(`Saved image to temporary location: ${tempPath}`);
          
          // Return the OCI URL even though the upload failed
          // The client will have to handle the error by showing a default image
          return objectPutUrl;
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
          throw new Error('Failed to store profile picture');
        }
      }
    } catch (error) {
      console.error('Error handling profile picture:', error);
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      throw new Error('Failed to process profile picture');
    }
  }
  
  async deleteProfilePicture(objectNameOrUrl: string): Promise<boolean> {
    try {
      const objectName = this.extractObjectNameFromUrl(objectNameOrUrl);
      console.log(`Handling deletion for object: ${objectName}`);
      
      // For PAR URLs, we need a separate PAR that has delete permissions
      // Most PAR URLs are read-only or write-only, so direct deletion might not work
      
      // Since a PAR with delete permissions may not be available, we can:
      // 1. Log the deletion request
      // 2. Consider the object "deleted" from the application perspective
      // 3. Clean up orphaned objects separately with a background job or admin task
      
      console.log(`Object ${objectName} marked for deletion`);
      
      // Clean up any temporary files if they exist
      try {
        const tempPath = path.join(this.localStoragePath, objectName);
        if (fs.existsSync(tempPath)) {
          await fsPromises.unlink(tempPath);
          console.log(`Deleted local temporary file: ${tempPath}`);
        }
      } catch (localDeleteError) {
        console.warn(`Failed to delete local temporary file: ${localDeleteError}`);
        // Continue even if local deletion fails
      }
      
      // Note: We don't actually delete from OCI Object Storage here
      // as we don't have a PAR URL with delete permissions
      // This would typically be handled by a background job with appropriate credentials
      console.log(`No direct deletion from OCI Object Storage - object ${objectName} will remain`);
      
      return true;
    } catch (error) {
      console.error('Error handling profile picture deletion:', error);
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
      // Check if this is a URL with protocol or a path
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1];
      } else {
        // Handle relative paths like /profile-pictures/filename.jpg
        const parts = url.split('/');
        let objectName = parts[parts.length - 1];
        
        if (objectName.includes('?')) {
          objectName = objectName.split('?')[0];
        }
        return objectName;
      }
    } catch (error) {
      // Fallback extraction if URL parsing fails
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