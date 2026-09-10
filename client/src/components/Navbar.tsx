import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePictureUrl } from '../config/config';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (!user?.profilePic) return;
    const url = getProfilePictureUrl(user.profilePic);
    setProfileUrl(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now());
  }, [user?.profilePic]);

  return (
    <nav className="navbar">
      <div className="vault-nav-inner">
        <Link to="/" className="navbar-logo" aria-label="FilmVault home">
          <span className="vault-logo-frame" aria-hidden="true"><span>FV</span></span>
          <span>FilmVault</span>
        </Link>

        <div className="vault-nav-links">
          <Link to="/">Browse</Link>
          {isAuthenticated && <Link to="/my-movies">My collection</Link>}
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <div
              className="profile-dropdown"
              onClick={() => setShowDropdown(!showDropdown)}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <button className="profile-menu-button" type="button" aria-label="Open account menu" aria-expanded={showDropdown}>
                <img
                  src={profileUrl || getProfilePictureUrl(user?.profilePic)}
                  alt=""
                  className="profile-pic"
                  onError={(event) => { (event.target as HTMLImageElement).src = '/default.jpg'; }}
                />
              </button>
              <div className="dropdown-content" style={{ display: showDropdown ? 'block' : 'none' }}>
                <Link to="/profile">Profile</Link>
                <Link to="/my-movies">My collection</Link>
                {isAdmin && <Link to="/admin/users">Admin</Link>}
                <button onClick={() => logout()} className="logout-link">Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-button">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
