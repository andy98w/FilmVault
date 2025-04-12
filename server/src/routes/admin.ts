import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/admin';

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all users...');
    
    const [rows] = await pool.query(
      'SELECT id, Usernames, Emails, ProfilePic, email_verified_at, is_admin, created_at FROM users ORDER BY id DESC'
    );
    
    console.log(`Found ${(rows as any[]).length} users`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user (admin only)
 * @access  Admin
 */
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
      
      console.log(`Deleting ratings for user ${id}...`);
      await connection.query('DELETE FROM movie_ratings WHERE user_id = ?', [id]);
      
      console.log(`Deleting movies for user ${id}...`);
      await connection.query('DELETE FROM user_movies WHERE user_id = ?', [id]);
      
      console.log(`Deleting user ${id}...`);
      await connection.query('DELETE FROM users WHERE id = ?', [id]);
      
      await connection.commit();
      
      console.log(`User ${id} (${user.Usernames}) successfully deleted`);
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
      console.error('Transaction error:', txError);
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/users/:id/make-admin
 * @desc    Make a user an admin (admin only)
 * @access  Admin
 */
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
    
    console.log(`User ${id} (${user.Usernames}) promoted to admin`);
    res.json({ 
      message: `User ${user.Usernames} (ID: ${id}) has been promoted to admin`,
      user: {
        id: user.id,
        username: user.Usernames,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/users/:id/remove-admin
 * @desc    Remove admin status from a user (admin only)
 * @access  Admin
 */
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
    
    console.log(`Admin privileges removed from user ${id} (${user.Usernames})`);
    res.json({ 
      message: `Admin privileges removed from user ${user.Usernames} (ID: ${id})`,
      user: {
        id: user.id,
        username: user.Usernames,
        isAdmin: false
      }
    });
  } catch (error) {
    console.error('Error removing admin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;