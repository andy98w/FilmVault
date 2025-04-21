// Configuration settings for the client app
const isProduction = process.env.NODE_ENV === 'production';

// Use domain name instead of IP for production environment
export const API_URL = process.env.REACT_APP_API_URL || 
  (isProduction ? "https://filmvault.space/api" : "http://localhost:5001");

// Base URL for the server (without /api path)
export const SERVER_URL = isProduction 
  ? "https://filmvault.space" 
  : "http://localhost:5001";

// Get OCI storage URL from environment - never hardcode this value
export const OCI_STORAGE_URL = process.env.REACT_APP_OCI_PAR_URL || '';

// Helper function to ensure profile picture URLs are absolute
export const getProfilePictureUrl = (profilePic: string | null | undefined) => {
  if (!profilePic) return "/default.jpg";
  
  // Debug log to track URL processing
  console.log("Processing profile pic URL:", profilePic);
  
  // For OCI object storage URLs, use them directly
  if (profilePic.includes('objectstorage.ca-toronto-1.oraclecloud.com')) {
    // The URL might include a timestamp or version query parameter for cache busting
    // Add one if it doesn't already have a query parameter
    if (!profilePic.includes('?')) {
      return `${profilePic}?v=${Date.now()}`;
    }
    return profilePic;
  }
  
  // If OCI_STORAGE_URL is properly configured
  if (OCI_STORAGE_URL) {
    // If it's just a filename without path, assume it's in OCI storage
    if (!profilePic.includes('/') && (profilePic.includes('.jpg') || profilePic.includes('.jpeg') || profilePic.includes('.png'))) {
      return `${OCI_STORAGE_URL}/${profilePic}?v=${Date.now()}`;
    }
    
    // If we have a profile path that starts with profile-pictures, convert to OCI URL
    if (profilePic.includes('profile-pictures/')) {
      const filename = profilePic.split('/').pop();
      if (filename) {
        return `${OCI_STORAGE_URL}/${filename}?v=${Date.now()}`;
      }
    }
  } else {
    console.warn('OCI_STORAGE_URL is not configured. Using server URLs for profile pictures.');
    // If OCI URL isn't available, prefer to use the server URL
    if (profilePic.startsWith('/profile-pictures/')) {
      return `${SERVER_URL}${profilePic}?v=${Date.now()}`;
    }
  }
  
  // Special case: If it's a localhost URL in production, fix it
  if (isProduction && profilePic.includes('localhost')) {
    // Extract the filename if it's a profile picture
    if (profilePic.includes('profile-pictures/')) {
      const filename = profilePic.split('/').pop();
      if (filename) {
        // If we have OCI URL, use it, otherwise use the production server URL
        if (OCI_STORAGE_URL) {
          return `${OCI_STORAGE_URL}/${filename}?v=${Date.now()}`;
        } else {
          return `https://filmvault.space/profile-pictures/${filename}?v=${Date.now()}`;
        }
      }
    }
    // Otherwise just replace domain
    return profilePic.replace('http://localhost:5001', 'https://filmvault.space');
  }
  
  // If already has http/https and isn't handled above, keep as is
  if (profilePic.startsWith('http')) {
    return profilePic;
  }
  
  // If it's just a relative path, ensure we use the correct domain
  const url = profilePic.startsWith('/') 
    ? `${SERVER_URL}${profilePic}` 
    : `${SERVER_URL}/${profilePic}`;
    
  console.log("Final resolved URL:", url);
  return url;
};

// Other app-wide configuration settings can be added here
export const APP_NAME = "FilmVault";