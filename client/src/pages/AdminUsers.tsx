import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';
import axios from 'axios';
import { API_URL } from '../config/config';

interface User {
  id: number;
  Usernames: string;
  Emails: string;
  is_admin: number;
  created_at: string;
  ProfilePic: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Set up request config with token if available
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      };
      
      console.log('Fetching users with config:', config);
      
      // Make direct request instead of using adminApi
      const response = await axios.get(`${API_URL}/api/admin/users`, config);
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      
      // Remove the user from the list
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId: number, makeAdmin: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      };
      
      if (makeAdmin) {
        await axios.post(`${API_URL}/api/admin/users/${userId}/make-admin`, {}, config);
      } else {
        await axios.post(`${API_URL}/api/admin/users/${userId}/remove-admin`, {}, config);
      }
      
      // Update the user in the list
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            is_admin: makeAdmin ? 1 : 0
          };
        }
        return user;
      }));
      setError(null);
    } catch (err: any) {
      console.error('Error updating admin status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update admin status');
    }
  };
  
  // If user is not authenticated or admin status is loading
  if (!user || loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <h1>User Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {users.length === 0 && !loading && !error ? (
        <div className="info-message">No users found or you may not have permission to view them.</div>
      ) : (
        <div className="user-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Created</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.Usernames}</td>
                  <td>{user.Emails}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={user.is_admin === 1} 
                      onChange={() => handleToggleAdmin(user.id, user.is_admin !== 1)}
                      aria-label={`Toggle admin status for ${user.Usernames}`}
                    />
                  </td>
                  <td>
                    {user.is_admin === 1 ? (
                      <span className="admin-badge">Admin</span>
                    ) : deleteConfirm === user.id ? (
                      <>
                        <button 
                          className="delete-confirm-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Confirm
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        className="delete-btn" 
                        onClick={() => setDeleteConfirm(user.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;