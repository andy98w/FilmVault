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
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage_service_1 = __importDefault(require("../services/storage.service"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Error: Images Only! (jpeg, jpg, png, gif, webp)'));
        }
    }
});
// Get top users by contributions
router.get('/top', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Fetching top users...');
        // First, let's check the actual column names in the users table
        console.log('Checking users table structure...');
        const [userColumns] = yield db_1.default.query('SHOW COLUMNS FROM users');
        console.log('Users table columns:', userColumns);
        // Check user_movies table structure
        console.log('Checking user_movies table structure...');
        const [userMoviesColumns] = yield db_1.default.query('SHOW COLUMNS FROM user_movies');
        console.log('user_movies table columns:', userMoviesColumns);
        // Check movie_ratings table structure
        console.log('Checking movie_ratings table structure...');
        const [ratingsColumns] = yield db_1.default.query('SHOW COLUMNS FROM movie_ratings');
        console.log('movie_ratings table columns:', ratingsColumns);
        // Use only lowercase column names for consistency
        const [rows] = yield db_1.default.query('SELECT users.id, users.Usernames, users.ProfilePic, ' +
            'COUNT(DISTINCT user_movies.movie_id) as movie_count, ' +
            'COUNT(DISTINCT movie_ratings.id) as rating_count ' +
            'FROM users ' +
            'LEFT JOIN user_movies ON users.id = user_movies.user_id ' +
            'LEFT JOIN movie_ratings ON users.id = movie_ratings.user_id ' +
            'GROUP BY users.id ' +
            'ORDER BY movie_count DESC ' +
            'LIMIT 10');
        console.log(`Found ${rows.length} top users`);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching top users:', error);
        if (error instanceof Error) {
            console.error(error.message);
            // Send detailed error info for debugging
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get user profile by ID
router.get('/profile/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get user info including biography and social media
        const [users] = yield db_1.default.query('SELECT id, Usernames, ProfilePic, Biography, FacebookLink, InstagramLink, YoutubeLink, GithubLink FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Log database schema first
        console.log('Checking movie tables structure for user profile...');
        const [movieColumns] = yield db_1.default.query('SHOW COLUMNS FROM movies');
        console.log('Movies table columns:', movieColumns);
        // Get user's movies with ratings using the correct column names
        console.log(`Fetching movies for user ID ${id}...`);
        let movies;
        try {
            // Query for user's movies
            [movies] = yield db_1.default.query('SELECT DISTINCT m.id, m.tmdb_id, m.title, m.poster_path, m.overview, m.release_date, mr.rating ' +
                'FROM user_movies um ' +
                'JOIN movies m ON um.movie_id = m.id ' +
                'LEFT JOIN movie_ratings mr ON m.id = mr.movie_id AND mr.user_id = ? ' +
                'WHERE um.user_id = ?', [id, id]);
            console.log(`Found ${movies.length} movies for user ${id}`);
            // Keep consistent lowercase naming but still transform for client
            const transformedMovies = movies.map(movie => ({
                id: movie.id,
                tmdb_id: movie.tmdb_id,
                title: movie.title,
                poster_path: movie.poster_path,
                overview: movie.overview,
                release_date: movie.release_date,
                rating: movie.rating
            }));
            console.log(`Transformed ${transformedMovies.length} movies to client format`);
            movies = transformedMovies;
        }
        catch (movieQueryError) {
            console.error('Error fetching user movies:', movieQueryError);
            throw movieQueryError;
        }
        res.json({
            user,
            movies
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get current user profile (requires authentication)
router.get('/me', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log(`Fetching current user profile for user ID ${userId}...`);
        if (!userId) {
            console.error('User ID not found in authentication token');
            return res.status(401).json({ message: 'Authentication error: user ID not found in token' });
        }
        // Get user info
        try {
            const [users] = yield db_1.default.query('SELECT id, Usernames, Emails, ProfilePic, Biography, FacebookLink, InstagramLink, YoutubeLink, GithubLink, LinkedInLink FROM users WHERE id = ?', [userId]);
            console.log(`Found ${users.length} users with ID ${userId}`);
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(users[0]);
        }
        catch (userQueryError) {
            console.error('Database error fetching current user:', userQueryError);
            throw userQueryError;
        }
    }
    catch (error) {
        console.error('Error fetching current user:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
// Update user profile (requires authentication)
router.put('/update', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, profile_pic, biography, facebook_link, instagram_link, youtube_link, github_link, linkedin_link } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const updates = {};
        const params = [];
        if (username) {
            updates.Usernames = '?';
            params.push(username);
        }
        if (profile_pic) {
            updates.ProfilePic = '?';
            params.push(profile_pic);
        }
        if (biography !== undefined) {
            updates.Biography = '?';
            params.push(biography);
        }
        if (facebook_link !== undefined) {
            updates.FacebookLink = '?';
            params.push(facebook_link);
        }
        if (instagram_link !== undefined) {
            updates.InstagramLink = '?';
            params.push(instagram_link);
        }
        if (youtube_link !== undefined) {
            updates.YoutubeLink = '?';
            params.push(youtube_link);
        }
        if (github_link !== undefined) {
            updates.GithubLink = '?';
            params.push(github_link);
        }
        if (linkedin_link !== undefined) {
            updates.LinkedInLink = '?';
            params.push(linkedin_link);
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        const updateQuery = Object.entries(updates)
            .map(([key]) => `${key} = ?`)
            .join(', ');
        params.push(userId);
        yield db_1.default.query(`UPDATE users SET ${updateQuery} WHERE id = ?`, params);
        res.json({ message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Change password (requires authentication)
router.post('/change-password', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { current_password, new_password } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        // Get user's current password
        const [users] = yield db_1.default.query('SELECT Passwords FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Import bcrypt dynamically
        const bcrypt = require('bcrypt');
        // Compare current password with stored hash
        const isPasswordCorrect = yield bcrypt.compare(current_password, user.Passwords);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        // Hash the new password
        const salt = yield bcrypt.genSalt(10);
        const hashedPassword = yield bcrypt.hash(new_password, salt);
        // Update password in database
        yield db_1.default.query('UPDATE users SET Passwords = ? WHERE id = ?', [hashedPassword, userId]);
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
}));
// Upload profile picture (requires authentication)
router.post('/upload-profile-picture', auth_1.authenticateToken, upload.single('profilePicture'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('Profile picture upload request received');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            console.log('Upload rejected: User not authenticated');
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!req.file) {
            console.log('Upload rejected: No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log(`Processing file upload for user ${userId}, file size: ${req.file.size} bytes`);
        // Upload the profile picture with error handling
        let pictureUrl;
        try {
            pictureUrl = yield storage_service_1.default.uploadProfilePicture(userId, req.file.buffer, req.file.originalname);
            console.log(`Profile picture successfully uploaded, URL: ${pictureUrl}`);
        }
        catch (uploadError) {
            console.error('Error during storage service upload:', uploadError);
            return res.status(500).json({
                message: 'Failed to process image upload',
                error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
            });
        }
        // Get user's current profile picture URL
        try {
            const [users] = yield db_1.default.query('SELECT ProfilePic FROM users WHERE id = ?', [userId]);
            const user = users[0];
            const currentProfilePic = user.ProfilePic;
            console.log(`Current profile picture: ${currentProfilePic || 'none'}`);
            // Update user's profile picture in database
            yield db_1.default.query('UPDATE users SET ProfilePic = ? WHERE id = ?', [pictureUrl, userId]);
            console.log(`Database updated with new profile picture URL`);
            // Delete previous profile picture if it exists
            if (currentProfilePic &&
                (currentProfilePic.includes('objectstorage') ||
                    currentProfilePic.includes(storage_service_1.default.getBucketName()))) {
                try {
                    yield storage_service_1.default.deleteProfilePicture(currentProfilePic);
                    console.log(`Previous profile picture deleted`);
                }
                catch (deleteError) {
                    console.error('Error deleting old profile picture:', deleteError);
                    // Continue despite this error
                }
            }
            return res.json({
                message: 'Profile picture uploaded successfully',
                profilePicUrl: pictureUrl
            });
        }
        catch (dbError) {
            console.error('Database error during profile picture update:', dbError);
            return res.status(500).json({
                message: 'Failed to update profile in database',
                error: dbError instanceof Error ? dbError.message : 'Unknown database error'
            });
        }
    }
    catch (error) {
        console.error('Unexpected error in profile picture upload route:', error);
        // Add more detailed error logging
        if (error instanceof Error) {
            console.error(`Error details: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
            if (error.message.includes('Images Only')) {
                return res.status(400).json({ message: error.message });
            }
        }
        return res.status(500).json({
            message: 'Failed to upload profile picture',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Remove profile picture
router.delete('/remove-profile-picture', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        // Get current profile picture URL
        const [userRows] = yield db_1.default.query('SELECT ProfilePic FROM users WHERE id = ?', [userId]);
        const currentProfilePic = (_b = userRows[0]) === null || _b === void 0 ? void 0 : _b.ProfilePic;
        // Delete the profile picture from storage if it exists and is not the default
        if (currentProfilePic && !currentProfilePic.includes('default.jpg')) {
            try {
                yield storage_service_1.default.deleteProfilePicture(currentProfilePic);
            }
            catch (deleteError) {
                console.error('Error deleting profile picture:', deleteError);
            }
        }
        // Update user's record to remove the profile picture reference
        yield db_1.default.query('UPDATE users SET ProfilePic = NULL WHERE id = ?', [userId]);
        res.json({ message: 'Profile picture removed successfully' });
    }
    catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ message: 'Failed to remove profile picture' });
    }
}));
exports.default = router;
