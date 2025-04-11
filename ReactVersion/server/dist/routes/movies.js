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
const router = express_1.default.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';
// Mapping function to standardize movie data format
const mapTMDBMovie = (movie) => {
    return {
        MovieID: movie.id,
        Title: movie.title,
        PosterPath: movie.poster_path,
        Overview: movie.overview,
        ReleaseDate: movie.release_date,
        VoteAverage: movie.vote_average
    };
};
// Get top movies from TMDB
router.get('/top', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1 } = req.query;
        const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/popular`, {
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
    }
    catch (error) {
        console.error('Error fetching top movies from TMDB:', error);
        res.status(500).json({ message: 'Error fetching movies from TMDB' });
    }
}));
// Get top rated movies from TMDB
router.get('/top-rated', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1 } = req.query;
        const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/top_rated`, {
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
    }
    catch (error) {
        console.error('Error fetching top rated movies from TMDB:', error);
        res.status(500).json({ message: 'Error fetching top rated movies' });
    }
}));
// Search movies using TMDB
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, page = 1, type = 'movie' } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        let endpoint = type === 'person' ? 'search/person' : 'search/movie';
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
                    }))) || []
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
        const response = yield axios_1.default.get(`${TMDB_API_URL}/movie/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'credits,similar'
            }
        });
        const movie = {
            MovieID: response.data.id,
            Title: response.data.title,
            PosterPath: response.data.poster_path,
            BackdropPath: response.data.backdrop_path,
            Overview: response.data.overview,
            ReleaseDate: response.data.release_date,
            Runtime: response.data.runtime,
            Genres: response.data.genres,
            VoteAverage: response.data.vote_average,
            VoteCount: response.data.vote_count,
            Cast: ((_b = (_a = response.data.credits) === null || _a === void 0 ? void 0 : _a.cast) === null || _b === void 0 ? void 0 : _b.slice(0, 10)) || [],
            Similar: ((_d = (_c = response.data.similar) === null || _c === void 0 ? void 0 : _c.results) === null || _d === void 0 ? void 0 : _d.map(mapTMDBMovie)) || []
        };
        res.json(movie);
    }
    catch (error) {
        console.error('Error fetching movie details from TMDB:', error);
        res.status(500).json({ message: 'Error fetching movie details' });
    }
}));
// Get person (cast member) details from TMDB
router.get('/person/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
        const knownFor = ((_d = (_c = (_b = (_a = response.data.combined_credits) === null || _a === void 0 ? void 0 : _a.cast) === null || _b === void 0 ? void 0 : _b.sort((a, b) => b.popularity - a.popularity)) === null || _c === void 0 ? void 0 : _c.slice(0, 8)) === null || _d === void 0 ? void 0 : _d.map((credit) => ({
            id: credit.id,
            title: credit.title || credit.name,
            poster_path: credit.poster_path,
            media_type: credit.media_type,
            character: credit.character,
            release_date: credit.release_date || credit.first_air_date,
            vote_average: credit.vote_average
        }))) || [];
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
