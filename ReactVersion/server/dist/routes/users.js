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
const router = express_1.default.Router();
// Get top users by contributions
router.get('/top', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.default.query('SELECT users.id, users.Usernames, users.ProfilePic, ' +
            'COUNT(user_movies.MovieID) as movie_count, ' +
            'COUNT(movie_ratings.Rating) as rating_count ' +
            'FROM users ' +
            'LEFT JOIN user_movies ON users.id = user_movies.UserID ' +
            'LEFT JOIN movie_ratings ON users.id = movie_ratings.UserID ' +
            'GROUP BY users.id ' +
            'ORDER BY movie_count DESC ' +
            'LIMIT 10');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching top users:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get user profile by ID
router.get('/profile/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get user info
        const [users] = yield db_1.default.query('SELECT id, Usernames, ProfilePic FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Get user's movies with ratings
        const [movies] = yield db_1.default.query('SELECT movies.*, movie_ratings.Rating ' +
            'FROM user_movies ' +
            'JOIN movies ON user_movies.MovieID = movies.MovieID ' +
            'LEFT JOIN movie_ratings ON user_movies.MovieID = movie_ratings.MovieID AND movie_ratings.UserID = ? ' +
            'WHERE user_movies.UserID = ?', [id, id]);
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
        // Get user info
        const [users] = yield db_1.default.query('SELECT id, Usernames, Emails, ProfilePic FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    }
    catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Update user profile (requires authentication)
router.put('/update', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, profile_pic } = req.body;
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
exports.default = router;
