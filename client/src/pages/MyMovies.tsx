import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MovieListItem from '../components/MovieListItem';
import Pagination from '../components/Pagination';
import { ToastContainer, useToast } from '../components/Toast';

import { API_URL } from '../config/config';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  Rating?: number;
  ReleaseDate?: string;
  media_type?: string;
  // Using a string ISO date format for sorting
  DateAdded?: string;
  // Ensure we have a unique ID to prevent duplicates
  id?: number;
}

const MyMovies = () => {
  const { user } = useAuth();
  const [userMovies, setUserMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(15); // Increased for list view
  const [sortField, setSortField] = useState<'dateAdded' | 'rating' | 'title' | 'releaseDate'>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Toast notification system
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchUserMovies();
  }, []);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchUserMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/movies/user/list`, {
        withCredentials: true
      });
      
      // Create a Map to filter out duplicates by MovieID
      const moviesMap = new Map();
      response.data.forEach((movie: Movie) => {
        // If this MovieID is not in the map yet, or if this instance has a rating and the existing one doesn't
        if (!moviesMap.has(movie.MovieID) || 
            (movie.Rating && !moviesMap.get(movie.MovieID).Rating)) {
          moviesMap.set(movie.MovieID, movie);
        }
      });
      
      // Convert map back to array
      const uniqueMovies = Array.from(moviesMap.values());
      setUserMovies(uniqueMovies);
    } catch (err) {
      console.error('Error fetching user movies:', err);
      addToast('Failed to load your collection. Please try again later.', 'error');
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
      
      // Show toast notification
      addToast('Item removed from your collection', 'success');
    } catch (err) {
      console.error('Error removing movie:', err);
      addToast('Failed to remove item. Please try again.', 'error');
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
      
      // Show toast notification
      addToast('Rating updated successfully', 'success');
    } catch (err) {
      console.error('Error rating movie:', err);
      addToast('Failed to update rating. Please try again.', 'error');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the movie list container instead of the window
    const container = document.querySelector('.movie-list-container');
    if (container) {
      container.scrollTop = 0;
    }
  };

  // Handle sort field change
  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value as 'dateAdded' | 'rating' | 'title' | 'releaseDate');
    // Reset to first page when sort changes
    setCurrentPage(1);
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    // Reset to first page when sort changes
    setCurrentPage(1);
  };

  // Sort function
  const sortMovies = (movies: Movie[]) => {
    const sortedMovies = [...movies];
    const isAscending = sortDirection === 'asc';
    
    // Helper function to flip sort direction if descending
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
        
      case 'releaseDate':
        return sortedMovies.sort((a, b) => {
          // Handle missing release dates - items without dates go to the end
          if (!a.ReleaseDate && !b.ReleaseDate) return 0;
          if (!a.ReleaseDate) return directionMultiplier;  // Push items without dates to end
          if (!b.ReleaseDate) return -directionMultiplier; // Push items without dates to end
          
          // Compare dates - we know both exist at this point
          const dateA = new Date(a.ReleaseDate).getTime();
          const dateB = new Date(b.ReleaseDate).getTime();
          return (dateA - dateB) * directionMultiplier;
        });
        
      case 'dateAdded':
      default:
        // Sort by most recently added (using MovieID as a proxy if DateAdded is not available)
        return sortedMovies.sort((a, b) => {
          // The ID is often a good proxy for when items were added
          // Higher IDs usually mean more recently added items
          return ((b.MovieID || 0) - (a.MovieID || 0)) * directionMultiplier;
        });
    }
  };

  // Filtered and paginated movies
  const filteredMovies = useMemo(() => {
    // First filter
    const filtered = searchQuery 
      ? userMovies.filter(movie => movie.Title.toLowerCase().includes(searchQuery.toLowerCase()))
      : userMovies;
    
    // Then sort
    return sortMovies(filtered);
  }, [userMovies, searchQuery, sortField, sortDirection]);

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * moviesPerPage;
    return filteredMovies.slice(startIndex, startIndex + moviesPerPage);
  }, [filteredMovies, currentPage, moviesPerPage]);

  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

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
      {/* Toast container for notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div style={{ marginTop: '120px' }}>
        <h1 style={{ marginBottom: '40px', fontSize: '32px' }}>My Collection</h1>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'flex-end', /* Align items at the bottom */
          marginTop: '40px', 
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
                placeholder="Search my collection..."
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
                  padding: '10px 20px 10px 15px', /* Extra right padding to replace the arrow space */
                  borderRadius: '10px',
                  border: '1px solid var(--primary-color)',
                  backgroundColor: 'var(--nav-background)',
                  color: 'var(--text-color)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  height: '45px',
                  boxSizing: 'border-box',
                  minWidth: '160px' /* Ensure enough width for the longest option */
                }}
              >
                <option value="dateAdded">Date Added</option>
                <option value="rating">Rating</option>
                <option value="title">Title</option>
                <option value="releaseDate">Release Date</option>
              </select>
              
              {/* Sort direction toggle button */}
              <button
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                className="sort-direction-toggle"
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
                  style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
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
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-color)', opacity: '0.8' }}>
              {filteredMovies.length > 0 
                ? searchQuery 
                  ? `Found ${filteredMovies.length} movies matching "${searchQuery}"`
                  : `Showing ${paginatedMovies.length} of ${userMovies.length} movies`
                : `No movies found matching "${searchQuery}"`
              }
            </p>
          </div>
        )}

        {userMovies.length > 0 ? (
          <>
            {filteredMovies.length > 0 ? (
              <>
                <div className="movie-list-container">
                  {paginatedMovies.map(movie => (
                    <MovieListItem 
                      key={movie.MovieID} 
                      movie={movie}
                      onRemove={handleRemoveMovie}
                      onRate={handleRateMovie}
                    />
                  ))}
                </div>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div style={{ marginTop: '30px' }}>
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <p>No movies found matching "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </>
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