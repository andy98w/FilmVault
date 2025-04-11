import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">MyFavMovies</Link>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="profile-dropdown">
            <img 
              src={user?.profilePic || "/default.jpg"} 
              alt="Profile" 
              className="profile-pic" 
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
          <Link to="/login" className="login-link">Sign In</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;