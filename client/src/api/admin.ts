import axios from 'axios';
import { API_URL } from '../config/config';

/**
 * Admin API service for managing users and system settings
 * These functions should only be used in admin components
 */
export const adminApi = {
  /**
   * Get all users in the system
   * @returns List of all users
   */
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get users:', error);
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  },

  /**
   * Delete a user from the system
   * @param userId ID of the user to delete
   * @returns Confirmation message and deleted user info
   */
  deleteUser: async (userId: number) => {
    try {
      const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },
  
  /**
   * Make a user an admin
   * @param userId ID of the user to make admin
   * @returns Confirmation message and updated user info
   */
  makeUserAdmin: async (userId: number) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/users/${userId}/make-admin`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to make user ${userId} an admin:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update admin status');
    }
  },
  
  /**
   * Remove admin privileges from a user
   * @param userId ID of the user to remove admin privileges from
   * @returns Confirmation message and updated user info
   */
  removeAdminPrivileges: async (userId: number) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/users/${userId}/remove-admin`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to remove admin privileges from user ${userId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update admin status');
    }
  }
};

export default adminApi;