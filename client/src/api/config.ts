import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';

const apiUrl = process.env.REACT_APP_API_URL ||
  (isProduction ? 'https://filmvault.me' : 'http://localhost:5001');

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};

const token = localStorage.getItem('token');
if (token) {
  defaultHeaders['Authorization'] = `Bearer ${token}`;
}

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 8000,
  headers: defaultHeaders
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.url && config.url.includes('/api/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
