import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import UserTable from '../components/UserTable';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  ReleaseDate?: string;
  VoteAverage?: number;
  average_rating?: number;
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

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
  movie_count: number;
  rating_count: number;
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'multi' | 'person'>('multi');
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [topTVShows, setTopTVShows] = useState<Movie[]>([]);
  const [userTopMovies, setUserTopMovies] = useState<Movie[]>([]);
  const [popularPeople, setPopularPeople] = useState<Person[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for message in URL params
    const searchParams = new URLSearchParams(location.search);
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(urlMessage);
      // Remove the message from URL
      navigate('/', { replace: true });
    }
    
    // We should NEVER test TMDB API in the frontend directly
    // All API requests should go through the backend for security
    const testTMDBAPI = async () => {
      try {
        console.log('Testing backend API connection...');
        const response = await axios.get(`${API_URL}/api/movies/test-connection`);
        console.log('Backend API connection successful:', response.status);
      } catch (err) {
        console.error('Backend API connection failed:', err);
      }
    };
    
    testTMDBAPI();

    const fetchData = async () => {
      setLoading(true);
      try {
        // Try each request individually with debugging to isolate the issue
        console.log('Starting API requests...');
        
        let topMoviesRes;
        try {
          console.log('Fetching top movies...');
          topMoviesRes = await axios.get(`${API_URL}/api/movies/top`);
          console.log('Top movies fetched successfully');
        } catch (err) {
          console.error('Failed to fetch top movies:', err);
          topMoviesRes = { data: { results: [] } };
        }
        
        let topTVShowsRes;
        try {
          console.log('Fetching top TV shows...');
          topTVShowsRes = await axios.get(`${API_URL}/api/movies/top-tv`);
          console.log('Top TV shows fetched successfully');
        } catch (err) {
          console.error('Failed to fetch top TV shows:', err);
          topTVShowsRes = { data: { results: [] } };
        }
        
        let userTopMoviesRes;
        try {
          console.log('Fetching top rated movies...');
          userTopMoviesRes = await axios.get(`${API_URL}/api/movies/top-rated`);
          console.log('Top rated movies fetched successfully');
        } catch (err) {
          console.error('Failed to fetch top rated movies:', err);
          userTopMoviesRes = { data: { results: [] } };
        }
        
        let popularPeopleRes;
        try {
          console.log('Fetching popular people...');
          popularPeopleRes = await axios.get(`${API_URL}/api/movies/popular-people`);
          console.log('Popular people fetched successfully');
        } catch (err) {
          console.error('Failed to fetch popular people:', err);
          popularPeopleRes = { data: { results: [] } };
        }
        
        let topUsersRes;
        try {
          console.log('Fetching top users...');
          topUsersRes = await axios.get(`${API_URL}/api/users/top`);
          console.log('Top users fetched successfully');
        } catch (err) {
          console.error('Failed to fetch top users:', err);
          topUsersRes = { data: [] };
        }

        console.log("Popular Movies Response:", topMoviesRes.data);
        console.log("Popular TV Shows Response:", topTVShowsRes.data);
        console.log("Top Rated Movies Response:", userTopMoviesRes.data);
        console.log("Popular People Response:", popularPeopleRes.data);
        
        // Enhanced error logging to diagnose issues
        if (!topMoviesRes.data || (!topMoviesRes.data.results && !Array.isArray(topMoviesRes.data))) {
          console.error("Invalid popular movies response format:", topMoviesRes.data);
        }
        if (!topTVShowsRes.data || (!topTVShowsRes.data.results && !Array.isArray(topTVShowsRes.data))) {
          console.error("Invalid TV shows response format:", topTVShowsRes.data);
        }
        
        // Handle the new paginated response format
        setTopMovies(topMoviesRes.data?.results || topMoviesRes.data || []);
        setTopTVShows(topTVShowsRes.data?.results || topTVShowsRes.data || []);
        setUserTopMovies(userTopMoviesRes.data?.results || userTopMoviesRes.data || []);
        setPopularPeople(popularPeopleRes.data?.results || popularPeopleRes.data || []);
        setTopUsers(topUsersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }
  };
  
  const handleTypeChange = (type: 'multi' | 'person') => {
    setSearchType(type);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '150px' }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading exciting content for you...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className="message success">
          <p>{message}</p>
        </div>
      )}

      <div className="search-container">
        <div className="container">
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
                onChange={(e) => handleTypeChange(e.target.value as 'multi' | 'person')}
                className="search-type-dropdown"
              >
                <option value="multi">Movies & TV</option>
                <option value="person">People</option>
              </select>
            </form>
          </div>
        </div>
      </div>

      <div className="container">
        <h2>Popular movies</h2>
        <div className="horizontal-slider">
          {topMovies && topMovies.length > 0 ? (
            topMovies.map(movie => (
              <MovieCard key={movie.MovieID} movie={movie} />
            ))
          ) : (
            <p>No movies found</p>
          )}
        </div>
      </div>

      <div className="container">
        <h2>Popular TV shows</h2>
        <div className="horizontal-slider">
          {topTVShows && topTVShows.length > 0 ? (
            topTVShows.map(show => (
              <MovieCard key={show.MovieID} movie={{...show, media_type: 'tv'}} />
            ))
          ) : (
            <p>No TV shows found</p>
          )}
        </div>
      </div>

      <div className="container">
        <h2>Popular people</h2>
        <div className="horizontal-slider">
          {popularPeople && popularPeople.length > 0 ? (
            popularPeople.map(person => (
              <Link 
                to={`/person/${person.id}`} 
                key={person.id}
                className="cast-member"
                style={{ textDecoration: 'none' }}
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
                    <div className="cast-character">{person.known_for_department}</div>
                    <span className="tooltip-text">{person.known_for_department}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No people found</p>
          )}
        </div>
      </div>

      <div className="container">
        <h2>Top rated on FilmVault</h2>
        <div className="horizontal-slider">
          {userTopMovies && userTopMovies.length > 0 ? (
            userTopMovies.map(movie => (
              <MovieCard key={movie.MovieID} movie={movie} />
            ))
          ) : (
            <p>No movies found</p>
          )}
        </div>
      </div>

      <div className="container">
        <h2>Top Contributors {topUsers.length > 0 ? `(${topUsers.length})` : ''}</h2>
        <UserTable users={topUsers} />
      </div>
    </div>
  );
};

export default Home;