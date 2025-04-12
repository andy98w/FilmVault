const axios = require('axios');

// TMDB Configuration
const TMDB_API_KEY = '8d577764c95d04282fe610ceecd260c2';
const TMDB_API_URL = 'https://api.themoviedb.org/3';

async function testTMDB() {
  console.log('Testing TMDB API connection...');
  console.log('API Key used:', TMDB_API_KEY);
  
  try {
    const response = await axios.get(`${TMDB_API_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    
    console.log('TMDB API connection successful!');
    console.log('Response status:', response.status);
    console.log('Number of results:', response.data.results.length);
    console.log('First movie title:', response.data.results[0].title);
    return true;
  } catch (error) {
    console.error('TMDB API connection failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

testTMDB();