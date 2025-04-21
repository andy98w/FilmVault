import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/config';
import { API_URL } from '../config/config';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  // Removed verification details
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResendSuccess('');
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await register(username, email, password);
      
      // Set success message
      setSuccess('Registration successful! Please check your email to verify your account.');
      
      // Store registered email for resend functionality
      setRegisteredEmail(email);
      setIsRegistered(true);
      
      // Clear form fields
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };
  
  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    
    try {
      await axiosInstance.post(`${API_URL}/api/auth/resend-verification`, { 
        email: registeredEmail 
      });
      
      setResendSuccess(`Verification email has been resent to ${registeredEmail}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div 
        className="auth-form-container" 
        style={{ position: 'relative', left: 0 }}
      >
        <div className="auth-form">
          <h1>Create Account</h1>
          
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
          
          {isRegistered ? (
            <div className="verification-info">
              <p>
                Registration successful for <strong>{registeredEmail}</strong>! 
              </p>
              <p>
                Please check your email inbox for a verification link.
              </p>
              <p>
                No email? Check your spam folder or click the button below to request a new verification email.
              </p>
              <button 
                onClick={handleResendVerification} 
                disabled={resendLoading}
                className="resend-button"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <div className="auth-links">
                <Link to="/login" className="auth-link">Back to Login</Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                
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
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <button type="submit">Create Account</button>
              </form>
              
              <p>
                Already have an account? <Link to="/login" className="auth-link">Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
      
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back2.jpg)' }}
      ></div>
    </div>
  );
};

export default Register;