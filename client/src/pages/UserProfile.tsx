import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../contexts/AuthContext';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
  Biography?: string;
  FacebookLink?: string;
  InstagramLink?: string;
  YoutubeLink?: string;
  GithubLink?: string;
}

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  Rating?: number;
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userMovies, setUserMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if the user is viewing their own profile
  useEffect(() => {
    // If the ID in the URL matches the current logged-in user ID, redirect to the profile page
    if (currentUser && id && parseInt(id) === currentUser.id) {
      navigate('/profile');
      return;
    }
  }, [id, currentUser, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Skip fetching if it's the current user's profile (we'll redirect instead)
        if (currentUser && id && parseInt(id) === currentUser.id) {
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/users/profile/${id}`);
        setUser(response.data.user);
        setUserMovies(response.data.movies);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. The user may not exist.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="container">
        <div style={{ marginTop: '150px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container">
        <div style={{ marginTop: '150px', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-header">
        <img 
          src={user.ProfilePic || '/default.jpg'} 
          alt={user.Usernames || 'Profile'} 
          className="profile-pic-large" 
        />
        <div>
          <h1 className="profile-username">{user.Usernames}</h1>
        </div>
      </div>

      {/* Biography Section */}
      <div className="user-bio-section">
        <h3 style={{ marginBottom: '15px' }}>About {user.Usernames}</h3>
        <div style={{ 
          background: 'var(--nav-background)', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          {user.Biography ? (
            <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{user.Biography}</p>
          ) : (
            <p style={{ opacity: 0.7, fontStyle: 'italic' }}>{user.Usernames} hasn't added a biography yet.</p>
          )}
        </div>
      </div>
      
      {/* Social Media Section */}
      <div className="user-social-section">
        <h3 style={{ marginBottom: '15px' }}>Social Media</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {user.FacebookLink && (
            <a 
              href={user.FacebookLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px 15px',
                background: '#1877F2',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              <span style={{ marginRight: '8px' }}>📘</span>
              Facebook
            </a>
          )}
          
          {user.InstagramLink && (
            <a 
              href={user.InstagramLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px 15px',
                background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              <span style={{ marginRight: '8px' }}>📷</span>
              Instagram
            </a>
          )}
          
          {user.YoutubeLink && (
            <a 
              href={user.YoutubeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px 15px',
                background: '#FF0000',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              <span style={{ marginRight: '8px' }}>🎥</span>
              YouTube
            </a>
          )}
          
          {user.GithubLink && (
            <a 
              href={user.GithubLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px 15px',
                background: '#24292E',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              <span style={{ marginRight: '8px' }}>🐙</span>
              GitHub
            </a>
          )}
          
          {!user.FacebookLink && !user.InstagramLink && !user.YoutubeLink && !user.GithubLink && (
            <p style={{ opacity: 0.7, fontStyle: 'italic' }}>{user.Usernames} hasn't added any social media links yet.</p>
          )}
        </div>
      </div>

      <h3 style={{ marginBottom: '15px' }}>{user.Usernames}'s Movies</h3>

      {userMovies.length > 0 ? (
        <div className="movie-grid">
          {userMovies.map(movie => (
            <MovieCard 
              key={movie.MovieID} 
              movie={movie} 
            />
          ))}
        </div>
      ) : (
        <p>This user hasn't added any movies yet.</p>
      )}
    </div>
  );
};

export default UserProfile;