import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../config/db';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE Emails = ?',
      [email]
    );
    
    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );
    
    // Insert new user
    await pool.query(
      'INSERT INTO users (Usernames, Emails, Passwords, verification_token) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, verificationToken]
    );
    
    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const verificationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email for MyFavMovies',
      html: `
        <h1>Welcome to MyFavMovies!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    });
    
    res.status(201).json({ 
      message: 'User registered successfully. Please check your email to verify your account.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(
      token as string, 
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { email: string };
    
    // Update user
    await pool.query(
      'UPDATE users SET email_verified_at = NOW() WHERE Emails = ? AND verification_token = ?',
      [decoded.email, token]
    );
    
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?verified=true`);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Invalid or expired verification token' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE Emails = ?',
      [email]
    );
    
    const user = (users as any[])[0];
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check if email is verified
    if (!user.email_verified_at) {
      return res.status(400).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.Passwords);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.Usernames, email: user.Emails },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.Usernames,
        email: user.Emails,
        profilePic: user.ProfilePic
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE Emails = ?',
      [email]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = (users as any[])[0];
    
    if (user.email_verified_at) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Create new verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );
    
    // Update user with new token
    await pool.query(
      'UPDATE users SET verification_token = ? WHERE Emails = ?',
      [verificationToken, email]
    );
    
    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const verificationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email for MyFavMovies',
      html: `
        <h1>Welcome to MyFavMovies!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    });
    
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE Emails = ?',
      [email]
    );
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );
    
    // Update user with reset token
    await pool.query(
      'UPDATE users SET reset_token = ? WHERE Emails = ?',
      [resetToken, email]
    );
    
    // Send reset email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your MyFavMovies password',
      html: `
        <h1>Reset Your Password</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
    
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { email: string };
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password
    await pool.query(
      'UPDATE users SET Passwords = ?, reset_token = NULL WHERE Emails = ? AND reset_token = ?',
      [hashedPassword, decoded.email, token]
    );
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Invalid or expired reset token' });
  }
});

export default router;