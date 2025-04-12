import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  ReleaseDate?: string;
  Rating?: number;
  media_type?: string;
}

interface MovieListItemProps {
  movie: Movie;
  onRemove?: (id: number) => void;
  onRate?: (id: number, rating: number) => void;
}

const MovieListItem = ({ movie, onRemove, onRate }: MovieListItemProps) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Convert 1-5 scale to 0-100 scale for the slider
  const initialRatingValue = movie.Rating ? Math.round(movie.Rating * 20) : 0;
  const [ratingValue, setRatingValue] = useState<number>(initialRatingValue);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const posterUrl = movie.PosterPath 
    ? `https://image.tmdb.org/t/p/w200${movie.PosterPath}` 
    : '/default.jpg';
  
  const handleCardClick = () => {
    // Navigate to the appropriate route based on media_type
    const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/${mediaType}/${movie.MovieID}`);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(movie.MovieID);
    }
  };
  
  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setRatingValue(newValue);
  };
  
  const handleRatingComplete = () => {
    setIsSliderInteraction(true); // Mark this as a slider interaction
    
    if (onRate) {
      // Convert from 0-100 scale to 1-5 scale for API
      const scaledRating = Math.max(1, Math.round(ratingValue / 20));
      
      // Only call API if the rating actually changed
      if (scaledRating !== movie.Rating) {
        onRate(movie.MovieID, scaledRating);
      }
    }
    setIsAdjusting(false);
  };
  
  // Handle direct star click
  const handleStarClick = (e: React.MouseEvent, starIndex: number) => {
    // Stop propagation to prevent the area click handler from also firing
    e.stopPropagation();
    
    // Set rating based on which star was clicked (0-4 index to 0-100 scale)
    const newRating = (starIndex + 1) * 20;
    setRatingValue(newRating);
    
    // Apply the rating immediately
    const scaledRating = starIndex + 1; // 1-5 scale for API
    if (onRate && scaledRating !== movie.Rating) {
      onRate(movie.MovieID, scaledRating);
      
      // Toast notification is handled by the parent component (MyMovies)
      // to avoid duplicate notifications
    }
  };
  
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  // Calculate the star display based on the rating (0-100 scale)
  const renderStars = () => {
    // Display 5 stars, filled based on the percentage
    const stars = [];
    // Use hover rating if available, otherwise use the actual rating
    const displayRating = hoverRating !== null ? hoverRating : ratingValue;
    const starPercentage = displayRating / 100 * 5;
    
    for (let i = 0; i < 5; i++) {
      const fillPercentage = Math.min(Math.max(starPercentage - i, 0), 1) * 100;
      stars.push(
        <span 
          key={i}
          className="star-container"
          style={{ position: 'relative', display: 'inline-block', width: '20px', height: '20px' }}
          onClick={(e) => handleStarClick(e, i)}
          onMouseEnter={() => setHoverRating((i + 1) * 20)}
          onMouseLeave={() => setHoverRating(null)}
          title={`Rate ${(i+1)*20}/100`}
        >
          <span className="star-outline" style={{ 
            color: '#ccc', 
            position: 'absolute',
            top: 0,
            left: 0
          }}>★</span>
          <span 
            className="star-fill" 
            style={{ 
              color: 'gold', 
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${fillPercentage}%`,
              overflow: 'hidden',
              transition: 'width 0.15s ease-in-out'
            }}
          >
            ★
          </span>
        </span>
      );
    }
    
    return stars;
  };

  // Update rating based on mouse position over the stars area
  const handleStarAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const position = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((position / width) * 100)));
    setHoverRating(percentage);
  };
  
  const handleStarAreaMouseLeave = () => {
    setHoverRating(null);
  };
  
  // Flag to track if we're handling a slider event
  const [isSliderInteraction, setIsSliderInteraction] = useState(false);
  
  const handleStarAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Skip if this is coming from slider interaction
    if (isSliderInteraction) {
      setIsSliderInteraction(false);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const position = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((position / width) * 100)));
    setRatingValue(percentage);
    
    // Apply the rating immediately
    const scaledRating = Math.max(1, Math.min(5, Math.ceil(percentage / 20)));
    if (onRate && scaledRating !== movie.Rating) {
      onRate(movie.MovieID, scaledRating);
      
      // Toast notification is handled by the parent component (MyMovies)
      // to avoid duplicate notifications
    }
  };
  
  return (
    <div 
      className="movie-list-item"
      onClick={handleCardClick}
    >
      <div className="movie-list-thumbnail">
        {movie.PosterPath ? (
          <img src={posterUrl} alt={movie.Title} className="thumbnail-image" />
        ) : (
          <div className="no-thumbnail">
            <span>No image</span>
          </div>
        )}
      </div>
      
      <div className="movie-list-info">
        <div className="movie-list-title">{movie.Title}</div>
        
        <div className="movie-list-meta">
          {movie.ReleaseDate && (
            <div className="movie-list-date">
              {new Date(movie.ReleaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
          
          {movie.media_type && (
            <div className="movie-list-type">
              {movie.media_type === 'tv' ? 'TV Show' : 'Movie'}
            </div>
          )}
        </div>
      </div>
      
      <div className="movie-list-rating" onClick={(e) => e.stopPropagation()}>
        <div className="rating-stars-container">
          <div 
            className="rating-stars"
            onMouseMove={handleStarAreaMouseMove}
            onMouseLeave={handleStarAreaMouseLeave}
            onClick={handleStarAreaClick}
          >
            {renderStars()}
            
            {/* Hidden slider for accessibility and mobile */}
            <input
              type="range"
              min="0"
              max="100"
              value={ratingValue}
              className="rating-slider-overlay"
              onChange={handleRatingChange}
              onMouseDown={() => setIsSliderInteraction(true)}
              onMouseUp={handleRatingComplete}
              onTouchStart={() => setIsSliderInteraction(true)}
              onTouchEnd={handleRatingComplete}
              onBlur={handleRatingComplete}
              aria-label="Rating slider"
            />
          </div>
          <div className="rating-value">{hoverRating !== null ? hoverRating : ratingValue}/100</div>
        </div>
      </div>
      
      <div className="movie-list-actions">
        <button 
          className="remove-button"
          onClick={handleRemove}
          aria-label="Remove movie"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MovieListItem;