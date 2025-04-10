import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// API base URL
const API_URL = 'http://localhost:5001';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  ReleaseDate?: string;
  VoteAverage?: number;
  average_rating?: number;
  Rating?: number;
}

interface MovieCardProps {
  movie: Movie;
  onList?: boolean;
  onRemove?: (id: number) => void;
  onRate?: (id: number, rating: number) => void;
}

const MovieCard = ({ movie, onList = false, onRemove, onRate }: MovieCardProps) => {
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  // Make sure we have a valid movie object
  if (!movie || !movie.MovieID) {
    console.error("Invalid movie object:", movie);
    return null;
  }
  
  const posterUrl = movie.PosterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.PosterPath}` 
    : '/default.jpg';
  
  const addToList = async () => {
    if (!isAuthenticated) {
      navigate('/login?message=Please log in to add movies');
      return;
    }
    
    setIsAdding(true);
    try {
      await axios.post(`${API_URL}/api/movies/add`, {
        movie_id: movie.MovieID,
        movie_title: movie.Title,
        poster_path: movie.PosterPath,
        overview: movie.Overview
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessage('Movie added to your list!');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error adding movie');
    } finally {
      setIsAdding(false);
    }
  };
  
  const removeFromList = () => {
    if (onRemove) {
      onRemove(movie.MovieID);
    }
  };
  
  const handleRate = (rating: number) => {
    if (onRate) {
      onRate(movie.MovieID, rating);
    }
  };
  
  return (
    <div className="movie-card">
      <img src={posterUrl} alt={movie.Title} />
      <div className="movie-card-overlay">
        <p>{movie.Overview?.substring(0, 150)}...</p>
        {message && <p style={{ color: '#89C9B8' }}>{message}</p>}
        {onList ? (
          <>
            {onRate && (
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star}
                    className={`star ${movie.Rating && star <= movie.Rating ? 'filled' : ''}`}
                    onClick={() => handleRate(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
            <button onClick={removeFromList} className="card-action-btn">
              Remove
            </button>
          </>
        ) : (
          <button 
            onClick={addToList} 
            className="card-action-btn"
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to My Movies'}
          </button>
        )}
      </div>
      <div className="movie-card-title">{movie.Title}</div>
    </div>
  );
};

export default MovieCard;