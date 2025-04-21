import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../api/users';

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
  ReleaseDate?: string;
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userMovies, setUserMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reset scroll position when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'rating' | 'title'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Check if the user is viewing their own profile
  useEffect(() => {
    if (currentUser && id && parseInt(id) === currentUser.id) {
      navigate('/profile');
      return;
    }
  }, [id, currentUser, navigate]);
  
  // Sort function for movies
  const sortMovies = (movies: Movie[]) => {
    const sortedMovies = [...movies];
    const isAscending = sortDirection === 'asc';
    const directionMultiplier = isAscending ? 1 : -1;
    
    switch (sortField) {
      case 'rating':
        return sortedMovies.sort((a, b) => {
          const ratingA = a.Rating || 0;
          const ratingB = b.Rating || 0;
          return (ratingA - ratingB) * directionMultiplier;
        });
        
      case 'title':
        return sortedMovies.sort((a, b) => {
          const result = a.Title.localeCompare(b.Title);
          return result * directionMultiplier;
        });
        
      default:
        return sortedMovies;
    }
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value as 'rating' | 'title');
  };
  
  const filteredMovies = useMemo(() => {
    const filtered = searchQuery 
      ? userMovies.filter(movie => movie.Title.toLowerCase().includes(searchQuery.toLowerCase()))
      : userMovies;
    
    return sortMovies(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMovies, searchQuery, sortField, sortDirection]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        if (currentUser && parseInt(id) === currentUser.id) {
          return;
        }
        
        const response = await getUserProfile(id);
        
        if (!response.data.user) {
          throw new Error('User data not found in response');
        }
        
        setUser(response.data.user);
        
        if (response.data.movies && Array.isArray(response.data.movies)) {
          // Transform movies from snake_case to PascalCase to match the interface
          const transformedMovies = response.data.movies.map((movie: any) => ({
            MovieID: movie.tmdb_id, // Use TMDB ID for navigation instead of database ID
            Title: movie.title,
            PosterPath: movie.poster_path,
            Overview: movie.overview,
            Rating: movie.rating !== null ? parseInt(movie.rating) : null, // Ratings are already on 0-100 scale
            ReleaseDate: movie.release_date
          }));
          setUserMovies(transformedMovies);
        } else {
          setUserMovies([]);
        }
      } catch (err: any) {
        if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Failed to load user profile'}`);
        } else if (err.request) {
          setError('No response received from server. Please check your connection.');
        } else {
          setError(`Failed to load user profile: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
      window.scrollTo(0, 0);
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
        <div style={{ 
          marginTop: '150px', 
          textAlign: 'center',
          padding: '30px',
          backgroundColor: 'var(--nav-background)',
          borderRadius: '10px',
          maxWidth: '600px',
          margin: '150px auto 0'
        }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>Problem Loading Profile</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>{error || 'User profile could not be loaded. The user may not exist or there might be a server connection issue.'}</p>
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ backgroundColor: 'var(--primary-color)', color: 'black' }}
            >
              Try Again
            </button>
            <button onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-header">
        <img 
          src={user.ProfilePic ? user.ProfilePic : '/default.jpg'} 
          alt={user.Usernames || 'Profile'} 
          className="profile-pic-large" 
          onError={(e) => {
            // Fallback to default if the image fails to load
            (e.target as HTMLImageElement).src = '/default.jpg';
          }}
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

      <div>
        <h3 style={{ 
          marginBottom: '20px', 
          borderBottom: '3px solid var(--primary-color)', 
          paddingBottom: '10px', 
          display: 'inline-block' 
        }}>
          {user.Usernames}'s Movies <span style={{ color: 'var(--primary-color)', fontSize: '0.8em' }}>({userMovies.length})</span>
        </h3>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          marginTop: '30px', 
          marginBottom: '30px',
          gap: '20px'
        }}>
          {/* Search filter */}
          <div style={{ 
            position: 'relative', 
            flexGrow: 1, 
            maxWidth: '500px',
            minWidth: '250px'
          }}>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder={`Search ${user.Usernames}'s movies...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '20px',
                  border: '1px solid var(--primary-color)',
                  backgroundColor: 'var(--nav-background)',
                  color: 'var(--text-color)',
                  fontSize: '16px',
                  height: '45px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ 
                position: 'absolute', 
                left: '15px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--primary-color)',
                fontSize: '18px'
              }}>
                🔍
              </span>
            </form>
          </div>
          
          {/* Sort controls */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '15px'
          }}>
            {/* Sort field label and controls */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <label htmlFor="sort-field" style={{ 
                color: 'var(--text-color)', 
                fontSize: '16px',
                marginBottom: '10px'
              }}>
                Sort by:
              </label>
              
              {/* Dropdown */}
              <select
                id="sort-field"
                value={sortField}
                onChange={handleSortFieldChange}
                style={{
                  padding: '10px 20px 10px 15px',
                  borderRadius: '10px',
                  border: '1px solid var(--primary-color)',
                  backgroundColor: 'var(--nav-background)',
                  color: 'var(--text-color)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  height: '45px',
                  boxSizing: 'border-box',
                  minWidth: '120px'
                }}
              >
                <option value="rating">Rating</option>
                <option value="title">Title</option>
              </select>
              
              {/* Sort direction toggle button */}
              <button
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                style={{
                  backgroundColor: 'var(--nav-background)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-color)',
                  fontSize: '16px',
                  width: '45px',
                  height: '45px',
                  boxSizing: 'border-box'
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  style={{ transform: sortDirection === 'desc' ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }}
                >
                  <path 
                    d="M8 3L14 10H2L8 3Z" 
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Movie count display */}
        {userMovies.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-color)', opacity: '0.8' }}>
              {filteredMovies.length > 0 
                ? searchQuery 
                  ? `Found ${filteredMovies.length} movies matching "${searchQuery}"`
                  : `Showing ${filteredMovies.length} of ${userMovies.length} movies`
                : `No movies found matching "${searchQuery}"`
              }
            </p>
          </div>
        )}

        {userMovies.length > 0 ? (
          filteredMovies.length > 0 ? (
            <div className="horizontal-slider" style={{
              marginTop: '20px',
              paddingBottom: '20px'
            }}>
              {filteredMovies.map(movie => (
                <div 
                  key={movie.MovieID} 
                  style={{ 
                    width: '170px',
                    marginRight: '30px',
                    transition: 'transform 0.2s ease',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    backgroundColor: '#2a2a2a',
                    padding: '0 0 10px 0', 
                    height: '330px',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/movie/${movie.MovieID}`)}
                >
                  <div style={{ position: 'relative', width: '170px', height: '255px' }}>
                    {movie.PosterPath ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.PosterPath}`}
                        alt={movie.Title} 
                        style={{
                          width: '170px',
                          height: '255px',
                          borderRadius: '10px 10px 0 0',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '170px',
                        height: '255px',
                        backgroundColor: '#3F3F3F',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: '14px',
                        borderRadius: '10px 10px 0 0',
                        opacity: '0.8'
                      }}>
                        <div>
                          <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎬</span>
                          No image<br />available
                        </div>
                      </div>
                    )}
                    
                    {/* Rating badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      {movie.Rating ? `${movie.Rating}/100` : 'Not yet rated'}
                    </div>
                  </div>
                  
                  {/* Movie title */}
                  <div style={{ padding: '10px 8px 0 8px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#FFFFFF',
                      textAlign: 'center',
                      margin: '0',
                      maxHeight: '44px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {movie.Title}
                    </h3>
                    
                    {/* Rating stars under title */}
                    <div style={{ 
                      marginTop: '6px', 
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {movie.Rating ? (
                        <div style={{ color: 'gold', fontSize: '14px' }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ marginRight: '2px' }}>
                              {i < Math.round((movie.Rating || 0) / 20) ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                          Not yet rated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <p>No movies found matching "{searchQuery}". Try a different search term.</p>
            </div>
          )
        ) : (
        <div style={{ 
          padding: '30px', 
          textAlign: 'center', 
          background: 'var(--nav-background)', 
          borderRadius: '10px',
          margin: '30px 0',
          opacity: 0.8
        }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '15px' }}>🎬</span>
          <p>{user.Usernames} hasn't added any movies to their collection yet.</p>
        </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;