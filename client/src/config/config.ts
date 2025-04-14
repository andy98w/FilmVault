// Configuration settings for the client app
const isProduction = process.env.NODE_ENV === 'production';

// Use domain name instead of IP for production environment
export const API_URL = process.env.REACT_APP_API_URL || 
  (isProduction ? "https://filmvault.space/api" : "http://localhost:5001");

// Base URL for the server (without /api path)
export const SERVER_URL = isProduction 
  ? "https://filmvault.space" 
  : "http://localhost:5001";

// Helper function to ensure profile picture URLs are absolute
export const getProfilePictureUrl = (profilePic: string | null | undefined) => {
  if (!profilePic) return "/default.jpg";
  
  // Special case: If it's a localhost profile path, this is a bug - replace with OCI URL
  if (profilePic.includes('localhost:5001/profile-pictures/')) {
    const filename = profilePic.split('/').pop();
    return `https://objectstorage.ca-toronto-1.oraclecloud.com/p/j760BvPoSbgh7gfqrrAHfcdRpnlyiHgLdXdwhIq5m9MZR48ygD8XcD4N32g6AFZg/n/yzep9haqilyk/b/filmvault-profile-pictures/o/${filename}`;
  }
  
  // If already has http/https and isn't a localhost URL, keep as is
  if (profilePic.startsWith('http')) {
    // Only replace localhost URLs in production, otherwise keep as is
    if (isProduction && profilePic.includes('localhost:5001')) {
      return profilePic.replace('http://localhost:5001', 'https://filmvault.space');
    }
    return profilePic;
  }
  
  // Handle profile-pictures paths without domain
  if (profilePic.startsWith('/profile-pictures/')) {
    return `${SERVER_URL}${profilePic}`;
  }
  
  // If it's just a relative path, ensure we use the correct domain
  return profilePic.startsWith('/') 
    ? `${SERVER_URL}${profilePic}` 
    : `${SERVER_URL}/${profilePic}`;
};

// Other app-wide configuration settings can be added here
export const APP_NAME = "FilmVault";