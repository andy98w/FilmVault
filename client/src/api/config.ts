import axios from 'axios';

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Set API URL based on environment
// Use domain name instead of IP for production environment
const apiUrl = process.env.REACT_APP_API_URL || 
  (isProduction ? 'https://filmvault.space/api' : 'http://localhost:5001');

console.log(`API client configured for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Using API URL: ${apiUrl}`);

// Configure default headers
const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};

// Always try to include token from localStorage in initial configuration
const token = localStorage.getItem('token');
if (token) {
  defaultHeaders['Authorization'] = `Bearer ${token}`;
  console.log('JWT token found and added to default headers');
}

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Include credentials for cookie support
  headers: defaultHeaders
});

// Log configuration
console.log('Axios configured with withCredentials: true');

// Add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Always try to include token from localStorage for API requests
    const token = localStorage.getItem('token');
    if (token && config.url && config.url.includes('/api/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected (401)');
      
      // Clear token from localStorage if it exists
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        console.log('Token removed from localStorage due to 401 error');
        
        // Here you could also redirect to login page if needed:
        // if (isProduction && window.location.pathname !== '/login') {
        //   window.location.href = '/login';
        // }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;