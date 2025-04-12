"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const router = express_1.default.Router();
// TMDB Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';
// Log API key status securely
if (!TMDB_API_KEY) {
    console.error('ERROR: TMDB_API_KEY environment variable is missing! Set this in your .env file to use TMDB API.');
}
else {
    // Only log presence, not any part of the key for better security
    console.log('TMDB API key found in environment variables.');
}
// Mapping function to standardize movie data format
const mapTMDBMovie = (movie) => {
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
router.get('/top', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log(`Making API request to: ${TMDB_API_URL}/movie/popular`);
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/popular`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                }
            });
            console.log('TMDB API response status:', response.status);
            if (!response.data || !response.data.results) {
                console.error('Invalid TMDB API response format:', response.data);
                return res.status(500).json({ message: 'Invalid TMDB API response format' });
            }
            const movies = response.data.results.map(mapTMDBMovie);
            console.log(`Successfully mapped ${movies.length} movies`);
            // Return pagination info along with the movies
            res.json({
                results: movies,
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_results: response.data.total_results
            });
        }
        catch (axiosError) {
            console.error('TMDB API request failed:', axiosError.message);
            if (axiosError.response) {
                console.error('TMDB API error response:', axiosError.response.status, axiosError.response.data);
            }
            // Return a mock response for testing purposes
            const mockMovies = Array(20).fill(0).map((_, i) => ({
                MovieID: i + 1,
                Title: `Mock Movie ${i + 1}`,
                PosterPath: null,
                Overview: 'This is a mock movie for testing purposes.',
                ReleaseDate: '2023-01-01',
                VoteAverage: 5.0,
                media_type: 'movie'
            }));
            res.json({
                results: mockMovies,
                page: 1,
                total_pages: 1,
                total_results: mockMovies.length,
                is_mock: true
            });
        }
    }
    catch (error) {
        console.error('Error fetching top movies from TMDB:', error);
        res.status(500).json({ message: 'Error fetching movies from TMDB' });
    }
}));
// Get top TV shows from TMDB
router.get('/top-tv', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log(`Making API request to: ${TMDB_API_URL}/tv/popular with page ${page}`);
        const response = yield axios_1.default.get(`${TMDB_API_URL}/tv/popular`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                page: page
            }
        });
        console.log(`Got ${response.data.results.length} TV shows from TMDB`);
        const tvShows = response.data.results.map((show) => ({
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
    }
    catch (error) {
        console.error('Error fetching top TV shows from TMDB:', error);
        res.status(500).json({ message: 'Error fetching TV shows from TMDB' });
    }
}));
// Get top rated movies from TMDB
router.get('/top-rated', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log(`Making API request to: ${TMDB_API_URL}/movie/top_rated with page ${page}`);
        const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/top_rated`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                page: page
            }
        });
        console.log(`Got ${response.data.results.length} top rated movies from TMDB`);
        const movies = response.data.results.map(mapTMDBMovie);
        res.json({
            results: movies,
            page: response.data.page,
            total_pages: response.data.total_pages,
            total_results: response.data.total_results
        });
    }
    catch (error) {
        console.error('Error fetching top rated movies from TMDB:', error);
        res.status(500).json({ message: 'Error fetching top rated movies' });
    }
}));
// Get popular people from TMDB
router.get('/popular-people', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log(`Making API request to: ${TMDB_API_URL}/person/popular with page ${page}`);
        const response = yield axios_1.default.get(`${TMDB_API_URL}/person/popular`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                page: page
            }
        });
        console.log(`Got ${response.data.results.length} popular people from TMDB`);
        const people = response.data.results.map((person) => {
            var _a;
            return ({
                id: person.id,
                name: person.name,
                profile_path: person.profile_path,
                known_for_department: person.known_for_department,
                popularity: person.popularity,
                gender: person.gender === 1 ? 'Female' : 'Male',
                known_for: ((_a = person.known_for) === null || _a === void 0 ? void 0 : _a.map((item) => ({
                    id: item.id,
                    title: item.title || item.name,
                    media_type: item.media_type
                }))) || []
            });
        });
        res.json({
            results: people,
            page: response.data.page,
            total_pages: response.data.total_pages,
            total_results: response.data.total_results
        });
    }
    catch (error) {
        console.error('Error fetching popular people from TMDB:', error);
        res.status(500).json({ message: 'Error fetching popular people' });
    }
}));
// Get movie details from TMDB
router.get('/details/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Check if API key is available
        if (!TMDB_API_KEY) {
            return res.status(500).json({
                message: 'TMDB API key is not configured on the server',
                is_mock: true
            });
        }
        const { id } = req.params;
        const type = req.query.type || 'movie';
        const mediaType = type === 'tv' ? 'tv' : 'movie';
        const response = yield axios_1.default.get(`${TMDB_API_URL}/${mediaType}/${id}`, {
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
        }
        else {
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
            Cast: ((_b = (_a = response.data.credits) === null || _a === void 0 ? void 0 : _a.cast) === null || _b === void 0 ? void 0 : _b.slice(0, 10)) || [],
            Similar: ((_d = (_c = response.data.similar) === null || _c === void 0 ? void 0 : _c.results) === null || _d === void 0 ? void 0 : _d.map(mapTMDBMovie)) || [],
            media_type: mediaType
        };
        res.json(movie);
    }
    catch (error) {
        console.error('Error fetching media details from TMDB:', error);
        res.status(500).json({ message: 'Error fetching details' });
    }
}));
// Search movies and TV shows using TMDB
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if API key is available
        if (!TMDB_API_KEY) {
            return res.status(500).json({
                message: 'TMDB API key is not configured on the server',
                is_mock: true,
                results: []
            });
        }
        const query = req.query.query;
        const page = req.query.page ? Number(req.query.page) : 1;
        const type = req.query.type || 'multi';
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        let endpoint;
        switch (type) {
            case 'person':
                endpoint = 'search/person';
                break;
            case 'multi':
            default:
                endpoint = 'search/multi';
                break;
        }
        const response = yield axios_1.default.get(`${TMDB_API_URL}/${endpoint}`, {
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
            results = response.data.results.map((person) => {
                var _a;
                return ({
                    id: person.id,
                    name: person.name,
                    profile_path: person.profile_path,
                    known_for_department: person.known_for_department,
                    popularity: person.popularity,
                    gender: person.gender === 1 ? 'Female' : 'Male',
                    known_for: ((_a = person.known_for) === null || _a === void 0 ? void 0 : _a.map((item) => ({
                        id: item.id,
                        title: item.title || item.name,
                        media_type: item.media_type
                    }))) || [],
                    media_type: 'person'
                });
            });
        }
        else {
            results = response.data.results.map(mapTMDBMovie);
        }
        res.json({
            results: results,
            page: response.data.page,
            total_pages: response.data.total_pages,
            total_results: response.data.total_results
        });
    }
    catch (error) {
        console.error('Error searching from TMDB:', error);
        res.status(500).json({ message: `Error searching ${req.query.type || 'movies'}` });
    }
}));
// Get person details
router.get('/person/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check if API key is available
        if (!TMDB_API_KEY) {
            return res.status(500).json({
                message: 'TMDB API key is not configured on the server',
                is_mock: true
            });
        }
        const { id } = req.params;
        const response = yield axios_1.default.get(`${TMDB_API_URL}/person/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'combined_credits'
            }
        });
        const combinedCredits = ((_a = response.data.combined_credits) === null || _a === void 0 ? void 0 : _a.cast) || [];
        const knownFor = combinedCredits
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 8)
            .map((credit) => ({
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
    }
    catch (error) {
        console.error('Error fetching person details from TMDB:', error);
        res.status(500).json({ message: 'Error fetching person details' });
    }
}));
// Add movie to user's list (requires authentication)
router.post('/add', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('Add movie request received:', Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }));
        const { movie_id, movie_title, poster_path, overview, release_date } = req.body;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            console.error('User ID not found in authentication token');
            return res.status(401).json({ message: 'User ID not found in authentication token' });
        }
        console.log('Checking if movie exists in database...');
        // First check if movie exists in our database
        try {
            // Debugging: Check movie table structure
            const [movieColumns] = yield db_1.default.query('SHOW COLUMNS FROM movies');
            console.log('Movies table columns:', movieColumns);
            // Look for existing movie
            const [existingMovies] = yield db_1.default.query('SELECT * FROM movies WHERE tmdb_id = ?', [movie_id]);
            console.log(`Found ${existingMovies.length} existing movies with TMDB ID ${movie_id}`);
            let movieDatabaseId;
            // If movie doesn't exist, add it
            if (existingMovies.length === 0) {
                console.log('Movie not found in database, inserting new record...');
                const title = movie_title; // Fix for the client-side property name
                try {
                    const [insertResult] = yield db_1.default.query('INSERT INTO movies (tmdb_id, title, poster_path, overview, release_date) VALUES (?, ?, ?, ?, ?)', [movie_id, title, poster_path, overview, release_date || null]);
                    movieDatabaseId = insertResult.insertId;
                    console.log(`Movie inserted with database ID ${movieDatabaseId}`);
                }
                catch (insertError) {
                    console.error('Error inserting movie:', insertError);
                    throw insertError;
                }
            }
            else {
                movieDatabaseId = existingMovies[0].id;
                console.log(`Using existing movie with database ID ${movieDatabaseId}`);
            }
            console.log('Checking if user already has this movie...');
            // Check if user already has this movie
            try {
                // Debug user_movies table structure
                const [userMoviesColumns] = yield db_1.default.query('SHOW COLUMNS FROM user_movies');
                console.log('user_movies table columns:', userMoviesColumns);
                const [userMovies] = yield db_1.default.query('SELECT * FROM user_movies WHERE user_id = ? AND movie_id = ?', [userId, movieDatabaseId]);
                console.log(`Found ${userMovies.length} user-movie connections`);
                if (userMovies.length > 0) {
                    return res.status(400).json({ message: 'Movie already in your list' });
                }
            }
            catch (checkError) {
                console.error('Error checking if user has movie:', checkError);
                throw checkError;
            }
            console.log('Adding movie to user list...');
            // Add movie to user's list
            try {
                yield db_1.default.query('INSERT INTO user_movies (user_id, movie_id) VALUES (?, ?)', [userId, movieDatabaseId]);
                console.log('Movie successfully added to user list');
            }
            catch (addError) {
                console.error('Error adding movie to user list:', addError);
                throw addError;
            }
            res.status(201).json({ message: 'Movie added to your list' });
        }
        catch (dbError) {
            console.error('Database error in add movie endpoint:', dbError);
            if (dbError instanceof Error) {
                return res.status(500).json({ message: 'Database error', error: dbError.message });
            }
            throw dbError;
        }
    }
    catch (error) {
        console.error('Error adding movie:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
// Rate a movie (requires authentication)
router.post('/rate', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { movie_id, rating } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found in authentication token' });
        }
        // Get the movie's database ID
        const [movieRows] = yield db_1.default.query('SELECT id FROM movies WHERE tmdb_id = ?', [movie_id]);
        if (movieRows.length === 0) {
            return res.status(404).json({ message: 'Movie not found in database' });
        }
        const movieDatabaseId = movieRows[0].id;
        // Check if user has already rated this movie
        const [existingRatings] = yield db_1.default.query('SELECT * FROM movie_ratings WHERE user_id = ? AND movie_id = ?', [userId, movieDatabaseId]);
        if (existingRatings.length > 0) {
            // Update existing rating
            yield db_1.default.query('UPDATE movie_ratings SET rating = ? WHERE user_id = ? AND movie_id = ?', [rating, userId, movieDatabaseId]);
        }
        else {
            // Add new rating
            yield db_1.default.query('INSERT INTO movie_ratings (user_id, movie_id, rating) VALUES (?, ?, ?)', [userId, movieDatabaseId, rating]);
        }
        res.json({ message: 'Movie rated successfully' });
    }
    catch (error) {
        console.error('Error rating movie:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get user's movies (requires authentication)
router.get('/user/list', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('Fetching user movies list...');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            console.error('User ID not found in authentication token');
            return res.status(401).json({ message: 'User ID not found in authentication token' });
        }
        console.log(`Getting movies for user ID ${userId}...`);
        try {
            // Debug: Check database structure
            console.log('Checking database structure...');
            const [movieColumns] = yield db_1.default.query('SHOW COLUMNS FROM movies');
            console.log('Movies table columns:', movieColumns);
            const [userMoviesColumns] = yield db_1.default.query('SHOW COLUMNS FROM user_movies');
            console.log('user_movies table columns:', userMoviesColumns);
            const [ratingColumns] = yield db_1.default.query('SHOW COLUMNS FROM movie_ratings');
            console.log('movie_ratings table columns:', ratingColumns);
            // Query user's movies with proper column names
            console.log('Querying user movies...');
            const [rows] = yield db_1.default.query('SELECT m.*, mr.rating ' +
                'FROM user_movies um ' +
                'JOIN movies m ON um.movie_id = m.id ' +
                'LEFT JOIN movie_ratings mr ON um.movie_id = mr.movie_id AND mr.user_id = ? ' +
                'WHERE um.user_id = ?', [userId, userId]);
            console.log(`Found ${rows.length} movies for user ${userId}`);
            console.log('Sample movie data:', rows.length > 0 ? rows[0] : 'No movies found');
            // Transform database column names to match the expected format
            console.log('Transforming movie data to client format...');
            const transformedMovies = rows.map(movie => ({
                MovieID: movie.tmdb_id,
                Title: movie.title,
                PosterPath: movie.poster_path,
                Overview: movie.overview,
                ReleaseDate: movie.release_date,
                Rating: movie.rating
            }));
            console.log(`Returning ${transformedMovies.length} transformed movies`);
            console.log('First transformed movie:', transformedMovies.length > 0 ? transformedMovies[0] : 'No movies');
            res.json(transformedMovies);
        }
        catch (dbError) {
            console.error('Database error fetching user movies:', dbError);
            if (dbError instanceof Error) {
                return res.status(500).json({ message: 'Database error', error: dbError.message });
            }
            throw dbError;
        }
    }
    catch (error) {
        console.error('Error fetching user movies:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
// Remove movie from user's list (requires authentication)
router.delete('/remove/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tmdbId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log(`Request to remove movie with TMDB ID ${tmdbId} for user ${userId}`);
        if (!userId) {
            console.error('User ID not found in authentication token');
            return res.status(401).json({ message: 'User ID not found in authentication token' });
        }
        try {
            // Check database tables
            console.log('Checking database structure...');
            const [movieColumns] = yield db_1.default.query('SHOW COLUMNS FROM movies');
            console.log('Movies table columns:', movieColumns);
            const [userMoviesColumns] = yield db_1.default.query('SHOW COLUMNS FROM user_movies');
            console.log('user_movies table columns:', userMoviesColumns);
            // Get the movie's database ID
            console.log(`Looking up movie with TMDB ID ${tmdbId}...`);
            const [movieRows] = yield db_1.default.query('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
            console.log(`Found ${movieRows.length} movies with TMDB ID ${tmdbId}`);
            if (movieRows.length === 0) {
                return res.status(404).json({ message: 'Movie not found in database' });
            }
            const movieDatabaseId = movieRows[0].id;
            console.log(`Movie has database ID ${movieDatabaseId}`);
            // Remove from user_movies
            console.log(`Removing movie ${movieDatabaseId} from user ${userId}'s list...`);
            yield db_1.default.query('DELETE FROM user_movies WHERE user_id = ? AND movie_id = ?', [userId, movieDatabaseId]);
            // Also remove any ratings
            console.log(`Removing any ratings for movie ${movieDatabaseId} by user ${userId}...`);
            yield db_1.default.query('DELETE FROM movie_ratings WHERE user_id = ? AND movie_id = ?', [userId, movieDatabaseId]);
            console.log('Successfully removed movie from user list');
            res.json({ message: 'Movie removed from your list' });
        }
        catch (dbError) {
            console.error('Database error removing movie:', dbError);
            if (dbError instanceof Error) {
                return res.status(500).json({ message: 'Database error', error: dbError.message });
            }
            throw dbError;
        }
    }
    catch (error) {
        console.error('Error removing movie:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
