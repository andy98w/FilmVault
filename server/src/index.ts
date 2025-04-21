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
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`Running in ${nodeEnv} environment`);

if (nodeEnv === 'production') {
  // Try to load from absolute path first (for production server deployment)
  const absolutePath = path.join(__dirname, '../.env.production');
  if (require('fs').existsSync(absolutePath)) {
    console.log(`Loading environment from absolute path: ${absolutePath}`);
    dotenv.config({ path: absolutePath });
  } else {
    // Fallback to relative path
    console.log('Loading environment from relative path: .env.production');
    dotenv.config({ path: '.env.production' });
  }
} else {
  // Development environment
  const devPath = path.join(__dirname, '../.env.development');
  if (require('fs').existsSync(devPath)) {
    console.log(`Loading environment from: ${devPath}`);
    dotenv.config({ path: devPath });
  } else {
    console.log('Loading environment from: .env.development');
    dotenv.config({ path: '.env.development' });
  }
}
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Server URL: ${process.env.SERVER_URL}`);
console.log(`Client URL: ${process.env.CLIENT_URL}`);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001; // Default to 3001 to avoid conflicts

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://filmvault.space', // Use domain name instead of IP
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  credentials: true // Allow cookies to be sent with requests
}));

app.use(express.json());
app.use(cookieParser());
app.use('/profile-pictures', express.static(path.join(__dirname, '../profile-pictures')));

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

// Register routes
// Based on our testing, these routes will be accessible at /api/auth/*, /api/movies/*, etc.
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Root route for API status
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'FilmVault API is running',
    version: '1.0.0',
    status: 'online'
  });
});


// Catch-all route for redirecting verification and password reset requests
app.all('*', (req: Request, res: Response) => {
  // Check if this is a verification or reset request
  if (req.originalUrl.includes('verify-email')) {
    return res.redirect(`${process.env.CLIENT_URL}/verify-email`);
  } else if (req.originalUrl.includes('reset-password')) {
    return res.redirect(`${process.env.CLIENT_URL}/reset-password`);
  }
  
  res.status(404).json({
    message: 'Route not found'
  });
});

// Error handler middleware
app.use(errorHandler);

// Start the server after attempting database initialization
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to start server with database initialization:', error);
    
    // Start server anyway, will use mock data if DB connection fails
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });

export default app;