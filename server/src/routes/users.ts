import express from 'express';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import storageService from '../services/storage.service';

// Add custom Request type with file property for multer
interface MulterRequest extends express.Request {
  file?: Express.Multer.File;
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (
    req: Express.Request, 
    file: Express.Multer.File, 
    cb: multer.FileFilterCallback
  ) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only! (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get top users by contributions
router.get('/top', async (req, res) => {
  try {
    console.log('Fetching top users...');
    
    // First, let's check the actual column names in the users table
    console.log('Checking users table structure...');
    const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
    console.log('Users table columns:', userColumns);
    
    // Check user_movies table structure
    console.log('Checking user_movies table structure...');
    const [userMoviesColumns] = await pool.query('SHOW COLUMNS FROM user_movies');
    console.log('user_movies table columns:', userMoviesColumns);
    
    // Check movie_ratings table structure
    console.log('Checking movie_ratings table structure...');
    const [ratingsColumns] = await pool.query('SHOW COLUMNS FROM movie_ratings');
    console.log('movie_ratings table columns:', ratingsColumns);
    
    // Use only lowercase column names for consistency
    const [rows] = await pool.query(
      'SELECT users.id, users.Usernames, users.ProfilePic, ' +
      'COUNT(DISTINCT user_movies.movie_id) as movie_count, ' +
      'COUNT(DISTINCT movie_ratings.id) as rating_count ' +
      'FROM users ' +
      'LEFT JOIN user_movies ON users.id = user_movies.user_id ' +
      'LEFT JOIN movie_ratings ON users.id = movie_ratings.user_id ' +
      'GROUP BY users.id ' +
      'ORDER BY movie_count DESC ' +
      'LIMIT 10'
    );
    
    console.log(`Found ${(rows as any[]).length} top users`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching top users:', error);
    if (error instanceof Error) {
      console.error(error.message);
      // Send detailed error info for debugging
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user info including biography and social media
    const [users] = await pool.query(
      'SELECT id, Usernames, ProfilePic, Biography, FacebookLink, InstagramLink, YoutubeLink, GithubLink FROM users WHERE id = ?',
      [id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Log database schema first
    console.log('Checking movie tables structure for user profile...');
    const [movieColumns] = await pool.query('SHOW COLUMNS FROM movies');
    console.log('Movies table columns:', movieColumns);
    
    // Get user's movies with ratings using the correct column names
    console.log(`Fetching movies for user ID ${id}...`);
    let movies;
    try {
      // Query for user's movies
      [movies] = await pool.query(
        'SELECT DISTINCT m.id, m.tmdb_id, m.title, m.poster_path, m.overview, m.release_date, mr.rating ' +
        'FROM user_movies um ' +
        'JOIN movies m ON um.movie_id = m.id ' +
        'LEFT JOIN movie_ratings mr ON m.id = mr.movie_id AND mr.user_id = ? ' +
        'WHERE um.user_id = ?',
        [id, id]
      );
      console.log(`Found ${(movies as any[]).length} movies for user ${id}`);
      
      // Keep consistent lowercase naming but still transform for client
      const transformedMovies = (movies as any[]).map(movie => ({
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
    } catch (movieQueryError) {
      console.error('Error fetching user movies:', movieQueryError);
      throw movieQueryError;
    }
    
    res.json({
      user,
      movies
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log(`Fetching current user profile for user ID ${userId}...`);
    
    if (!userId) {
      console.error('User ID not found in authentication token');
      return res.status(401).json({ message: 'Authentication error: user ID not found in token' });
    }
    
    // Get user info
    try {
      const [users] = await pool.query(
        'SELECT id, Usernames, Emails, ProfilePic, Biography, FacebookLink, InstagramLink, YoutubeLink, GithubLink, LinkedInLink FROM users WHERE id = ?',
        [userId]
      );
      
      console.log(`Found ${(users as any[]).length} users with ID ${userId}`);
      
      if ((users as any[]).length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json((users as any[])[0]);
    } catch (userQueryError) {
      console.error('Database error fetching current user:', userQueryError);
      throw userQueryError;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (requires authentication)
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { 
      username, 
      profile_pic, 
      biography, 
      facebook_link, 
      instagram_link, 
      youtube_link, 
      github_link,
      linkedin_link
    } = req.body;
    
    const userId = req.user?.id;
    
    const updates: any = {};
    const params: any[] = [];
    
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
    
    await pool.query(
      `UPDATE users SET ${updateQuery} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (requires authentication)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user?.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user's current password
    const [users] = await pool.query(
      'SELECT Passwords FROM users WHERE id = ?',
      [userId]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = (users as any[])[0];
    
    // Import bcrypt dynamically
    const bcrypt = require('bcrypt');
    
    // Compare current password with stored hash
    const isPasswordCorrect = await bcrypt.compare(current_password, user.Passwords);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Update password in database
    await pool.query(
      'UPDATE users SET Passwords = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture (requires authentication)
router.post('/upload-profile-picture', authenticateToken, upload.single('profilePicture'), async (req: MulterRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const pictureUrl = await storageService.uploadProfilePicture(
      userId,
      req.file.buffer,
      req.file.originalname
    );
    
    // Get user's current profile picture URL
    const [users] = await pool.query(
      'SELECT ProfilePic FROM users WHERE id = ?',
      [userId]
    );
    
    const user = (users as any[])[0];
    const currentProfilePic = user.ProfilePic;
    
    // Update user's profile picture in database
    await pool.query(
      'UPDATE users SET ProfilePic = ? WHERE id = ?',
      [pictureUrl, userId]
    );
    
    // Delete previous profile picture if it exists
    if (currentProfilePic && 
        (currentProfilePic.includes('objectstorage') || 
        currentProfilePic.includes(storageService.getBucketName()))) {
      try {
        await storageService.deleteProfilePicture(currentProfilePic);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
      }
    }
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      profilePicUrl: pictureUrl
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Images Only')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Failed to upload profile picture' });
  }
});

// Remove profile picture
router.delete('/remove-profile-picture', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Get current profile picture URL
    const [userRows] = await pool.query(
      'SELECT ProfilePic FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    const currentProfilePic = userRows[0]?.ProfilePic;
    
    // Delete the profile picture from storage if it exists and is not the default
    if (currentProfilePic && !currentProfilePic.includes('default.jpg')) {
      try {
        await storageService.deleteProfilePicture(currentProfilePic);
      } catch (deleteError) {
        console.error('Error deleting profile picture:', deleteError);
      }
    }
    
    // Update user's record to remove the profile picture reference
    await pool.query(
      'UPDATE users SET ProfilePic = NULL WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ message: 'Failed to remove profile picture' });
  }
});

export default router;