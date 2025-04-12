import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import PersonCard from '../components/PersonCard';
import Pagination from '../components/Pagination';

import { API_URL } from '../config/config';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  media_type?: string;
}

interface Person {
  id: number;
  name: string;
  profile_path: string;
  known_for_department: string;
  popularity: number;
  gender: string;
  known_for: {
    id: number;
    title: string;
    media_type: string;
  }[];
}

interface SearchResponse {
  results: any[];
  page: number;
  total_pages: number;
  total_results: number;
}

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'person' | 'multi'>('multi');
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [personResults, setPersonResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const type = searchParams.get('type') as 'person' | 'multi' || 'multi';
    
    if (query) {
      setSearchQuery(query);
      setSearchType(type);
      setCurrentPage(parseInt(page, 10));
      performSearch(query, parseInt(page, 10), type);
    }
  }, [location.search]);
  
  // Handle window resize to update layout dynamically
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const performSearch = async (query: string, page: number = 1, type: 'person' | 'multi' = 'multi') => {
    setLoading(true);
    try {
      const response = await axios.get<SearchResponse>(
        `${API_URL}/api/movies/search?query=${encodeURIComponent(query)}&page=${page}&type=${type}`
      );
      
      if (type === 'multi') {
        // For multi search, filter results by media type
        // Movies and TV shows go to movieResults
        setMovieResults(response.data.results.filter((item: any) => 
          item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) as Movie[]);
          
        // People go to personResults
        setPersonResults(response.data.results.filter((item: any) => 
          item.media_type === 'person') as Person[]);
      } else if (type === 'person') {
        // For person search, all results are people
        setPersonResults(response.data.results as Person[]);
        setMovieResults([]);
      } else {
        setPersonResults([]);
      }
      
      setCurrentPage(response.data.page);
      setTotalPages(response.data.total_pages);
      setTotalResults(response.data.total_results);
    } catch (err) {
      console.error(`Error searching ${type === 'person' ? 'people' : 'movies and TV shows'}:`, err);
      setError(`Failed to search ${type === 'person' ? 'people' : 'movies and TV shows'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=1&type=${searchType}`);
    }
  };
  
  const handleTypeChange = (type: 'person' | 'multi') => {
    setSearchType(type);
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=1&type=${type}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=${newPage}&type=${searchType}`);
      window.scrollTo(0, 0);
    }
  };
  
  // Calculate optimal columns based on window width
  const getGridStyle = () => {
    // This will inherit most styles from CSS variables
    return {
      gridColumnGap: '30px' // Only override this one specific value
    };
  };


  return (
    <div className="container">
      <div className="search-container" style={{ marginTop: '120px' }}>
        <div className="search-box">
          <form onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              value={searchType} 
              onChange={(e) => handleTypeChange(e.target.value as 'person' | 'multi')}
              className="search-type-dropdown"
            >
              <option value="multi">Movies & TV</option>
              <option value="person">People</option>
            </select>
          </form>
        </div>
      </div>

      {error && (
        <div className="message error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: '50px' }}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Searching for "{searchQuery}"...</div>
          </div>
        </div>
      ) : (
        <>
          {searchType === 'multi' && movieResults.length > 0 ? (
            <>
              {totalResults > 0 && (
                <p style={{ fontSize: '18px', marginTop: '40px', marginBottom: '20px' }}>Found {totalResults} results for "{searchQuery}"</p>
              )}
              <div className="movie-grid" style={getGridStyle()}>
                {/* Only show first 18 items (3 rows of 6) */}
                {movieResults.slice(0, 18).map(movie => (
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
          ) : searchType === 'person' && personResults.length > 0 ? (
            <>
              {totalResults > 0 && (
                <p style={{ fontSize: '18px', marginTop: '40px', marginBottom: '20px' }}>Found {totalResults} people results for "{searchQuery}"</p>
              )}
              <div className="movie-grid" style={getGridStyle()}>
                {/* Only show first 18 items (3 rows of 6) */}
                {personResults.slice(0, 18).map(person => (
                  <PersonCard key={person.id} person={person} />
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
                <h3>No {searchType === 'person' ? 'people' : 'results'} found matching "{searchQuery}"</h3>
                <p>Try a different search term or browse our top {searchType === 'person' ? 'actors/actresses' : 'movies and TV shows'}.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;