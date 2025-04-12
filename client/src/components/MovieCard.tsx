import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../config/config';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  ReleaseDate?: string;
  VoteAverage?: number;
  average_rating?: number;
  Rating?: number;
  media_type?: string;
}

interface MovieCardProps {
  movie: Movie;
  onList?: boolean;
  onRemove?: (id: number) => void;
  onRate?: (id: number, rating: number) => void;
}

// Helper function to determine rating color class based on TMDB style (reused in multiple places)
export const getRatingColorClass = (rating: number): string => {
  if (rating >= 8) return 'rating-high';    // Green for high ratings (8-10)
  if (rating >= 6) return 'rating-medium';  // Yellow/orange for medium ratings (6-7.9)
  if (rating >= 4) return 'rating-low';     // Orange for low ratings (4-5.9)
  return 'rating-very-low';                 // Red for very low ratings (0-3.9)
};

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
        withCredentials: true
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
  
  const handleCardClick = () => {
    // Navigate to the appropriate route based on media_type
    const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/${mediaType}/${movie.MovieID}`);
  };

  return (
    <div 
      className="movie-card"
      onClick={handleCardClick}
    >
      <div className="poster-wrapper">
        {movie.PosterPath ? (
          <img src={posterUrl} alt={movie.Title} className="movie-poster" />
        ) : (
          <div className="no-poster">
            <div>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎬</span>
              No image<br />available
            </div>
          </div>
        )}
        
        {/* Media type badge in top right */}
        {movie.media_type && (
          <div 
            className="media-type-badge top-right"
            title={movie.media_type === 'tv' ? 'TV Show' : 'Movie'}
          >
            {movie.media_type === 'tv' ? 'TV' : 'MOVIE'}
          </div>
        )}
        
        {/* Rating circle */}
        {movie.VoteAverage !== undefined && movie.VoteAverage > 0 && (
          <div 
            className={`rating-circle ${getRatingColorClass(movie.VoteAverage)}`}
            title={`${movie.VoteAverage.toFixed(1)}/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {movie.VoteAverage.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Movie title with tooltip and release date */}
      <div className="card-info">
        <div className="tooltip-container">
          <h3 className="movie-title">{movie.Title}</h3>
          <span className="tooltip-text">{movie.Title}</span>
        </div>
        {movie.ReleaseDate && (
          <div className="release-date">
            {new Date(movie.ReleaseDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        )}
      </div>
      
      {/* Rating stars only for "my movies" list */}
      {onList && onRate && (
        <div className="rating-stars" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map(star => (
            <span 
              key={star}
              className={`star ${movie.Rating && star <= movie.Rating ? 'filled' : ''}`}
              onClick={(e) => {
                e.stopPropagation(); 
                handleRate(star);
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieCard;