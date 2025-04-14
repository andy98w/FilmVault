import express from 'express';
import axios from 'axios';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// TMDB Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const IS_DEV = process.env.NODE_ENV !== 'production';
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Log API key status securely
if (!TMDB_API_KEY) {
  console.error('ERROR: TMDB_API_KEY environment variable is missing! Set this in your .env file to use TMDB API.');
  if (IS_DEV) {
    console.log('Development mode: Mock data will be used for TMDB API requests');
  }
} else {
  // Only log presence, not any part of the key for better security
  console.log('TMDB API key found in environment variables.');
  console.log(`Environment: ${IS_DEV ? 'Development' : 'Production'}`);
  console.log(`Mock data mode: ${USE_MOCK_DATA ? 'Enabled' : 'Disabled'}`);
}

// Helper function to create mock movie data
const createMockMovies = (count: number) => {
  return Array(count).fill(0).map((_, i) => ({
    MovieID: i + 1,
    Title: `Mock Movie ${i + 1}`,
    PosterPath: '/default-poster.jpg',
    Overview: 'This is a mock movie for testing purposes. When in development mode without a valid TMDB API key, this mock data is provided instead of actual API data.',
    ReleaseDate: new Date(Date.now() - Math.floor(Math.random() * 10 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Random date within last 10 years
    VoteAverage: Math.floor(Math.random() * 10) + Math.random(),
    media_type: 'movie'
  }));
};

// Mock popular people for development
const createMockPeople = (count: number) => {
  return Array(count).fill(0).map((_, i) => ({
    id: i + 1,
    name: `Mock Actor ${i + 1}`,
    profile_path: '/default-profile.jpg',
    known_for_department: i % 2 === 0 ? 'Acting' : 'Directing',
    popularity: Math.floor(Math.random() * 100),
    gender: i % 2 === 0 ? 'Male' : 'Female',
    known_for: Array(3).fill(0).map((_, j) => ({
      id: j + 1,
      title: `Mock Movie ${j + 1}`,
      media_type: 'movie'
    })),
    media_type: 'person'
  }));
};

// Mapping function to standardize movie data format
const mapTMDBMovie = (movie: any) => {
  return {
    MovieID: movie.id,
    Title: movie.title || movie.name, // TV shows use 'name' instead of 'title'
    PosterPath: movie.poster_path,
    Overview: movie.overview,
    ReleaseDate: movie.release_date || movie.first_air_date, // TV shows use 'first_air_date'
    VoteAverage: movie.vote_average,
    media_type: movie.media_type || 'movie' // Include media type for multi search
  };
};

// Test TMDB API connection
router.get('/test-connection', async (req, res) => {
  try {
    // In development or with USE_MOCK_DATA, always report success
    if (IS_DEV || USE_MOCK_DATA) {
      return res.json({
        message: 'Backend API connection successful',
        tmdb_configured: true,
        success: true,
        mock_enabled: !TMDB_API_KEY || USE_MOCK_DATA,
        environment: IS_DEV ? 'development' : 'production'
      });
    }
    
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        success: false
      });
    }
    
    // Return success without actually making external API call
    res.json({
      message: 'Backend API connection successful',
      tmdb_configured: true,
      success: true
    });
  } catch (error) {
    console.error('Error testing API connection:', error);
    res.status(500).json({ message: 'Server error', success: false });
  }
});

// Get top movies from TMDB
router.get('/top', async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    
    // Use mock data in development if API key is missing or USE_MOCK_DATA is true
    if (!TMDB_API_KEY || USE_MOCK_DATA) {
      console.log('Using mock data for top movies (API key missing or mock mode enabled)');
      const mockMovies = createMockMovies(20);
      
      return res.json({
        results: mockMovies,
        page: page,
        total_pages: 5,
        total_results: 100,
        is_mock: true
      });
    }
    
    
    try {
      // Add a timeout to prevent long-hanging requests in development
      const axiosConfig = {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          page: page
        },
        timeout: IS_DEV ? 5000 : 10000 // Shorter timeout in development
      };
      
      const response = await axios.get(`${TMDB_API_URL}/movie/popular`, axiosConfig);
      
      if (!response.data || !response.data.results) {
        throw new Error('Invalid TMDB API response format');
      }
      
      const movies = response.data.results.map(mapTMDBMovie);
      
      // Return pagination info along with the movies
      res.json({
        results: movies,
        page: response.data.page,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results
      });
    } catch (axiosError: any) {
      console.error('TMDB API request failed:', axiosError.message);
      if (axiosError.response) {
        console.error('TMDB API error response:', axiosError.response.status, axiosError.response.data);
      }
      
      // Always provide mock data in development if API fails
      if (IS_DEV) {
        console.log('Development mode: Falling back to mock movie data');
        const mockMovies = createMockMovies(20);
        
        return res.json({
          results: mockMovies,
          page: page,
          total_pages: 5,
          total_results: 100,
          is_mock: true
        });
      } else {
        // In production, we'll propagate the error
        return res.status(500).json({ 
          message: 'Error fetching data from TMDB API',
          error: axiosError.message
        });
      }
    }
  } catch (error) {
    console.error('Error fetching top movies from TMDB:', error);
    res.status(500).json({ message: 'Error fetching movies from TMDB' });
  }
});

// Get top TV shows from TMDB
router.get('/top-tv', async (req, res) => {
  try {
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        is_mock: true,
        results: [] 
      });
    }
    
    const page = req.query.page ? Number(req.query.page) : 1;
    const response = await axios.get(`${TMDB_API_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    const tvShows = response.data.results.map((show: any) => ({
      MovieID: show.id,
      Title: show.name,
      PosterPath: show.poster_path,
      Overview: show.overview,
      ReleaseDate: show.first_air_date,
      VoteAverage: show.vote_average,
      media_type: 'tv'
    }));
    
    res.json({
      results: tvShows,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching top TV shows from TMDB:', error);
    res.status(500).json({ message: 'Error fetching TV shows from TMDB' });
  }
});

// Get top rated movies from TMDB
router.get('/top-rated', async (req, res) => {
  try {
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        is_mock: true,
        results: [] 
      });
    }
    
    const page = req.query.page ? Number(req.query.page) : 1;
    
    const response = await axios.get(`${TMDB_API_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    
    const movies = response.data.results.map(mapTMDBMovie);
    
    res.json({
      results: movies,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching top rated movies from TMDB:', error);
    res.status(500).json({ message: 'Error fetching top rated movies' });
  }
});

// Get popular people from TMDB
router.get('/popular-people', async (req, res) => {
  try {
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        is_mock: true,
        results: [] 
      });
    }
    
    const page = req.query.page ? Number(req.query.page) : 1;
    
    const response = await axios.get(`${TMDB_API_URL}/person/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    
    const people = response.data.results.map((person: any) => ({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path,
      known_for_department: person.known_for_department,
      popularity: person.popularity,
      gender: person.gender === 1 ? 'Female' : 'Male',
      known_for: person.known_for?.map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        media_type: item.media_type
      })) || []
    }));
    
    res.json({
      results: people,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching popular people from TMDB:', error);
    res.status(500).json({ message: 'Error fetching popular people' });
  }
});

// Get movie details from TMDB
router.get('/details/:id', async (req, res) => {
  try {
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        is_mock: true
      });
    }
    
    const { id } = req.params;
    const type = req.query.type as string || 'movie';
    
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const response = await axios.get(`${TMDB_API_URL}/${mediaType}/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'credits,similar'
      }
    });
    
    let title, releaseDate;
    if (mediaType === 'tv') {
      title = response.data.name;
      releaseDate = response.data.first_air_date;
    } else {
      title = response.data.title;
      releaseDate = response.data.release_date;
    }
    
    const movie = {
      MovieID: response.data.id,
      Title: title,
      PosterPath: response.data.poster_path,
      BackdropPath: response.data.backdrop_path,
      Overview: response.data.overview,
      ReleaseDate: releaseDate,
      Runtime: response.data.runtime || (response.data.episode_run_time && response.data.episode_run_time[0]),
      Genres: response.data.genres,
      VoteAverage: response.data.vote_average,
      VoteCount: response.data.vote_count,
      Cast: response.data.credits?.cast?.slice(0, 10) || [],
      Similar: response.data.similar?.results?.map(mapTMDBMovie) || [],
      media_type: mediaType
    };
    
    res.json(movie);
  } catch (error) {
    console.error('Error fetching media details from TMDB:', error);
    res.status(500).json({ message: 'Error fetching details' });
  }
});

// Search movies and TV shows using TMDB
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query as string;
    const page = req.query.page ? Number(req.query.page) : 1;
    const type = req.query.type as string || 'multi';
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use mock data in development if API key is missing or USE_MOCK_DATA is true
    if (!TMDB_API_KEY || USE_MOCK_DATA) {
      console.log(`Using mock data for ${type} search with query: "${query}"`);
      
      let results;
      if (type === 'person') {
        // Generate mock people results that somewhat match the search query
        results = createMockPeople(8).map(person => {
          return {
            ...person,
            name: `${person.name} ${query}` // Append query to name to simulate relevant results
          };
        });
      } else {
        // Generate mock movie results that somewhat match the search query
        results = createMockMovies(10).map(movie => {
          return {
            ...movie,
            Title: `${movie.Title} ${query}` // Append query to title to simulate relevant results
          };
        });
      }
      
      return res.json({
        results: results,
        page: page,
        total_pages: 3,
        total_results: 30,
        is_mock: true,
        query: query
      });
    }
    
    
    let endpoint;
    switch(type) {
      case 'person':
        endpoint = 'search/person';
        break;
      case 'multi':
      default:
        endpoint = 'search/multi';
        break;
    }
    
    try {
      const response = await axios.get(`${TMDB_API_URL}/${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          query: query,
          page: page,
          include_adult: false
        },
        timeout: IS_DEV ? 5000 : 10000 // Shorter timeout in development
      });
      
      let results;
      if (type === 'person') {
        results = response.data.results.map((person: any) => ({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          known_for_department: person.known_for_department,
          popularity: person.popularity,
          gender: person.gender === 1 ? 'Female' : 'Male',
          known_for: person.known_for?.map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            media_type: item.media_type
          })) || [],
          media_type: 'person'
        }));
      } else {
        results = response.data.results.map(mapTMDBMovie);
      }
      
      res.json({
        results: results,
        page: response.data.page,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results,
        query: query
      });
    } catch (apiError) {
      console.error('TMDB search API failed:', apiError);
      
      // In development, provide mock data on API failure
      if (IS_DEV) {
        console.log('Development mode: Providing mock search results');
        
        let mockResults;
        if (type === 'person') {
          mockResults = createMockPeople(8).map(person => {
            return {
              ...person,
              name: `${person.name} ${query}` // Append query to name to simulate relevant results
            };
          });
        } else {
          mockResults = createMockMovies(10).map(movie => {
            return {
              ...movie,
              Title: `${movie.Title} ${query}` // Append query to title to simulate relevant results
            };
          });
        }
        
        return res.json({
          results: mockResults,
          page: page,
          total_pages: 3,
          total_results: 30,
          is_mock: true,
          query: query
        });
      }
      
      throw apiError; // Re-throw in production
    }
  } catch (error) {
    console.error('Error searching from TMDB:', error);
    res.status(500).json({ 
      message: `Error searching ${req.query.type || 'movies'}`,
      query: req.query.query
    });
  }
});

// Get person details
router.get('/person/:id', async (req, res) => {
  try {
    // Check if API key is available
    if (!TMDB_API_KEY) {
      return res.status(500).json({ 
        message: 'TMDB API key is not configured on the server',
        is_mock: true
      });
    }
    
    const { id } = req.params;
    
    const response = await axios.get(`${TMDB_API_URL}/person/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'combined_credits'
      }
    });
    
    const combinedCredits = response.data.combined_credits?.cast || [];
    
    const knownFor = combinedCredits
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 8)
      .map((credit: any) => ({
        id: credit.id,
        title: credit.title || credit.name,
        poster_path: credit.poster_path,
        media_type: credit.media_type,
        character: credit.character,
        release_date: credit.release_date || credit.first_air_date,
        vote_average: credit.vote_average
      })) || [];
    
    const person = {
      id: response.data.id,
      name: response.data.name,
      profile_path: response.data.profile_path,
      biography: response.data.biography,
      birthday: response.data.birthday,
      deathday: response.data.deathday,
      place_of_birth: response.data.place_of_birth,
      gender: response.data.gender === 1 ? 'Female' : 'Male',
      known_for_department: response.data.known_for_department,
      popularity: response.data.popularity,
      knownFor: knownFor
    };
    
    res.json(person);
  } catch (error) {
    console.error('Error fetching person details from TMDB:', error);
    res.status(500).json({ message: 'Error fetching person details' });
  }
});

// Add movie to user's list (requires authentication)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { movie_id, movie_title, poster_path, overview, release_date } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }
    
    // Check if movie exists in our database
    const [existingMovies] = await pool.query(
      'SELECT * FROM movies WHERE tmdb_id = ?',
      [movie_id]
    );
    
    let movieDatabaseId;
    
    // If movie doesn't exist, add it
    if ((existingMovies as any[]).length === 0) {
      const [insertResult] = await pool.query(
        'INSERT INTO movies (tmdb_id, title, poster_path, overview, release_date) VALUES (?, ?, ?, ?, ?)',
        [movie_id, movie_title, poster_path, overview, release_date || null]
      );
      movieDatabaseId = (insertResult as any).insertId;
    } else {
      movieDatabaseId = (existingMovies as any[])[0].id;
    }
    
    // Check if user already has this movie
    const [userMovies] = await pool.query(
      'SELECT * FROM user_movies WHERE user_id = ? AND movie_id = ?',
      [userId, movieDatabaseId]
    );
    
    if ((userMovies as any[]).length > 0) {
      return res.status(400).json({ message: 'Movie already in your list' });
    }
    
    // Add movie to user's list
    await pool.query(
      'INSERT INTO user_movies (user_id, movie_id) VALUES (?, ?)',
      [userId, movieDatabaseId]
    );
    
    res.status(201).json({ message: 'Movie added to your list' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a movie (requires authentication)
router.post('/rate', authenticateToken, async (req, res) => {
  try {
    const { movie_id, rating } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }
    
    // Get the movie's database ID
    const [movieRows] = await pool.query(
      'SELECT id FROM movies WHERE tmdb_id = ?',
      [movie_id]
    );
    
    if ((movieRows as any[]).length === 0) {
      return res.status(404).json({ message: 'Movie not found in database' });
    }
    
    const movieDatabaseId = (movieRows as any[])[0].id;
    
    // Process the rating value (0-100 scale)
    let ratingValue = Math.max(0, Math.min(100, Math.round(Number(rating))));
    
    // Check the database schema version to handle transition
    let usingOldSchema = false;
    try {
      const [columnInfo] = await pool.query('SHOW COLUMNS FROM movie_ratings LIKE "rating"');
      const columnType = (columnInfo as any[])[0].Type.toLowerCase();
      
      // If the column is still decimal, convert to 0-5 scale temporarily
      if (columnType.includes('decimal')) {
        usingOldSchema = true;
        const oldScaleRating = Math.max(0, Math.min(5, Number(ratingValue) / 20));
        ratingValue = oldScaleRating;
      }
    } catch (schemaError) {
      console.error('Error checking schema:', schemaError);
      // Default to new schema if we can't determine
    }
    
    // Check if user has already rated this movie
    const [existingRatings] = await pool.query(
      'SELECT * FROM movie_ratings WHERE user_id = ? AND movie_id = ?',
      [userId, movieDatabaseId]
    );
    
    if ((existingRatings as any[]).length > 0) {
      await pool.query(
        'UPDATE movie_ratings SET rating = ? WHERE user_id = ? AND movie_id = ?',
        [ratingValue, userId, movieDatabaseId]
      );
    } else {
      await pool.query(
        'INSERT INTO movie_ratings (user_id, movie_id, rating) VALUES (?, ?, ?)',
        [userId, movieDatabaseId, ratingValue]
      );
    }
    
    res.json({ 
      message: 'Movie rated successfully',
      rating: ratingValue
    });
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's movies (requires authentication)
router.get('/user/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }
    
    const [rows] = await pool.query(
      'SELECT m.*, mr.rating ' +
      'FROM user_movies um ' +
      'JOIN movies m ON um.movie_id = m.id ' +
      'LEFT JOIN movie_ratings mr ON um.movie_id = mr.movie_id AND mr.user_id = ? ' +
      'WHERE um.user_id = ?',
      [userId, userId]
    );
    
    const transformedMovies = (rows as any[]).map(movie => ({
      MovieID: movie.tmdb_id,
      Title: movie.title,
      PosterPath: movie.poster_path,
      Overview: movie.overview,
      ReleaseDate: movie.release_date,
      // Rating is already in 0-100 scale, use it directly
      Rating: movie.rating
    }));
    
    res.json(transformedMovies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove movie from user's list (requires authentication)
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }
    
    // Get the movie's database ID
    const [movieRows] = await pool.query(
      'SELECT id FROM movies WHERE tmdb_id = ?',
      [tmdbId]
    );
    
    if ((movieRows as any[]).length === 0) {
      return res.status(404).json({ message: 'Movie not found in database' });
    }
    
    const movieDatabaseId = (movieRows as any[])[0].id;
    
    // Remove from user_movies
    await pool.query(
      'DELETE FROM user_movies WHERE user_id = ? AND movie_id = ?',
      [userId, movieDatabaseId]
    );
    
    // Also remove any ratings
    await pool.query(
      'DELETE FROM movie_ratings WHERE user_id = ? AND movie_id = ?',
      [userId, movieDatabaseId]
    );
    
    res.json({ message: 'Movie removed from your list' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;