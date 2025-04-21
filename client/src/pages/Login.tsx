import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/config';
import { API_URL } from '../config/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  // Removed verification details
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for query parameters
    const searchParams = new URLSearchParams(location.search);
    const verified = searchParams.get('verified');
    const message = searchParams.get('message');
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    
    if (message) {
      setError(message);
    }
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, location.search, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResendSuccess('');
    setNeedsVerification(false);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // Check if this is an unverified email error
      if (err.response?.data?.needsVerification) {
        setNeedsVerification(true);
        // Use the email from the response if available, otherwise use the input email
        setUnverifiedEmail(err.response?.data?.email || email);
        setError('Please verify your email before logging in.');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };
  
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    
    try {
      await axiosInstance.post(`${API_URL}/api/auth/resend-verification`, { 
        email: unverifiedEmail 
      });
      
      setResendSuccess(`Verification email has been resent to ${unverifiedEmail}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back1.jpg)' }}
      ></div>
      <div className="auth-form-container">
        <div className="auth-form">
          <h1>Login</h1>
          
          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <p>{success}</p>
            </div>
          )}
          
          {resendSuccess && (
            <div className="alert alert-success">
              <p>{resendSuccess}</p>
            </div>
          )}
          
          {needsVerification ? (
            <div className="verification-info">
              <p>
                Your account with email <strong>{unverifiedEmail}</strong> needs to be verified.
              </p>
              
              <p>
                Please check your email inbox for a verification link or click the button below to request a new verification email.
              </p>
              
              <button 
                onClick={handleResendVerification} 
                disabled={resendLoading}
                className="resend-button"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <div className="auth-links">
                <Link to="/register" className="auth-link">Create New Account</Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Link to="/forgot-password" className="forgot">Forgot password?</Link>
                
                <button type="submit">Login</button>
              </form>
              
              <p>
                Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;