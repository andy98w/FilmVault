const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// TMDB Configuration
const TMDB_API_KEY = '8d577764c95d04282fe610ceecd260c2';
const TMDB_API_URL = 'https://api.themoviedb.org/3';

// Simple route to get popular movies
app.get('/movies/top', async (req, res) => {
  console.log('GET /movies/top requested');
  try {
    const response = await axios.get(`${TMDB_API_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: req.query.page || 1
      }
    });
    
    // Map to our format
    const movies = response.data.results.map(movie => ({
      MovieID: movie.id,
      Title: movie.title,
      PosterPath: movie.poster_path,
      Overview: movie.overview,
      ReleaseDate: movie.release_date,
      VoteAverage: movie.vote_average,
      media_type: 'movie'
    }));
    
    console.log(`Found ${movies.length} movies`);
    
    res.json({
      results: movies,
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple TMDB proxy server running on port ${PORT}`);
  console.log(`Try: http://localhost:${PORT}/movies/top`);
});