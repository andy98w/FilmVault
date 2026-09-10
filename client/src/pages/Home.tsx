import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import UserTable from '../components/UserTable';
import axiosInstance from '../api/config';
import { getCatalogImageUrl } from '../config/config';

interface Movie {
  MovieID: number;
  Title: string;
  PosterPath: string;
  Overview: string;
  ReleaseDate?: string;
  VoteAverage?: number;
  average_rating?: number;
  media_type?: string;
}

interface Person {
  id: number;
  name: string;
  profile_path: string;
  known_for_department: string;
}

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
  movie_count: number;
  rating_count: number;
}

const getResults = (response: any) => response?.data?.results || response?.data || [];

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
    const urlMessage = new URLSearchParams(location.search).get('message');
    if (urlMessage) {
      setMessage(urlMessage);
      navigate('/', { replace: true });
      const timeout = window.setTimeout(() => setMessage(''), 5000);
      return () => window.clearTimeout(timeout);
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const requests = await Promise.allSettled([
        axiosInstance.get('/api/movies/top'),
        axiosInstance.get('/api/movies/top-tv'),
        axiosInstance.get('/api/movies/top-rated'),
        axiosInstance.get('/api/movies/popular-people'),
        axiosInstance.get('/api/users/top'),
      ]);

      const value = (index: number) => requests[index].status === 'fulfilled'
        ? (requests[index] as PromiseFulfilledResult<any>).value
        : null;

      setTopMovies(getResults(value(0)));
      setTopTVShows(getResults(value(1)));
      setUserTopMovies(getResults(value(2)));
      setPopularPeople(getResults(value(3)));
      setTopUsers(value(4)?.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search?query=' + encodeURIComponent(searchQuery) + '&type=' + searchType);
    }
  };

  const movieSection = (title: string, note: string, movies: Movie[], mediaType?: string) => (
    <section className="vault-section">
      <div className="vault-section-heading">
        <div><h2>{title}</h2><p>{note}</p></div>
        <span>{movies.length ? movies.length + ' titles' : 'Unavailable'}</span>
      </div>
      {movies.length ? (
        <div className="horizontal-slider">
          {movies.map((movie) => (
            <MovieCard
              key={movie.MovieID}
              movie={mediaType ? { ...movie, media_type: mediaType } : movie}
            />
          ))}
        </div>
      ) : (
        <div className="vault-empty">The catalog service did not return any titles. Check the API connection and reload.</div>
      )}
    </section>
  );

  return (
    <main className="vault-home">
      {message && <div className="notification notification-success">{message}</div>}

      <header className="vault-hero">
        <div className="vault-shell">
          <div className="vault-hero-copy">
            <p>Keep the films you want to remember.</p>
            <h1>Your watchlist,<br />ratings, and finds.</h1>
          </div>
          <form className="vault-search" onSubmit={handleSearch}>
            <label htmlFor="vault-query">Search the catalog</label>
            <div>
              <input
                id="vault-query"
                type="search"
                placeholder={searchType === 'person' ? 'Director or actor name' : 'Movie or TV title'}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <select value={searchType} onChange={(event) => setSearchType(event.target.value as 'multi' | 'person')} aria-label="Search type">
                <option value="multi">Movies & TV</option>
                <option value="person">People</option>
              </select>
              <button type="submit" disabled={!searchQuery.trim()}>Search</button>
            </div>
            <p>Results include movies, series, cast, and crew from TMDB.</p>
          </form>
        </div>
      </header>

      <div className="vault-shell vault-content">
        {loading ? (
          <div className="vault-loading"><span /><p>Loading the catalog…</p></div>
        ) : (
          <>
            {movieSection('Popular films', 'What people are watching now', topMovies)}
            {movieSection('Popular television', 'Series drawing an audience this week', topTVShows, 'tv')}

            <section className="vault-section">
              <div className="vault-section-heading">
                <div><h2>People</h2><p>Actors and filmmakers appearing across the catalog</p></div>
                <span>{popularPeople.length ? popularPeople.length + ' people' : 'Unavailable'}</span>
              </div>
              {popularPeople.length ? (
                <div className="horizontal-slider people-slider">
                  {popularPeople.map((person) => (
                    <Link to={'/person/' + person.id} key={person.id} className="cast-member">
                      {person.profile_path ? (
                        <img src={getCatalogImageUrl(person.profile_path, 'w185')} alt="" className="cast-photo" />
                      ) : <div className="no-cast-photo" aria-hidden="true">?</div>}
                      <div className="cast-info"><div className="cast-name">{person.name}</div><div className="cast-character">{person.known_for_department}</div></div>
                    </Link>
                  ))}
                </div>
              ) : <div className="vault-empty">People are unavailable while the catalog API is offline.</div>}
            </section>

            {movieSection('FilmVault member picks', 'Highest average ratings from saved collections', userTopMovies)}

            <section className="vault-section contributors-section">
              <div className="vault-section-heading">
                <div><h2>Active collectors</h2><p>Members with the most saved titles and ratings</p></div>
              </div>
              <UserTable users={topUsers} />
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Home;
