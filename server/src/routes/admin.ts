import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/admin';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, Usernames, Emails, ProfilePic, email_verified_at, is_admin, created_at FROM users ORDER BY id DESC'
    );
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the user exists
    const [users] = await pool.query(
      'SELECT id, Usernames, Emails FROM users WHERE id = ?',
      [id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Don't allow admins to delete other admins for safety
    const [adminCheck] = await pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [id]
    );
    
    if ((adminCheck as any[])[0]?.is_admin) {
      return res.status(403).json({ 
        message: 'Cannot delete admin users through the API for security reasons' 
      });
    }
    
    // Begin transaction to delete all user data
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query('DELETE FROM movie_ratings WHERE user_id = ?', [id]);
      await connection.query('DELETE FROM user_movies WHERE user_id = ?', [id]);
      await connection.query('DELETE FROM users WHERE id = ?', [id]);
      
      await connection.commit();
      
      res.json({ 
        message: `User ${user.Usernames} (ID: ${id}) has been deleted successfully`,
        deletedUser: {
          id: user.id,
          username: user.Usernames,
          email: user.Emails
        }
      });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Make a user an admin (admin only)
router.post('/users/:id/make-admin', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the user exists
    const [users] = await pool.query(
      'SELECT id, Usernames FROM users WHERE id = ?',
      [id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Update user to admin status
    await pool.query(
      'UPDATE users SET is_admin = 1 WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: `User ${user.Usernames} (ID: ${id}) has been promoted to admin`,
      user: {
        id: user.id,
        username: user.Usernames,
        isAdmin: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove admin status from a user (admin only)
router.post('/users/:id/remove-admin', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow removal of admin status from the current user
    if (id === req.user?.id.toString()) {
      return res.status(403).json({ 
        message: 'You cannot remove your own admin privileges' 
      });
    }
    
    // Check if the user exists
    const [users] = await pool.query(
      'SELECT id, Usernames FROM users WHERE id = ?',
      [id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Update user to remove admin status
    await pool.query(
      'UPDATE users SET is_admin = 0 WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: `Admin privileges removed from user ${user.Usernames} (ID: ${id})`,
      user: {
        id: user.id,
        username: user.Usernames,
        isAdmin: false
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;