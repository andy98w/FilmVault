import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await forgotPassword(email);
      setSuccess('Password reset instructions have been sent to your email');
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back1.jpg)' }}
      ></div>
      <div className="auth-form-container">
        {/* Logo removed */}
        
        <div className="auth-form">
          <h1>Reset Password</h1>
          
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
            
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
          
          <p>
            <Link to="/login" className="auth-link">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;