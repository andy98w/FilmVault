import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MovieCard from '../components/MovieCard';

// API base URL
const API_URL = 'http://localhost:5001';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  Rating?: number;
}

const MyMovies = () => {
  const { user } = useAuth();
  const [userMovies, setUserMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserMovies();
  }, []);

  const fetchUserMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/movies/user/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserMovies(response.data);
    } catch (err) {
      console.error('Error fetching user movies:', err);
      setError('Failed to load your movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    try {
      await axios.delete(`${API_URL}/api/movies/remove/${movieId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserMovies(prevMovies => prevMovies.filter(movie => movie.MovieID !== movieId));
      setMessage('Movie removed from your list');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error removing movie:', err);
      setError('Failed to remove movie. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRateMovie = async (movieId: number, rating: number) => {
    try {
      await axios.post(`${API_URL}/api/movies/rate`, 
        { movie_id: movieId, rating },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update the local state with the new rating
      setUserMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.MovieID === movieId ? { ...movie, Rating: rating } : movie
        )
      );
      
      setMessage('Movie rated successfully');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error rating movie:', err);
      setError('Failed to rate movie. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ marginTop: '150px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginTop: '120px' }}>
        <h1>My Movie Collection</h1>
        
        {error && (
          <div className="message error">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="message success">
            <p>{message}</p>
          </div>
        )}

        {userMovies.length > 0 ? (
          <div className="movie-grid">
            {userMovies.map(movie => (
              <MovieCard 
                key={movie.MovieID} 
                movie={movie} 
                onList
                onRemove={handleRemoveMovie}
                onRate={handleRateMovie}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p>You haven't added any movies yet. Explore and add some to your list!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMovies;