import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualToken, setManualToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(errorParam);
      return;
    }
    
    if (token) {
      // Auto-verify if token is in URL
      verifyEmailWithToken(token);
    }
  }, [location.search]);

  const verifyEmailWithToken = async (token: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log(`Verifying email with token: ${token}`);
      const response = await verifyEmail(token);
      setSuccess(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?verified=true');
      }, 3000);
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify email. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualToken) {
      setError('Please enter a verification token');
      return;
    }
    
    await verifyEmailWithToken(manualToken);
  };

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
            <div className="notification notification-error">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <div className="notification-title">Verification Error</div>
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
          
          {!loading && !success && (
            <div>
              <p>Please enter your verification token below if you didn't arrive via an email link:</p>
              <form onSubmit={handleManualVerification}>
                <div>
                  <label htmlFor="token">Verification Token</label>
                  <input
                    type="text"
                    id="token"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Enter verification token"
                  />
                </div>
                <button type="submit">Verify Email</button>
              </form>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => navigate('/login')}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--primary-color)',
                    textDecoration: 'underline',
                    cursor: 'pointer' 
                  }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;