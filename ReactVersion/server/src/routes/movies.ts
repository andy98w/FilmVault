import express from 'express';
import axios from 'axios';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';

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

// Get top movies from TMDB
router.get('/top', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${TMDB_API_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    const movies = response.data.results.map(mapTMDBMovie);
    
    // Return pagination info along with the movies
    res.json({
      results: movies,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching top movies from TMDB:', error);
    res.status(500).json({ message: 'Error fetching movies from TMDB' });
  }
});

// Get top TV shows from TMDB
router.get('/top-tv', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${TMDB_API_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    const tvShows = response.data.results.map((show: any) => {
      return {
        MovieID: show.id,
        Title: show.name,
        PosterPath: show.poster_path,
        Overview: show.overview,
        ReleaseDate: show.first_air_date,
        VoteAverage: show.vote_average,
        media_type: 'tv'
      };
    });
    
    // Return pagination info along with the TV shows
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
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${TMDB_API_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: page
      }
    });
    
    const movies = response.data.results.map(mapTMDBMovie);
    
    // Return pagination info along with the movies
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
    const { page = 1 } = req.query;
    
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
    
    // Return pagination info along with the people
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

// Search movies and TV shows using TMDB
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, type = 'multi' } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Define the search endpoint based on type
    // 'multi' searches for movies, TV shows, and people in a single request
    // 'person' searches only for people
    let endpoint;
    switch(type) {
      case 'person':
        endpoint = 'search/person';
        break;
      case 'multi':
      default:
        endpoint = 'search/multi'; // This endpoint returns both movies and TV shows
        break;
    }
    
    const response = await axios.get(`${TMDB_API_URL}/${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        query: query,
        page: page,
        include_adult: false
      }
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
    
    // Return pagination info along with the results
    res.json({
      results: results,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error searching from TMDB:', error);
    res.status(500).json({ message: `Error searching ${req.query.type || 'movies'}` });
  }
});

// Get movie details from TMDB
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'movie' } = req.query;
    
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

// Get person (cast member) details from TMDB
router.get('/person/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch person details with combined credits
    const response = await axios.get(`${TMDB_API_URL}/person/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'combined_credits'
      }
    });
    
    // Get most popular movies/shows they're known for
    // Process and combine all credits (both movies and TV shows)
    const combinedCredits = response.data.combined_credits?.cast || [];
    
    // Log media types for debugging
    const mediaTypeCounts = combinedCredits.reduce((acc: any, credit: any) => {
      const type = credit.media_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`Person ${id} has credits: ${JSON.stringify(mediaTypeCounts)}`);
    
    // Sort by popularity and take the top 8
    const knownFor = combinedCredits
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 8)
      .map((credit: any) => ({
        id: credit.id,
        title: credit.title || credit.name, // TV shows use 'name' instead of 'title'
        poster_path: credit.poster_path,
        media_type: credit.media_type, // 'movie' or 'tv'
        character: credit.character,
        release_date: credit.release_date || credit.first_air_date, // TV shows use 'first_air_date'
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

// Get movie details by ID (from database or fallback to TMDB)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if we have the movie in our database
    const [rows] = await pool.query(
      'SELECT movies.*, AVG(movie_ratings.Rating) as average_rating, COUNT(movie_ratings.Rating) as rating_count ' +
      'FROM movies ' +
      'LEFT JOIN movie_ratings ON movies.MovieID = movie_ratings.MovieID ' +
      'WHERE movies.MovieID = ? ' +
      'GROUP BY movies.MovieID',
      [id]
    );
    
    if ((rows as any[]).length > 0) {
      return res.json((rows as any[])[0]);
    }
    
    // If not in database, fetch from TMDB
    try {
      const response = await axios.get(`${TMDB_API_URL}/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US'
        }
      });
      
      const movie = mapTMDBMovie(response.data);
      res.json(movie);
    } catch (tmdbError) {
      console.error('Error fetching from TMDB:', tmdbError);
      return res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add movie to user's list (requires authentication)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { movie_id, movie_title, poster_path, overview } = req.body;
    const userId = req.user?.id;
    
    // First check if movie exists in the movies table
    const [existingMovies] = await pool.query(
      'SELECT * FROM movies WHERE MovieID = ?',
      [movie_id]
    );
    
    // If movie doesn't exist, add it
    if ((existingMovies as any[]).length === 0) {
      await pool.query(
        'INSERT INTO movies (MovieID, Title, PosterPath, Overview) VALUES (?, ?, ?, ?)',
        [movie_id, movie_title, poster_path, overview]
      );
    }
    
    // Check if user already has this movie
    const [userMovies] = await pool.query(
      'SELECT * FROM user_movies WHERE UserID = ? AND MovieID = ?',
      [userId, movie_id]
    );
    
    if ((userMovies as any[]).length > 0) {
      return res.status(400).json({ message: 'Movie already in your list' });
    }
    
    // Add movie to user's list
    await pool.query(
      'INSERT INTO user_movies (UserID, MovieID) VALUES (?, ?)',
      [userId, movie_id]
    );
    
    res.status(201).json({ message: 'Movie added to your list' });
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a movie (requires authentication)
router.post('/rate', authenticateToken, async (req, res) => {
  try {
    const { movie_id, rating } = req.body;
    const userId = req.user?.id;
    
    // Check if user has already rated this movie
    const [existingRatings] = await pool.query(
      'SELECT * FROM movie_ratings WHERE UserID = ? AND MovieID = ?',
      [userId, movie_id]
    );
    
    if ((existingRatings as any[]).length > 0) {
      // Update existing rating
      await pool.query(
        'UPDATE movie_ratings SET Rating = ? WHERE UserID = ? AND MovieID = ?',
        [rating, userId, movie_id]
      );
    } else {
      // Add new rating
      await pool.query(
        'INSERT INTO movie_ratings (UserID, MovieID, Rating) VALUES (?, ?, ?)',
        [userId, movie_id, rating]
      );
    }
    
    res.json({ message: 'Movie rated successfully' });
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's movies (requires authentication)
router.get('/user/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const [rows] = await pool.query(
      'SELECT movies.*, movie_ratings.Rating ' +
      'FROM user_movies ' +
      'JOIN movies ON user_movies.MovieID = movies.MovieID ' +
      'LEFT JOIN movie_ratings ON user_movies.MovieID = movie_ratings.MovieID AND movie_ratings.UserID = ? ' +
      'WHERE user_movies.UserID = ?',
      [userId, userId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user movies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove movie from user's list (requires authentication)
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    await pool.query(
      'DELETE FROM user_movies WHERE UserID = ? AND MovieID = ?',
      [userId, id]
    );
    
    res.json({ message: 'Movie removed from your list' });
  } catch (error) {
    console.error('Error removing movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;