import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';

// API base URL
const API_URL = 'http://localhost:5001';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
}

interface SearchResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

const MovieSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    
    if (query) {
      setSearchQuery(query);
      setCurrentPage(parseInt(page, 10));
      searchMovies(query, parseInt(page, 10));
    }
  }, [location.search]);

  const searchMovies = async (query: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await axios.get<SearchResponse>(
        `${API_URL}/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`
      );
      setSearchResults(response.data.results);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.total_pages);
      setTotalResults(response.data.total_results);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=1`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=${newPage}`);
      window.scrollTo(0, 0);
    }
  };


  return (
    <div className="container">
      <div className="search-container" style={{ marginTop: '120px' }}>
        <h2>Search Movies</h2>
        <div className="search-box">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="🔍 Search Movie"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </div>

      {error && (
        <div className="message error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h3>Searching...</h3>
        </div>
      ) : (
        <>
          {searchResults.length > 0 ? (
            <>
              <h2>Search Results</h2>
              {totalResults > 0 && (
                <p>Found {totalResults} results for "{searchQuery}"</p>
              )}
              <div className="movie-grid">
                {searchResults.map(movie => (
                  <MovieCard key={movie.MovieID} movie={movie} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            searchQuery && !loading && (
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h3>No movies found matching "{searchQuery}"</h3>
                <p>Try a different search term or browse our top movies.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default MovieSearch;