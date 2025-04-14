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
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./routes/auth"));
const movies_1 = __importDefault(require("./routes/movies"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const error_1 = require("./middleware/error");
// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`Running in ${nodeEnv} environment`);
if (nodeEnv === 'production') {
    // Try to load from absolute path first (for production server deployment)
    const absolutePath = path_1.default.join(__dirname, '../.env.production');
    if (require('fs').existsSync(absolutePath)) {
        console.log(`Loading environment from absolute path: ${absolutePath}`);
        dotenv_1.default.config({ path: absolutePath });
    }
    else {
        // Fallback to relative path
        console.log('Loading environment from relative path: .env.production');
        dotenv_1.default.config({ path: '.env.production' });
    }
}
else {
    // Development environment
    const devPath = path_1.default.join(__dirname, '../.env.development');
    if (require('fs').existsSync(devPath)) {
        console.log(`Loading environment from: ${devPath}`);
        dotenv_1.default.config({ path: devPath });
    }
    else {
        console.log('Loading environment from: .env.development');
        dotenv_1.default.config({ path: '.env.development' });
    }
}
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Server URL: ${process.env.SERVER_URL}`);
console.log(`Client URL: ${process.env.CLIENT_URL}`);
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001; // Default to 3001 to avoid conflicts
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'https://filmvault.space', // Use domain name instead of IP
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true // Allow cookies to be sent with requests
}));
// Log CORS settings in detail
console.log('CORS credentials setting:', true);
console.log('CORS origin setting:', process.env.CLIENT_URL || 'https://filmvault.space');
// Log CORS configuration
console.log('CORS configured with origin:', process.env.CLIENT_URL || 'https://filmvault.space');
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)()); // Parse cookies
// Log cookie parsing setup
console.log('Cookie parsing enabled');
console.log('Client URL:', process.env.CLIENT_URL || 'Not set (allowing all origins)');
// Serve profile pictures statically
console.log('Serving profile pictures from:', path_1.default.join(__dirname, '../profile-pictures'));
app.use('/profile-pictures', express_1.default.static(path_1.default.join(__dirname, '../profile-pictures')));
// Log middleware configuration
console.log('CORS configuration:', {
    origin: true,
    credentials: true
});
// Database initialization function
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking if database schema needs initialization...');
            const connection = yield db_1.default.getConnection();
            try {
                // Check if users table exists
                const [tables] = yield connection.query("SHOW TABLES LIKE 'users'");
                if (tables.length === 0) {
                    console.log('Database schema not found. Initializing...');
                    // Create tables
                    yield connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            Usernames VARCHAR(255) NOT NULL,
            Emails VARCHAR(255) UNIQUE NOT NULL,
            Passwords VARCHAR(255) NOT NULL,
            ProfilePic VARCHAR(255) DEFAULT 'default.jpg',
            Biography TEXT NULL,
            FacebookLink VARCHAR(255) NULL,
            InstagramLink VARCHAR(255) NULL,
            YoutubeLink VARCHAR(255) NULL,
            GithubLink VARCHAR(255) NULL,
            email_verified_at TIMESTAMP NULL,
            verification_token VARCHAR(255) NULL,
            reset_token VARCHAR(255) NULL
          )
        `);
                    yield connection.query(`
          CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tmdb_id INT UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            poster_path VARCHAR(255),
            release_date DATE,
            overview TEXT
          )
        `);
                    yield connection.query(`
          CREATE TABLE IF NOT EXISTS user_movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            movie_id INT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
          )
        `);
                    yield connection.query(`
          CREATE TABLE IF NOT EXISTS movie_ratings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            movie_id INT,
            rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
            rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
          )
        `);
                    console.log('Database schema initialized successfully!');
                }
                else {
                    console.log('Database schema already exists.');
                }
            }
            catch (error) {
                console.error('Error initializing database schema:', error);
            }
            finally {
                connection.release();
            }
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            console.log('Using mock data mode...');
        }
    });
}
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/movies', movies_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
// Root route for API status
app.get('/', (req, res) => {
    res.json({
        message: 'FilmVault API is running',
        version: '1.0.0',
        status: 'online',
        dbConnection: process.env.USE_MOCK_DATA === 'true' ? 'mock' : 'live'
    });
});
// Catch-all route for debugging non-matched paths
app.get('*', (req, res) => {
    console.log(`Unmatched route: ${req.originalUrl}`);
    // Check if this is a verification or reset request
    if (req.originalUrl.includes('verify-email')) {
        console.log('Redirecting unmatched verify-email request to client');
        return res.redirect(`${process.env.CLIENT_URL}/verify-email`);
    }
    else if (req.originalUrl.includes('reset-password')) {
        console.log('Redirecting unmatched reset-password request to client');
        return res.redirect(`${process.env.CLIENT_URL}/reset-password`);
    }
    res.status(404).json({
        message: 'Route not found',
        requestedPath: req.originalUrl
    });
});
// Error handler middleware
app.use(error_1.errorHandler);
// Start the server after attempting database initialization
initializeDatabase()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API URL: http://localhost:${PORT}`);
        console.log(`Database Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK' : 'LIVE'}`);
    });
})
    .catch(error => {
    console.error('Failed to start server with database initialization:', error);
    // Start server anyway, will use mock data if DB connection fails
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (without database initialization)`);
        console.log(`API URL: http://localhost:${PORT}`);
        console.log(`Database Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK' : 'LIVE'}`);
    });
});
exports.default = app;
