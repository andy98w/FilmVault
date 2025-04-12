import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getRatingColorClass } from '../components/MovieCard';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  BackdropPath: string;
  Overview: string;
  ReleaseDate: string;
  Runtime: number;
  Genres: Genre[];
  VoteAverage: number;
  VoteCount: number;
  Cast: CastMember[];
  Similar: any[];
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [isInList, setIsInList] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/movies/details/${id}`);
        setMovie(response.data);
        
        // If user is authenticated, check if movie is in their list
        if (isAuthenticated) {
          try {
            const userMoviesResponse = await axios.get(`${API_URL}/api/movies/user/list`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Check if this movie is in user's list
            const inList = userMoviesResponse.data.some(
              (userMovie: any) => userMovie.MovieID === Number(id)
            );
            setIsInList(inList);
          } catch (err) {
            console.error('Error checking if movie is in user list:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieDetails();
  }, [id, isAuthenticated]);
  
  const addToList = async () => {
    if (!isAuthenticated || !movie) return;
    
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
      setIsInList(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error adding movie');
    } finally {
      setIsAdding(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };
  
  const removeFromList = async () => {
    if (!isAuthenticated || !movie) return;
    
    try {
      await axios.delete(`${API_URL}/api/movies/remove/${movie.MovieID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage('Movie removed from your list');
      setIsInList(false);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error removing movie');
    } finally {
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };
  
  const formatReleaseDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.getFullYear();
  };
  
  const formatRuntime = (minutes: number) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  if (loading) {
    return (
      <div className="container">
        <div style={{ marginTop: '120px' }}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading movie details...</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !movie) {
    return (
      <div className="container">
        <div style={{ marginTop: '120px', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error || 'Failed to load movie details'}</p>
          <Link to="/">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  const backdropUrl = movie.BackdropPath 
    ? `https://image.tmdb.org/t/p/original${movie.BackdropPath}` 
    : null;
    
  const posterUrl = movie.PosterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.PosterPath}` 
    : '/default.jpg';
  
  return (
    <div className="movie-details-page">
      {backdropUrl && (
        <div 
          className="movie-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        ></div>
      )}
      
      <div className="container">
        <div className="movie-details-content">
          <div className="movie-details-header">
            <div className="movie-poster-container">
              {movie.PosterPath ? (
                <img 
                  src={posterUrl} 
                  alt={movie.Title} 
                  className="movie-details-poster" 
                />
              ) : (
                <div className="movie-details-no-poster">
                  <span style={{ fontSize: '32px', marginBottom: '15px' }}>🎬</span>
                  <p>No poster available</p>
                </div>
              )}
            </div>
            
            <div className="movie-info">
              <h1>{movie.Title} <span className="release-year">({formatReleaseDate(movie.ReleaseDate)})</span></h1>
              
              <div className="movie-meta">
                {movie.Genres && (
                  <div className="genres">
                    {movie.Genres.map(genre => (
                      <span key={genre.id} className="genre-tag">{genre.name}</span>
                    ))}
                  </div>
                )}
                
                <div className="runtime">
                  <span className="meta-item">⏱️ {formatRuntime(movie.Runtime)}</span>
                </div>
                
                <div className="rating" style={{ whiteSpace: 'nowrap' }}>
                  <span className="meta-item">⭐ {movie.VoteAverage?.toFixed(1)}/10 <span className="vote-count">({movie.VoteCount} votes)</span></span>
                </div>
              </div>
              
              <div className="overview">
                <h3>Overview</h3>
                <p>{movie.Overview || 'No overview available.'}</p>
              </div>
              
              <div className="movie-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '10px' }}>
                {isAuthenticated ? (
                  <>
                    {isInList ? (
                      <button 
                        onClick={removeFromList} 
                        className="action-button remove-button"
                        title="Remove from My Movies"
                      >
                        Remove
                      </button>
                    ) : (
                      <button 
                        onClick={addToList} 
                        className="action-button add-button"
                        disabled={isAdding}
                        title="Add to My Movies"
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    )}
                    
                    {message && (
                      <div className="action-message">{message}</div>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="action-button add-button"
                    title="Login to Add to My Movies"
                  >
                    Login to Add
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {movie.Cast && movie.Cast.length > 0 && (
            <div className="cast-section">
              <h2>Cast</h2>
              <div className="horizontal-slider">
                {movie.Cast.map(person => (
                  <Link 
                    key={person.id} 
                    className="cast-member" 
                    to={`/person/${person.id}`}
                  >
                    {person.profile_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                        alt={person.name}
                        className="cast-photo" 
                      />
                    ) : (
                      <div className="no-cast-photo">
                        <span>👤</span>
                      </div>
                    )}
                    <div className="cast-info">
                      <div className="tooltip-container">
                        <div className="cast-name">{person.name}</div>
                        <span className="tooltip-text">{person.name}</span>
                      </div>
                      <div className="tooltip-container">
                        <div className="cast-character">{person.character}</div>
                        <span className="tooltip-text">{person.character}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {movie.Similar && movie.Similar.length > 0 && (
            <div className="similar-movies">
              <h2>Similar</h2>
              <div className="horizontal-slider">
                {movie.Similar.slice(0, 10).map(similarMovie => (
                  <Link 
                    to={`/movie/${similarMovie.MovieID}`} 
                    key={similarMovie.MovieID}
                    className="similar-movie-card"
                  >
                    <div className="poster-wrapper">
                      {similarMovie.PosterPath ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${similarMovie.PosterPath}`} 
                          alt={similarMovie.Title} 
                          className="movie-poster"
                        />
                      ) : (
                        <div className="no-poster">
                          <div>
                            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎬</span>
                            No image<br />available
                          </div>
                        </div>
                      )}
                      
                      {/* Media type badge */}
                      {similarMovie.media_type && (
                        <div 
                          className="media-type-badge top-right"
                          title={similarMovie.media_type === 'tv' ? 'TV Show' : 'Movie'}
                        >
                          {similarMovie.media_type === 'tv' ? 'TV' : 'MOVIE'}
                        </div>
                      )}
                      
                      {similarMovie.VoteAverage !== undefined && similarMovie.VoteAverage > 0 && (
                        <div 
                          className={`rating-circle ${getRatingColorClass(similarMovie.VoteAverage)}`}
                          title={`${similarMovie.VoteAverage.toFixed(1)}/10`}
                        >
                          {similarMovie.VoteAverage.toFixed(1)}
                        </div>
                      )}
                    </div>
                    
                    <div className="card-info">
                      <div className="tooltip-container">
                        <h3 className="movie-title">{similarMovie.Title}</h3>
                        <span className="tooltip-text">{similarMovie.Title}</span>
                      </div>
                      {similarMovie.ReleaseDate && (
                        <div className="release-date">
                          {new Date(similarMovie.ReleaseDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;