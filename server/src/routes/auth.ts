import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import emailService from '../services/email.service';

const router = express.Router();

// Simple test endpoints
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    
    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    console.log('Tables query result:', tables);
    
    if (tables.length === 0) {
      return res.status(500).json({ message: 'Users table does not exist' });
    }
    
    connection.release();
    return res.json({ message: 'Database connection successful' });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({ message: 'Database connection failed', error: error instanceof Error ? error.message : String(error) });
  }
});

// Simple registration test
router.post('/test-register', async (req, res) => {
  try {
    console.log('Test registration attempt:', { ...req.body, password: '[REDACTED]' });
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Insert directly without hashing - FOR TESTING ONLY
    try {
      const result = await pool.query(
        'INSERT INTO users (Usernames, Emails, Passwords) VALUES (?, ?, ?)',
        [username, email, password] // Using plaintext password for test
      );
      console.log('Test user insertion result:', result);
      return res.status(201).json({ message: 'Test user created successfully' });
    } catch (insertError) {
      console.error('Test registration DB error:', insertError);
      return res.status(500).json({ 
        message: 'Test registration failed', 
        error: insertError instanceof Error ? insertError.message : String(insertError)
      });
    }
  } catch (error) {
    console.error('Test registration error:', error);
    return res.status(500).json({ 
      message: 'Test registration failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { ...req.body, password: '[REDACTED]' });
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.error('Missing required fields:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    console.log('Checking if user exists...');
    // Check if user already exists
    try {
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE Emails = ?',
        [email]
      );
      
      console.log('Existing users query result:', { count: (existingUsers as any[]).length });
      
      if ((existingUsers as any[]).length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
    } catch (dbError) {
      console.error('Database error when checking existing users:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
    
    console.log('Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create verification token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // 24 hour expiration
    );
    
    // Insert new user with verification token
    console.log('Inserting new user...');
    try {
      const result = await pool.query(
        'INSERT INTO users (Usernames, Emails, Passwords, verification_token) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, verificationToken]
      );
      console.log('User insertion result:', result);
    } catch (insertError) {
      console.error('Database error when inserting new user:', insertError);
      return res.status(500).json({ message: 'Failed to create user account' });
    }
    
    // Create verification URL
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    // Log detailed information about the verification process (for debugging)
    console.log('==== User Registration - Verification Information ====');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Verification token: ${verificationToken}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('====================================================');
    
    try {
      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(email, username, verificationToken);
      
      if (emailSent) {
        res.status(201).json({ 
          message: 'User registered successfully. Please check your email for a verification link.',
        });
      } else {
        // Fallback if email couldn't be sent
        console.warn('Email sending failed, using fallback method');
        res.status(201).json({ 
          message: 'User registered successfully. Please verify your email with the link below.',
          dev_info: {
            note: 'Email delivery failed. Use this information to verify your account',
            verification_token: verificationToken,
            verification_url: verificationUrl,
            instructions: 'Either click the verification URL or copy the token and use it on the verification page.'
          }
        });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(201).json({ 
        message: 'User registered but there was an issue sending the verification email. Please use the verification token below.',
        dev_info: {
          verification_token: verificationToken,
          verification_url: verificationUrl
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Provide more detailed error message
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = `Server error: ${error.message}`;
    }
    res.status(500).json({ message: errorMessage });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Check JWT_SECRET environment variable
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token as string, 
        process.env.JWT_SECRET
      ) as { email: string };
      
      // Find user by verification token
      const [users] = await pool.query(
        'SELECT * FROM users WHERE verification_token = ? AND Emails = ?',
        [token, decoded.email]
      );
      
      if ((users as any[]).length === 0) {
        return res.status(400).json({ message: 'Invalid verification token' });
      }
      
      // Update user verification status
      await pool.query(
        'UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE Emails = ? AND verification_token = ?',
        [decoded.email, token]
      );
      
      // Return success response
      return res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Server error during verification' });
  }
});

// Handle email verification link from email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      console.log('Email verification: No token found in query parameters');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?error=Token is required`);
    }
    
    console.log(`Email verification: Redirecting to client with token: ${token}`);
    
    // Redirect to the front-end verification page
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
  } catch (error) {
    console.error('Email verification redirect error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?error=Server error`);
  }
});

// Handle password reset link from email
router.get('/reset-password', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      console.log('Password reset: No token found in query parameters');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?error=Token is required`);
    }
    
    console.log(`Password reset: Redirecting to client with token: ${token}`);
    
    // Redirect to the front-end reset password page
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
  } catch (error) {
    console.error('Password reset redirect error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?error=Server error`);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with admin status
    const [users] = await pool.query(
      'SELECT id, Usernames, Emails, Passwords, ProfilePic, email_verified_at, is_admin FROM users WHERE Emails = ?',
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
    
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Generate JWT token with admin status
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.Usernames, 
        email: user.Emails,
        isAdmin: user.is_admin === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set JWT token in HttpOnly cookie (more secure than localStorage)
    res.cookie('auth_token', token, {
      httpOnly: true, // Can't be accessed by JavaScript
      secure: true, // Required for SameSite=None cookies
      sameSite: 'none', // Always allow cross-site for API/client separation
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/' // Ensure cookie is available across the entire domain
    });
    
    console.log('Set auth cookie with options:', {
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    
    // Also return token in response for backward compatibility
    res.json({
      token, // For backward compatibility with existing clients
      user: {
        id: user.id,
        username: user.Usernames,
        email: user.Emails,
        profilePic: user.ProfilePic,
        isAdmin: user.is_admin === 1
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
    
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Create new verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Update the verification token in the database
    await pool.query(
      'UPDATE users SET verification_token = ? WHERE Emails = ?',
      [verificationToken, email]
    );
    
    // Create verification URL
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    // Log detailed information about the verification process (for debugging)
    console.log('==== Resend Verification - Information ====');
    console.log(`Email: ${email}`);
    console.log(`Verification token: ${verificationToken}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('===========================================');
    
    try {
      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(email, user.Usernames, verificationToken);
      
      if (emailSent) {
        res.json({ 
          message: 'Verification email has been sent. Please check your email.',
        });
      } else {
        // Fallback if email couldn't be sent
        console.warn('Email sending failed, using fallback method');
        res.json({ 
          message: 'Could not send verification email. Please use the link below to verify your account.',
          dev_info: {
            note: 'Email delivery failed. Use this information to verify your account',
            verification_token: verificationToken,
            verification_url: verificationUrl,
            instructions: 'Either click the verification URL or copy the token and use it on the verification page.'
          }
        });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.json({ 
        message: 'Failed to send verification email. Please use the verification link below.',
        dev_info: {
          verification_token: verificationToken,
          verification_url: verificationUrl
        }
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE Emails = ?',
      [email]
    );
    
    // For security reasons, don't tell the client if the user exists or not
    // Just return a success message either way
    if ((users as any[]).length === 0) {
      return res.json({ 
        message: 'If a user with that email exists, a password reset link will be sent to their email' 
      });
    }
    
    const user = (users as any[])[0];
    
    // Check JWT_SECRET environment variable
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { email, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Update user with reset token
    await pool.query(
      'UPDATE users SET reset_token = ? WHERE Emails = ?',
      [resetToken, email]
    );
    
    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Log detailed information about the reset process (for debugging)
    console.log('==== Password Reset - Information ====');
    console.log(`Email: ${email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=====================================');
    
    try {
      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        // For security reasons, don't reveal whether a user exists or not
        res.json({ 
          message: 'If a user with that email exists, a password reset link has been sent to their email.',
        });
      } else {
        // Fallback if email couldn't be sent, but only in development mode
        console.warn('Email sending failed, using fallback method');
        res.json({ 
          message: 'If a user with that email exists, a password reset link has been sent to their email.',
          dev_info: {
            note: 'Email delivery failed. Use this information to reset your password',
            reset_token: resetToken,
            reset_url: resetUrl,
            instructions: 'Either click the reset URL or copy the token and use it on the reset password page.'
          }
        });
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Don't expose the error details to the client for security reasons
      res.json({ 
        message: 'If a user with that email exists, a password reset link has been sent to their email.',
        dev_info: {
          note: 'Email delivery failed. Use this information to reset your password',
          reset_token: resetToken,
          reset_url: resetUrl
        }
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET
      ) as { email: string, userId: number };
      
      // Find user by reset token
      const [users] = await pool.query(
        'SELECT * FROM users WHERE reset_token = ? AND Emails = ?',
        [token, decoded.email]
      );
      
      if ((users as any[]).length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user password and clear reset token
      await pool.query(
        'UPDATE users SET Passwords = ?, reset_token = NULL WHERE Emails = ? AND reset_token = ?',
        [hashedPassword, decoded.email, token]
      );
      
      // Clear auth cookies to invalidate all existing sessions for security
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
      
      console.log('Password reset: Cleared auth cookie to invalidate sessions');
      
      res.json({ message: 'Password has been reset successfully. You will need to log in with your new password.' });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  
  console.log('Cleared auth cookie');
  
  res.json({ message: 'Logged out successfully' });
});

export default router;