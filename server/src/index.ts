import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import pool from './config/db';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/error';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.development' });
}
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Server URL: ${process.env.SERVER_URL}`);
console.log(`Client URL: ${process.env.CLIENT_URL}`);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://132.145.111.110', // Explicitly set the client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  credentials: true // Allow cookies to be sent with requests
}));

// Log CORS configuration
console.log('CORS configured with origin:', process.env.CLIENT_URL || 'http://132.145.111.110');
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// Log cookie parsing setup
console.log('Cookie parsing enabled');
console.log('Client URL:', process.env.CLIENT_URL || 'Not set (allowing all origins)');

// Serve profile pictures statically for local development
app.use('/profile-pictures', express.static(path.join(__dirname, '../profile-pictures')));

// Log middleware configuration
console.log('CORS configuration:', {
  origin: true,
  credentials: true
});

// Database initialization function
async function initializeDatabase() {
  try {
    console.log('Checking if database schema needs initialization...');
    const connection = await pool.getConnection();
    
    try {
      // Check if users table exists
      const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
      
      if (tables.length === 0) {
        console.log('Database schema not found. Initializing...');
        
        // Create tables
        await connection.query(`
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
        
        await connection.query(`
          CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tmdb_id INT UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            poster_path VARCHAR(255),
            release_date DATE,
            overview TEXT
          )
        `);
        
        await connection.query(`
          CREATE TABLE IF NOT EXISTS user_movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            movie_id INT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
          )
        `);
        
        await connection.query(`
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
      } else {
        console.log('Database schema already exists.');
      }
    } catch (error) {
      console.error('Error initializing database schema:', error);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Using mock data mode...');
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Root route for API status
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'FilmVault API is running',
    version: '1.0.0',
    status: 'online',
    dbConnection: process.env.USE_MOCK_DATA === 'true' ? 'mock' : 'live'
  });
});

// Catch-all route for debugging non-matched paths
app.get('*', (req: Request, res: Response) => {
  console.log(`Unmatched route: ${req.originalUrl}`);
  
  // Check if this is a verification or reset request
  if (req.originalUrl.includes('verify-email')) {
    console.log('Redirecting unmatched verify-email request to client');
    return res.redirect(`${process.env.CLIENT_URL}/verify-email`);
  } else if (req.originalUrl.includes('reset-password')) {
    console.log('Redirecting unmatched reset-password request to client');
    return res.redirect(`${process.env.CLIENT_URL}/reset-password`);
  }
  
  res.status(404).json({
    message: 'Route not found',
    requestedPath: req.originalUrl
  });
});

// Error handler middleware
app.use(errorHandler);

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

export default app;