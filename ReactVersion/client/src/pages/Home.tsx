import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import UserTable from '../components/UserTable';

// API base URL
const API_URL = 'http://localhost:5001';

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
  const [searchType, setSearchType] = useState<'movie' | 'person'>('movie');
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
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

    const fetchData = async () => {
      setLoading(true);
      try {
        const [topMoviesRes, userTopMoviesRes, popularPeopleRes, topUsersRes] = await Promise.all([
          axios.get(`${API_URL}/api/movies/top`),
          axios.get(`${API_URL}/api/movies/top-rated`),
          axios.get(`${API_URL}/api/movies/popular-people`),
          axios.get(`${API_URL}/api/users/top`)
        ]);

        console.log("Popular Movies Response:", topMoviesRes.data);
        console.log("Top Rated Movies Response:", userTopMoviesRes.data);
        console.log("Popular People Response:", popularPeopleRes.data);
        
        // Handle the new paginated response format
        setTopMovies(topMoviesRes.data.results || topMoviesRes.data);
        setUserTopMovies(userTopMoviesRes.data.results || userTopMoviesRes.data);
        setPopularPeople(popularPeopleRes.data.results || popularPeopleRes.data);
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
  
  const handleTypeChange = (type: 'movie' | 'person') => {
    setSearchType(type);
  };

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
                placeholder={`Search ${searchType === 'movie' ? 'Movie' : 'Actor/Actress'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                value={searchType} 
                onChange={(e) => handleTypeChange(e.target.value as 'movie' | 'person')}
                className="search-type-dropdown"
              >
                <option value="movie">Movies</option>
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
        <h2>Top rated on MyFavMovies</h2>
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
        <h2>Most Contributed Users</h2>
        <UserTable users={topUsers} />
      </div>
    </div>
  );
};

export default Home;