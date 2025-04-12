import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(errorParam);
      setShowTokenInput(true);
      return;
    }
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setShowTokenInput(true);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If manual token input is shown, use that value
    const tokenToUse = showTokenInput && manualToken ? manualToken : token;
    
    if (!tokenToUse) {
      setError('Reset token is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token: tokenToUse, password });
      setSuccess('Password has been reset successfully');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualToken) {
      setError('Please enter a reset token');
      return;
    }
    
    setToken(manualToken);
    setShowTokenInput(false);
  };

  return (
    <div className="auth-page">
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back2.jpg)' }}
      ></div>
      <div className="auth-form-container">
        <div className="auth-form">
          <h1>Set New Password</h1>
          
          {error && (
            <div className="notification notification-error">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <div className="notification-title">Error</div>
                <div className="notification-message">{error}</div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="notification notification-success">
              <div className="notification-icon">✅</div>
              <div className="notification-content">
                <div className="notification-title">Success!</div>
                <div className="notification-message">
                  {success}
                  <p style={{ marginTop: '8px', opacity: 0.8 }}>Redirecting to login page...</p>
                </div>
              </div>
            </div>
          )}
          
          {showTokenInput ? (
            <div>
              <p>Please enter the reset token from your email:</p>
              <form onSubmit={handleTokenSubmit}>
                <div>
                  <label htmlFor="manualToken">Reset Token</label>
                  <input
                    type="text"
                    id="manualToken"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Enter reset token"
                    required
                  />
                </div>
                <button type="submit">Submit Token</button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </form>
          )}
          
          <p>
            <Link to="/login" className="auth-link">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;