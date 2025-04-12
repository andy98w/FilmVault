import axios from 'axios';

// Create a base axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  withCredentials: true, // Always include credentials by default
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to automatically add authorization from localStorage as fallback
axiosInstance.interceptors.request.use(
  (config) => {
    // If authorization header is already set, don't override it
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;