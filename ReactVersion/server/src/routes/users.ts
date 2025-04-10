import express from 'express';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get top users by contributions
router.get('/top', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT users.id, users.Usernames, users.ProfilePic, ' +
      'COUNT(user_movies.MovieID) as movie_count, ' +
      'COUNT(movie_ratings.Rating) as rating_count ' +
      'FROM users ' +
      'LEFT JOIN user_movies ON users.id = user_movies.UserID ' +
      'LEFT JOIN movie_ratings ON users.id = movie_ratings.UserID ' +
      'GROUP BY users.id ' +
      'ORDER BY movie_count DESC ' +
      'LIMIT 10'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user info
    const [users] = await pool.query(
      'SELECT id, Usernames, ProfilePic FROM users WHERE id = ?',
      [id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Get user's movies with ratings
    const [movies] = await pool.query(
      'SELECT movies.*, movie_ratings.Rating ' +
      'FROM user_movies ' +
      'JOIN movies ON user_movies.MovieID = movies.MovieID ' +
      'LEFT JOIN movie_ratings ON user_movies.MovieID = movie_ratings.MovieID AND movie_ratings.UserID = ? ' +
      'WHERE user_movies.UserID = ?',
      [id, id]
    );
    
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
    
    // Get user info
    const [users] = await pool.query(
      'SELECT id, Usernames, Emails, ProfilePic FROM users WHERE id = ?',
      [userId]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json((users as any[])[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (requires authentication)
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { username, profile_pic } = req.body;
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

export default router;