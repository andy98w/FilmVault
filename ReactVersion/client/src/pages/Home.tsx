import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
  movie_count: number;
  rating_count: number;
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [userTopMovies, setUserTopMovies] = useState<Movie[]>([]);
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
        const [topMoviesRes, userTopMoviesRes, topUsersRes] = await Promise.all([
          axios.get(`${API_URL}/api/movies/top`),
          axios.get(`${API_URL}/api/movies/top-rated`),
          axios.get(`${API_URL}/api/users/top`)
        ]);

        console.log("Top Movies Response:", topMoviesRes.data);
        console.log("Top Rated Movies Response:", userTopMoviesRes.data);
        
        // Handle the new paginated response format
        setTopMovies(topMoviesRes.data.results || topMoviesRes.data);
        setUserTopMovies(userTopMoviesRes.data.results || userTopMoviesRes.data);
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
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
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
              <input
                type="text"
                placeholder="🔍 Search Movie"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>

      <div className="container">
        <h2>Top movies of today</h2>
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