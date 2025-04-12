import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

// Import the existing UserPayload interface from auth middleware
import { UserPayload } from './auth';

/**
 * Middleware to authenticate admin users
 * First authenticates the token, then checks if the user is an admin
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
    
    // Check if user exists and is an admin
    const [users] = await pool.query(
      'SELECT id, Usernames, Emails, is_admin FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    // Check if user is an admin
    if (!user.is_admin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // Set user in request object
    req.user = {
      id: user.id,
      username: user.Usernames,
      email: user.Emails,
      isAdmin: true
    } as UserPayload;
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};