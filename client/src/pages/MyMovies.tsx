import { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import CollectionNavigation from '../components/CollectionNavigation';
import MovieListItem from '../components/MovieListItem';
import { ToastContainer, useToast } from '../components/Toast';
import { removeFromUserList, rateMovie } from '../api/movies';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  Rating?: number;
  ReleaseDate?: string;
  media_type?: string;
  DateAdded?: string;
  id?: number;
}

const MyMovies = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'dateAdded' | 'rating' | 'title' | 'releaseDate'>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Toast notification system
  const { toasts, addToast, removeToast } = useToast();

  const collection = useCollection('/api/movies/user/list', sortField, sortDirection, searchQuery);
  const userMovies: Movie[] = collection.movies;
  const filteredMovies = userMovies;
  const paginatedMovies = userMovies;
  const handleRemoveMovie = async (movieId: number) => {
    try {
      await removeFromUserList(movieId);
      collection.reload();
      
      // Show toast notification
      addToast('Item removed from your collection', 'success');
    } catch (err) {
      addToast('Failed to remove item. Please try again.', 'error');
    }
  };

  const handleRateMovie = async (movieId: number, rating: number) => {
    try {
      // Call the API with the exact rating value passed by the component
      await rateMovie(movieId, rating);
      
      collection.reload();
      // Show toast notification
      addToast('Rating updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update rating. Please try again.', 'error');
    }
  };

  // Handle sort field change
  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value as 'dateAdded' | 'rating' | 'title' | 'releaseDate');
    // Reset to first page when sort changes

  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    // Reset to first page when sort changes

  };

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
              {`${userMovies.length} movies on this page${searchQuery ? ` matching “${searchQuery}”` : ''}`}
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
                

              </>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <p>No movies found matching "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p>{searchQuery ? 'No movies match your search.' : 'No movies on this page.'}</p>
          </div>
        )}
        <CollectionNavigation {...collection} />
      </div>
    </div>
  );
};

export default MyMovies;