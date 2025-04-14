import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePictureUrl } from '../config/config';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  // Debug log profile picture
  if (user?.profilePic) {
    console.log('Profile pic in Navbar:', user.profilePic);
    console.log('Profile pic processed:', getProfilePictureUrl(user.profilePic));
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">FilmVault</Link>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="profile-dropdown">
            <img 
              src={getProfilePictureUrl(user?.profilePic)}
              alt="Profile" 
              className="profile-pic"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                console.error('Error loading navbar profile image, falling back to default');
                (e.target as HTMLImageElement).src = '/default.jpg';
              }}
            />
            <div className="dropdown-content">
              <Link to="/profile">Profile</Link>
              <Link to="/my-movies">My Movies</Link>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                logout();
              }}>Logout</a>
            </div>
          </div>
        ) : (
          <Link to="/login" className="login-button">
            <span className="login-icon">👤</span>
            <span className="login-text">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;