import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div 
        className="auth-image" 
        style={{ backgroundImage: 'url(/images/back1.jpg)' }}
      ></div>
      <div className="auth-form-container">
        <Link to="/" className="auth-logo">MyFavMovies</Link>
        
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
        </div>
      </div>
    </div>
  );
};

export default Login;