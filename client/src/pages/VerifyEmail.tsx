import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      return;
    }
    
    if (!token) {
      setError('Verification token is missing. Please check the link from your email.');
      setLoading(false);
      return;
    }
    
    const verifyEmail = async () => {
      try {
        const response = await axios.post(`${API_URL}/api/auth/verify-email`, { token });
        setSuccess(response.data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to verify email. The token may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    
    verifyEmail();
  }, [location.search, navigate]);

  return (
    <div className="auth-page">
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back1.jpg)' }}
      ></div>
      <div className="auth-form-container">
        <div className="auth-form">
          <h1>Email Verification</h1>
          
          {loading && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ 
                display: 'inline-block',
                width: '50px',
                height: '50px',
                border: '4px solid var(--primary-color)',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Verifying your email...</p>
            </div>
          )}
          
          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
              <button 
                onClick={() => navigate('/login')}
                style={{ marginTop: '20px' }}
              >
                Go to Login
              </button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <p>{success}</p>
              <p style={{ marginTop: '10px' }}>Redirecting to login page...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;