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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Additional debugging for environment variables
const envFileContent = fs_1.default.existsSync(path_1.default.join(process.cwd(), '.env'))
    ? fs_1.default.readFileSync(path_1.default.join(process.cwd(), '.env'), 'utf8')
    : 'No .env file found';
console.log('Environment file exists:', fs_1.default.existsSync(path_1.default.join(process.cwd(), '.env')));
console.log('Current working directory:', process.cwd());
console.log('All environment variables:', Object.keys(process.env));
const router = express_1.default.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8d577764c95d04282fe610ceecd260c2'; // Fallback to hardcoded key if env var is missing
const TMDB_API_URL = 'https://api.themoviedb.org/3';
console.log('TMDB API Key:', TMDB_API_KEY ? `Key exists (${TMDB_API_KEY.substring(0, 5)}...)` : 'Key missing');
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
        const { page = 1 } = req.query;
        console.log(`Making API request to: ${TMDB_API_URL}/movie/popular with API key: ${TMDB_API_KEY === null || TMDB_API_KEY === void 0 ? void 0 : TMDB_API_KEY.substring(0, 5)}...`);
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/popular`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                }
            });
            console.log('TMDB API response status:', response.status);
            console.log('TMDB API response data structure:', Object.keys(response.data));
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
        const { page = 1 } = req.query;
        console.log(`Making API request to: ${TMDB_API_URL}/tv/popular with API key: ${TMDB_API_KEY === null || TMDB_API_KEY === void 0 ? void 0 : TMDB_API_KEY.substring(0, 5)}...`);
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/tv/popular`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                }
            });
            console.log('TMDB API TV response status:', response.status);
            console.log('TMDB API TV response data structure:', Object.keys(response.data));
            if (!response.data || !response.data.results) {
                console.error('Invalid TMDB API TV response format:', response.data);
                return res.status(500).json({ message: 'Invalid TMDB API TV response format' });
            }
            const tvShows = response.data.results.map((show) => {
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
            console.log(`Successfully mapped ${tvShows.length} TV shows`);
            // Return pagination info along with the TV shows
            res.json({
                results: tvShows,
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_results: response.data.total_results
            });
        }
        catch (axiosError) {
            console.error('TMDB API TV request failed:', axiosError.message);
            if (axiosError.response) {
                console.error('TMDB API TV error response:', axiosError.response.status, axiosError.response.data);
            }
            // Return a mock response for testing purposes
            const mockTVShows = Array(20).fill(0).map((_, i) => ({
                MovieID: i + 1000,
                Title: `Mock TV Show ${i + 1}`,
                PosterPath: null,
                Overview: 'This is a mock TV show for testing purposes.',
                ReleaseDate: '2023-01-01',
                VoteAverage: 5.0,
                media_type: 'tv'
            }));
            res.json({
                results: mockTVShows,
                page: 1,
                total_pages: 1,
                total_results: mockTVShows.length,
                is_mock: true
            });
        }
    }
    catch (error) {
        console.error('Error fetching top TV shows from TMDB:', error);
        res.status(500).json({ message: 'Error fetching TV shows from TMDB' });
    }
}));
// Get top rated movies from TMDB
router.get('/top-rated', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1 } = req.query;
        console.log(`Making API request to: ${TMDB_API_URL}/movie/top_rated with API key: ${TMDB_API_KEY === null || TMDB_API_KEY === void 0 ? void 0 : TMDB_API_KEY.substring(0, 5)}...`);
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/top_rated`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                }
            });
            console.log('TMDB API top rated response status:', response.status);
            if (!response.data || !response.data.results) {
                console.error('Invalid TMDB API top rated response format:', response.data);
                return res.status(500).json({ message: 'Invalid TMDB API top rated response format' });
            }
            const movies = response.data.results.map(mapTMDBMovie);
            console.log(`Successfully mapped ${movies.length} top rated movies`);
            // Return pagination info along with the movies
            res.json({
                results: movies,
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_results: response.data.total_results
            });
        }
        catch (axiosError) {
            console.error('TMDB API top rated request failed:', axiosError.message);
            if (axiosError.response) {
                console.error('TMDB API top rated error response:', axiosError.response.status, axiosError.response.data);
            }
            // Return a mock response for testing purposes
            const mockMovies = Array(20).fill(0).map((_, i) => ({
                MovieID: i + 2000,
                Title: `Mock Top Rated Movie ${i + 1}`,
                PosterPath: null,
                Overview: 'This is a mock top rated movie for testing purposes.',
                ReleaseDate: '2023-01-01',
                VoteAverage: 8.0 + (i % 2),
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
        console.error('Error fetching top rated movies from TMDB:', error);
        res.status(500).json({ message: 'Error fetching top rated movies' });
    }
}));
// Get popular people from TMDB
router.get('/popular-people', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1 } = req.query;
        console.log(`Making API request to: ${TMDB_API_URL}/person/popular with API key: ${TMDB_API_KEY === null || TMDB_API_KEY === void 0 ? void 0 : TMDB_API_KEY.substring(0, 5)}...`);
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/person/popular`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                }
            });
            console.log('TMDB API people response status:', response.status);
            if (!response.data || !response.data.results) {
                console.error('Invalid TMDB API people response format:', response.data);
                return res.status(500).json({ message: 'Invalid TMDB API people response format' });
            }
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
            console.log(`Successfully mapped ${people.length} popular people`);
            // Return pagination info along with the people
            res.json({
                results: people,
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_results: response.data.total_results
            });
        }
        catch (axiosError) {
            console.error('TMDB API people request failed:', axiosError.message);
            if (axiosError.response) {
                console.error('TMDB API people error response:', axiosError.response.status, axiosError.response.data);
            }
            // Return a mock response for testing purposes
            const mockPeople = Array(20).fill(0).map((_, i) => ({
                id: i + 3000,
                name: `Mock Celebrity ${i + 1}`,
                profile_path: null,
                known_for_department: i % 2 === 0 ? 'Acting' : 'Directing',
                popularity: 10 + i,
                gender: i % 2 === 0 ? 'Male' : 'Female',
                known_for: [
                    {
                        id: 1000 + i,
                        title: `Famous Movie ${i + 1}`,
                        media_type: 'movie'
                    }
                ]
            }));
            res.json({
                results: mockPeople,
                page: 1,
                total_pages: 1,
                total_results: mockPeople.length,
                is_mock: true
            });
        }
    }
    catch (error) {
        console.error('Error fetching popular people from TMDB:', error);
        res.status(500).json({ message: 'Error fetching popular people' });
    }
}));
// Search movies and TV shows using TMDB
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, page = 1, type = 'multi' } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        // Define the search endpoint based on type
        // 'multi' searches for movies, TV shows, and people in a single request
        // 'person' searches only for people
        let endpoint;
        switch (type) {
            case 'person':
                endpoint = 'search/person';
                break;
            case 'multi':
            default:
                endpoint = 'search/multi'; // This endpoint returns both movies and TV shows
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
        // Return pagination info along with the results
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
// Get movie details from TMDB
router.get('/details/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const { type = 'movie' } = req.query;
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
// Get person (cast member) details from TMDB
router.get('/person/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // Fetch person details with combined credits
        const response = yield axios_1.default.get(`${TMDB_API_URL}/person/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'combined_credits'
            }
        });
        // Get most popular movies/shows they're known for
        // Process and combine all credits (both movies and TV shows)
        const combinedCredits = ((_a = response.data.combined_credits) === null || _a === void 0 ? void 0 : _a.cast) || [];
        // Log media types for debugging
        const mediaTypeCounts = combinedCredits.reduce((acc, credit) => {
            const type = credit.media_type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        console.log(`Person ${id} has credits: ${JSON.stringify(mediaTypeCounts)}`);
        // Sort by popularity and take the top 8
        const knownFor = combinedCredits
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 8)
            .map((credit) => ({
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
    }
    catch (error) {
        console.error('Error fetching person details from TMDB:', error);
        res.status(500).json({ message: 'Error fetching person details' });
    }
}));
// Get movie details by ID (from database or fallback to TMDB)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // First check if we have the movie in our database
        const [rows] = yield db_1.default.query('SELECT movies.*, AVG(movie_ratings.Rating) as average_rating, COUNT(movie_ratings.Rating) as rating_count ' +
            'FROM movies ' +
            'LEFT JOIN movie_ratings ON movies.MovieID = movie_ratings.MovieID ' +
            'WHERE movies.MovieID = ? ' +
            'GROUP BY movies.MovieID', [id]);
        if (rows.length > 0) {
            return res.json(rows[0]);
        }
        // If not in database, fetch from TMDB
        try {
            const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/${id}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US'
                }
            });
            const movie = mapTMDBMovie(response.data);
            res.json(movie);
        }
        catch (tmdbError) {
            console.error('Error fetching from TMDB:', tmdbError);
            return res.status(404).json({ message: 'Movie not found' });
        }
    }
    catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Add movie to user's list (requires authentication)
router.post('/add', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { movie_id, movie_title, poster_path, overview } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // First check if movie exists in the movies table
        const [existingMovies] = yield db_1.default.query('SELECT * FROM movies WHERE MovieID = ?', [movie_id]);
        // If movie doesn't exist, add it
        if (existingMovies.length === 0) {
            yield db_1.default.query('INSERT INTO movies (MovieID, Title, PosterPath, Overview) VALUES (?, ?, ?, ?)', [movie_id, movie_title, poster_path, overview]);
        }
        // Check if user already has this movie
        const [userMovies] = yield db_1.default.query('SELECT * FROM user_movies WHERE UserID = ? AND MovieID = ?', [userId, movie_id]);
        if (userMovies.length > 0) {
            return res.status(400).json({ message: 'Movie already in your list' });
        }
        // Add movie to user's list
        yield db_1.default.query('INSERT INTO user_movies (UserID, MovieID) VALUES (?, ?)', [userId, movie_id]);
        res.status(201).json({ message: 'Movie added to your list' });
    }
    catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Rate a movie (requires authentication)
router.post('/rate', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { movie_id, rating } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Check if user has already rated this movie
        const [existingRatings] = yield db_1.default.query('SELECT * FROM movie_ratings WHERE UserID = ? AND MovieID = ?', [userId, movie_id]);
        if (existingRatings.length > 0) {
            // Update existing rating
            yield db_1.default.query('UPDATE movie_ratings SET Rating = ? WHERE UserID = ? AND MovieID = ?', [rating, userId, movie_id]);
        }
        else {
            // Add new rating
            yield db_1.default.query('INSERT INTO movie_ratings (UserID, MovieID, Rating) VALUES (?, ?, ?)', [userId, movie_id, rating]);
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
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const [rows] = yield db_1.default.query('SELECT movies.*, movie_ratings.Rating ' +
            'FROM user_movies ' +
            'JOIN movies ON user_movies.MovieID = movies.MovieID ' +
            'LEFT JOIN movie_ratings ON user_movies.MovieID = movie_ratings.MovieID AND movie_ratings.UserID = ? ' +
            'WHERE user_movies.UserID = ?', [userId, userId]);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching user movies:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Remove movie from user's list (requires authentication)
router.delete('/remove/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        yield db_1.default.query('DELETE FROM user_movies WHERE UserID = ? AND MovieID = ?', [userId, id]);
        res.json({ message: 'Movie removed from your list' });
    }
    catch (error) {
        console.error('Error removing movie:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
