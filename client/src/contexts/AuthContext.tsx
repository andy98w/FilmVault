import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/config';

// API base URL for backward compatibility
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface User {
  id: number;
  username: string;
  email: string;
  profilePic?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  isAdmin: boolean; // Quick helper to check admin status
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get user data using the cookie first
    const checkAuthentication = async () => {
      try {
        // First check if we have a cookie session
        await fetchUserData();
      } catch (err) {
        // If cookie auth fails, try localStorage token as fallback
        const token = localStorage.getItem('token');
        if (token) {
          await fetchUserData(token);
        } else {
          setLoading(false);
        }
      }
    };
    
    checkAuthentication();
  }, []);

  const fetchUserData = async (token?: string) => {
    try {
      setLoading(true);
      // Use the API instance which already has withCredentials configured
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await api.get('/api/users/me', { headers });
      
      setUser({
        id: response.data.id,
        username: response.data.Usernames,
        email: response.data.Emails,
        profilePic: response.data.ProfilePic,
        isAdmin: response.data.is_admin === 1
      });
    } catch (err) {
      console.error('Failed to get user data', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      // Still store token in localStorage for backward compatibility
      localStorage.setItem('token', response.data.token);
      
      // User data from login includes isAdmin flag
      setUser({
        ...response.data.user,
        isAdmin: response.data.user.isAdmin || false
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/register', { username, email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the server logout endpoint to clear the cookie
      await api.post('/api/auth/logout');
      
      // For backward compatibility, also remove from localStorage
      localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server call fails
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    register,
    logout,
    loading,
    error,
    isAdmin: !!user?.isAdmin // Helper property for checking admin status
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};