import axiosInstance from './config';

// Auth-related API calls
export const login = (credentials: { email: string; password: string }) => {
  return axiosInstance.post(`/api/auth/login`, credentials);
};

export const register = (userData: { username: string; email: string; password: string }) => {
  return axiosInstance.post(`/api/auth/register`, userData);
};

export const logout = () => {
  return axiosInstance.post(`/api/auth/logout`);
};

export const verifyEmail = (token: string) => {
  return axiosInstance.post(`/api/auth/verify-email`, { token });
};

export const forgotPassword = (email: string) => {
  return axiosInstance.post(`/api/auth/forgot-password`, { email });
};

export const resetPassword = (token: string, password: string) => {
  return axiosInstance.post(`/api/auth/reset-password`, { token, password });
};

export const resendVerification = (email: string) => {
  return axiosInstance.post(`/api/auth/resend-verification`, { email });
};