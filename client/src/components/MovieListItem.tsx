import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  
  // Rating is already 0-100 scale in the database
  // We can use it directly without conversion
  const initialRatingValue = movie.Rating || 0;
  const [ratingValue, setRatingValue] = useState<number>(initialRatingValue);
  
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
  
  const handleRatingComplete = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    setIsSliderInteraction(true); // Mark this as a slider interaction
    
    if (onRate) {
      // Get the CURRENT slider value directly from the element
      // This ensures we get the latest value even if state hasn't updated yet
      const currentValue = parseInt((e.target as HTMLInputElement).value, 10);
      
      // Round to nearest 5 to make ratings more predictable
      const roundedValue = Math.round(currentValue / 5) * 5;
      
      // Set the UI state to match what we'll send
      setRatingValue(roundedValue);
      
      // Only call API if the rating actually changed
      if (roundedValue !== movie.Rating) {
        // Use the SAME rounded value for both display and API
        onRate(movie.MovieID, roundedValue);
      }
    }
  };
  
  // Handle direct star click
  const handleStarClick = (e: React.MouseEvent, starIndex: number) => {
    // Stop propagation to prevent the area click handler from also firing
    e.stopPropagation();
    
    // Calculate rating based on which star was clicked (0-4 index to 0-100 scale)
    const newRating = (starIndex + 1) * 20;
    
    // Update the UI state
    setRatingValue(newRating);
    
    // Only call API if the rating actually changed
    if (onRate && newRating !== movie.Rating) {
      // Send the exact same value we display in the UI
      onRate(movie.MovieID, newRating);
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
      // Calculate fill percentage more precisely
      const fillPercentage = Math.min(Math.max(starPercentage - i, 0), 1) * 100;
      stars.push(
        <span 
          key={i}
          className="star-container"
          style={{ 
            position: 'relative', 
            display: 'inline-block',
            width: '20px', 
            height: '25px',
            fontSize: '22px',
            lineHeight: '25px',
            textAlign: 'center'
          }}
          onClick={(e) => handleStarClick(e, i)}
          onMouseEnter={() => setHoverRating((i + 1) * 20)}
          onMouseLeave={() => setHoverRating(null)}
          title={`Rate ${(i+1)*20}/100`}
        >
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <span 
              className="star-outline" 
              style={{ 
                color: '#ccc',
                position: 'absolute',
                fontSize: '22px'
              }}
            >
              ★
            </span>
            
            <span 
              className="star-fill" 
              style={{ 
                color: 'gold',
                position: 'absolute',
                fontSize: '22px',
                width: `${fillPercentage}%`,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                direction: 'ltr',
                textAlign: 'center',
                clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                transition: 'all 0.15s ease-in-out'
              }}
            >
              ★
            </span>
          </div>
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
    
    // Calculate position as percentage of total width (0-100)
    const percentage = Math.max(0, Math.min(100, Math.round((position / width) * 100)));
    
    // Round to nearest 5 to make ratings more predictable
    const roundedPercentage = Math.round(percentage / 5) * 5;
    
      
    setHoverRating(roundedPercentage);
  };
  
  const handleStarAreaMouseLeave = () => {
    setHoverRating(null);
  };
  
  // Flag to track if we're handling a slider event
  const [isSliderInteraction, setIsSliderInteraction] = useState(false);
  
  // Create a new approach for star area clicks that's precise and predictable
  const handleStarAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Skip if this is coming from slider interaction
    if (isSliderInteraction) {
      setIsSliderInteraction(false);
      return;
    }
    
    // Get the dimensions of the star area
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const position = e.clientX - rect.left;
    
    // Calculate position as percentage of total width (0-100)
    const percentage = Math.max(0, Math.min(100, Math.round((position / width) * 100)));
    
    // Round to nearest 5 to make ratings more predictable
    const roundedPercentage = Math.round(percentage / 5) * 5;
    
    // Update the UI state
    setRatingValue(roundedPercentage);
    
    // Send the EXACT SAME VALUE that we display
    // This ensures the UI and server values are always in sync
    if (onRate && roundedPercentage !== movie.Rating) {
      // Save the exact same value we're displaying
      onRate(movie.MovieID, roundedPercentage);
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
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
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