const isProduction = process.env.NODE_ENV === 'production';
const configuredServerUrl = process.env.REACT_APP_API_URL ||
  (isProduction ? 'https://filmvault.me' : 'http://localhost:5001');

export const API_URL = configuredServerUrl.replace(/\/$/, '');
export const SERVER_URL = API_URL;

export const getCatalogImageUrl = (path: string | null | undefined, size = 'w500') => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Get OCI storage URL from environment - never hardcode this value
export const OCI_STORAGE_URL = process.env.REACT_APP_OCI_PAR_URL || '';

export const getProfilePictureUrl = (profilePic: string | null | undefined) => {
  if (!profilePic) return "/default.jpg";
  
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
        if (OCI_STORAGE_URL) {
          return `${OCI_STORAGE_URL}/${filename}?v=${Date.now()}`;
        } else {
          return `${SERVER_URL}/profile-pictures/${filename}?v=${Date.now()}`;
        }
      }
    }
    return profilePic.replace('http://localhost:5001', SERVER_URL);
  }
  
  // If already has http/https and isn't handled above, keep as is
  if (profilePic.startsWith('http')) {
    return profilePic;
  }
  
  // If it's just a relative path, ensure we use the correct domain
  const url = profilePic.startsWith('/') 
    ? `${SERVER_URL}${profilePic}` 
    : `${SERVER_URL}/${profilePic}`;
    
  return url;
};

export const APP_NAME = "FilmVault";
