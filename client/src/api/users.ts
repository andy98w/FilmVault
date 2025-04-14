import axiosInstance from './config';

// User-related API calls
export const getUserProfile = (userId: string | number) => {
  return axiosInstance.get(`/api/users/profile/${userId}`);
};

export const updateUserProfile = (userData: any) => {
  return axiosInstance.put(`/api/users/update`, userData);
};

export const uploadProfilePicture = (formData: FormData) => {
  return axiosInstance.post(`/api/users/upload-profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const removeProfilePicture = () => {
  return axiosInstance.delete(`/api/users/remove-profile-picture`);
};

export const getCurrentUser = () => {
  return axiosInstance.get(`/api/users/me`);
};