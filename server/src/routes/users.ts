import express from 'express';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

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
    
    // Use the correct column names based on the actual database schema
    const [rows] = await pool.query(
      'SELECT users.id, users.Usernames, users.ProfilePic, ' +
      'COUNT(user_movies.movie_id) as movie_count, ' +
      'COUNT(movie_ratings.rating) as rating_count ' +
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
      [movies] = await pool.query(
        'SELECT movies.*, movie_ratings.rating ' +
        'FROM user_movies ' +
        'JOIN movies ON user_movies.movie_id = movies.id ' +
        'LEFT JOIN movie_ratings ON user_movies.movie_id = movie_ratings.movie_id AND movie_ratings.user_id = ? ' +
        'WHERE user_movies.user_id = ?',
        [id, id]
      );
      console.log(`Found ${(movies as any[]).length} movies for user ${id}`);
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
        'SELECT id, Usernames, Emails, ProfilePic, Biography, FacebookLink, InstagramLink, YoutubeLink, GithubLink FROM users WHERE id = ?',
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
      github_link 
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

export default router;