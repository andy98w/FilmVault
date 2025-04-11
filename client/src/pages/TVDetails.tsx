import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getRatingColorClass } from '../components/MovieCard';

// API base URL
const API_URL = 'http://localhost:5001';

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

interface TVShow {
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
  media_type: string;
}

const TVDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [isInList, setIsInList] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTVDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/movies/details/${id}?type=tv`);
        setShow(response.data);
        
        // If user is authenticated, check if show is in their list
        if (isAuthenticated) {
          try {
            const userMoviesResponse = await axios.get(`${API_URL}/api/movies/user/list`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Check if this show is in user's list
            const inList = userMoviesResponse.data.some(
              (userMovie: any) => userMovie.MovieID === Number(id)
            );
            setIsInList(inList);
          } catch (err) {
            console.error('Error checking if show is in user list:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching TV show details:', err);
        setError('Failed to load TV show details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTVDetails();
  }, [id, isAuthenticated]);
  
  const addToList = async () => {
    if (!isAuthenticated || !show) return;
    
    setIsAdding(true);
    try {
      await axios.post(`${API_URL}/api/movies/add`, {
        movie_id: show.MovieID,
        movie_title: show.Title,
        poster_path: show.PosterPath,
        overview: show.Overview
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage('TV show added to your list!');
      setIsInList(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error adding TV show');
    } finally {
      setIsAdding(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };
  
  const removeFromList = async () => {
    if (!isAuthenticated || !show) return;
    
    try {
      await axios.delete(`${API_URL}/api/movies/remove/${show.MovieID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage('TV show removed from your list');
      setIsInList(false);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error removing TV show');
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
            <div className="loading-text">Loading TV show details...</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !show) {
    return (
      <div className="container">
        <div style={{ marginTop: '120px', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error || 'Failed to load TV show details'}</p>
          <Link to="/">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  const backdropUrl = show.BackdropPath 
    ? `https://image.tmdb.org/t/p/original${show.BackdropPath}` 
    : null;
    
  const posterUrl = show.PosterPath 
    ? `https://image.tmdb.org/t/p/w500${show.PosterPath}` 
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
              {show.PosterPath ? (
                <img 
                  src={posterUrl} 
                  alt={show.Title} 
                  className="movie-details-poster" 
                />
              ) : (
                <div className="movie-details-no-poster">
                  <span style={{ fontSize: '32px', marginBottom: '15px' }}>📺</span>
                  <p>No poster available</p>
                </div>
              )}
            </div>
            
            <div className="movie-info">
              <h1>
                {show.Title} <span className="release-year">({formatReleaseDate(show.ReleaseDate)})</span>
                <span className="media-type-badge" style={{ marginLeft: '10px', fontSize: '0.6em' }}>TV</span>
              </h1>
              
              <div className="movie-meta">
                {show.Genres && (
                  <div className="genres">
                    {show.Genres.map(genre => (
                      <span key={genre.id} className="genre-tag">{genre.name}</span>
                    ))}
                  </div>
                )}
                
                <div className="runtime">
                  <span className="meta-item">⏱️ {formatRuntime(show.Runtime)}</span>
                </div>
                
                <div className="rating" style={{ whiteSpace: 'nowrap' }}>
                  <span className="meta-item">⭐ {show.VoteAverage?.toFixed(1)}/10 <span className="vote-count">({show.VoteCount} votes)</span></span>
                </div>
              </div>
              
              <div className="overview">
                <h3>Overview</h3>
                <p>{show.Overview || 'No overview available.'}</p>
              </div>
              
              <div className="movie-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '10px' }}>
                {isAuthenticated ? (
                  <>
                    {isInList ? (
                      <button 
                        onClick={removeFromList} 
                        className="action-button remove-button"
                        title="Remove from My List"
                      >
                        Remove
                      </button>
                    ) : (
                      <button 
                        onClick={addToList} 
                        className="action-button add-button"
                        disabled={isAdding}
                        title="Add to My List"
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
                    title="Login to Add to My List"
                  >
                    Login to Add
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {show.Cast && show.Cast.length > 0 && (
            <div className="cast-section">
              <h2>Cast</h2>
              <div className="horizontal-slider">
                {show.Cast.map(person => (
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
          
          {show.Similar && show.Similar.length > 0 && (
            <div className="similar-movies">
              <h2>Similar TV Shows</h2>
              <div className="horizontal-slider">
                {show.Similar.slice(0, 10).map(similarShow => (
                  <Link 
                    to={`/tv/${similarShow.MovieID}`} 
                    key={similarShow.MovieID}
                    className="similar-movie-card"
                  >
                    <div className="poster-wrapper">
                      {similarShow.PosterPath ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${similarShow.PosterPath}`} 
                          alt={similarShow.Title} 
                          className="movie-poster"
                        />
                      ) : (
                        <div className="no-poster">
                          <div>
                            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📺</span>
                            No image<br />available
                          </div>
                        </div>
                      )}
                      
                      {/* Media type badge */}
                      {similarShow.media_type && (
                        <div 
                          className="media-type-badge top-right"
                          title={similarShow.media_type === 'tv' ? 'TV Show' : 'Movie'}
                        >
                          {similarShow.media_type === 'tv' ? 'TV' : 'MOVIE'}
                        </div>
                      )}
                      
                      {similarShow.VoteAverage !== undefined && similarShow.VoteAverage > 0 && (
                        <div 
                          className={`rating-circle ${getRatingColorClass(similarShow.VoteAverage)}`}
                          title={`${similarShow.VoteAverage.toFixed(1)}/10`}
                        >
                          {similarShow.VoteAverage.toFixed(1)}
                        </div>
                      )}
                    </div>
                    
                    <div className="card-info">
                      <div className="tooltip-container">
                        <h3 className="movie-title">{similarShow.Title}</h3>
                        <span className="tooltip-text">{similarShow.Title}</span>
                      </div>
                      {similarShow.media_type && (
                        <div className="media-type-badge">
                          {similarShow.media_type === 'tv' ? 'TV' : 'Movie'}
                        </div>
                      )}
                      {similarShow.ReleaseDate && (
                        <div className="release-date">
                          {new Date(similarShow.ReleaseDate).toLocaleDateString('en-US', {
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

export default TVDetails;