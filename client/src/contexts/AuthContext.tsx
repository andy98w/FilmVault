import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/config';

// Determine environment settings

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
    // Authentication check on app initialization
    const checkAuthentication = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Try to authenticate with the token
            await fetchUserData(token);
            return; // Exit if token auth successful
          } catch (tokenErr) {
            // If token authentication fails, clear it and try cookie-based auth
            localStorage.removeItem('token');
          }
        }
        
        // Try cookie-based authentication if no token or token auth failed
        try {
          await fetchUserData();
        } catch (cookieErr) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setLoading(false);
      }
    };
    
    checkAuthentication();
  }, []);

  const fetchUserData = async (token?: string) => {
    try {
      setLoading(true);
      console.log('Fetching user data...');
      
      // Prepare request config
      const config: {
        headers?: Record<string, string>;
        withCredentials: boolean;
      } = {
        withCredentials: true // Always include credentials for cookie support
      };
      
      // Add token to headers if provided
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }
      
      // Make the API request
      const response = await api.get('/api/users/me', config);
      
      // Update user state with response data and ensure profile pic has correct URL
      const profilePic = response.data.ProfilePic;
      
      // Fix profile picture URL if it's a relative path from localhost
      let fixedProfilePic = profilePic;
      if (profilePic && !profilePic.startsWith('http')) {
        // Check if the URL contains localhost, which needs to be replaced in production
        if (profilePic.includes('localhost:5001')) {
          fixedProfilePic = profilePic.replace('http://localhost:5001', 
            process.env.NODE_ENV === 'production' ? 'https://filmvault.space' : window.location.origin);
        }
      }
      
      setUser({
        id: response.data.id,
        username: response.data.Usernames,
        email: response.data.Emails,
        profilePic: fixedProfilePic,
        isAdmin: response.data.is_admin === 1
      });
      
      console.log('User data fetched successfully');
    } catch (err) {
      console.error('Failed to get user data:', err);
      throw err; // Rethrow to allow calling code to handle specific errors
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Make login request with credentials for cookie support
      const response = await api.post('/api/auth/login', 
        { email, password },
        { withCredentials: true }
      );
      
      // Always save token to localStorage for all environments
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Set Authorization header for current session
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      // Set user data from the response
      if (response.data.user) {
        const profilePic = response.data.user.profilePic;
        
        // Fix profile picture URL if it's a relative path from localhost
        let fixedProfilePic = profilePic;
        if (profilePic && !profilePic.startsWith('http')) {
          // Check if the URL contains localhost, which needs to be replaced in production
          if (profilePic.includes('localhost:5001')) {
            fixedProfilePic = profilePic.replace('http://localhost:5001', 
              process.env.NODE_ENV === 'production' ? 'https://filmvault.space' : window.location.origin);
          }
        }
        
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          profilePic: fixedProfilePic,
          isAdmin: response.data.user.isAdmin || false
        });
        console.log('User state updated with login response data');
      } else {
        console.warn('No user data in login response, fetching from /api/users/me');
        // If user data not in response, fetch it separately
        const token = response.data.token;
        await fetchUserData(token);
      }
      
      console.log('Login process completed successfully');
    } catch (err: any) {
      console.error('Login error:', err.response?.data?.message || err.message);
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
      // Explicitly set withCredentials
      await api.post(
        '/api/auth/register', 
        { username, email, password },
        { withCredentials: true }
      );
    } catch (err: any) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Try server-side logout to clear cookies
      try {
        await api.post('/api/auth/logout', {}, { withCredentials: true });
      } catch (error) {
        // Continue with client-side logout even if server logout fails
      }
      
      // Always perform client-side logout
      // 1. Clear localStorage token
      localStorage.removeItem('token');
      
      // 2. Clear Authorization header
      if (api.defaults.headers.common['Authorization']) {
        delete api.defaults.headers.common['Authorization'];
      }
      
      // 3. Reset user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still reset state in case of any errors
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