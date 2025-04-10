import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

// API base URL
const API_URL = 'http://localhost:5001';

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [userMovies, setUserMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
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
  }, [id]);

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
          <p>User ID: {user.id}</p>
        </div>
      </div>

      <h2>{user.Usernames}'s Movies</h2>

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