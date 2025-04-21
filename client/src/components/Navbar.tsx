import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePictureUrl } from '../config/config';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  
  // For debugging
  useEffect(() => {
    if (isAdmin) {
      console.log('User is admin:', isAdmin);
    }
  }, [isAdmin]);
  
  // Update profile picture URL whenever the user object changes
  useEffect(() => {
    if (user?.profilePic) {
      console.log("Navbar: User profile pic URL:", user.profilePic);
      
      // Force fresh URL with cache-busting
      const url = getProfilePictureUrl(user.profilePic);
      if (!url.includes('?')) {
        setProfileUrl(`${url}?v=${Date.now()}`);
      } else {
        setProfileUrl(`${url}&v=${Date.now()}`);
      }
    }
  }, [user?.profilePic]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">FilmVault</Link>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <div 
            className="profile-dropdown"
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <img 
              src={profileUrl || getProfilePictureUrl(user?.profilePic)}
              alt="Profile" 
              className="profile-pic"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                console.error('Error loading navbar profile image, falling back to default');
                // Log the failed URL for debugging
                console.log('Failed URL:', (e.target as HTMLImageElement).src);
                console.log('Original profile pic URL:', user?.profilePic);
                
                // Add a random cache-busting query parameter to avoid browser caching issues
                (e.target as HTMLImageElement).src = `/default.jpg?t=${Date.now()}`;
              }}
            />
            <div className="dropdown-content" style={{ display: showDropdown ? 'block' : 'none' }}>
              <Link to="/profile">Profile</Link>
              <Link to="/my-movies">My Movies</Link>
              {isAdmin && <Link to="/admin/users">Admin</Link>}
              <button onClick={() => logout()} className="logout-link">Logout</button>
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