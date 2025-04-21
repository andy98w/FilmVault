import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dns from 'dns';
import https from 'https';
import { IncomingMessage } from 'http';
import pool from '../config/db';
import emailService from '../services/email.service';

const router = express.Router();

// Super simple test ping route
router.get('/ping', (req, res) => {
  res.json({
    pong: true,
    from: 'auth router',
    timestamp: new Date().toISOString(),
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
});

// Simple email test endpoint - no auth required
router.get('/test-email-simple', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    console.log(`SIMPLE TEST: Sending email to ${email}`);
    
    // Send email
    const emailSent = await emailService.sendEmail(
      email as string,
      'FilmVault - Simple Test Email',
      'This is a simple test email from FilmVault to verify email delivery is working.',
      `<div>
        <h1>FilmVault Simple Test</h1>
        <p>This email confirms your email delivery is working.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>`
    );
    
    return res.json({
      message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
      success: emailSent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple email test error:', error);
    return res.status(500).json({
      message: 'Error sending test email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

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

// Simple no-auth test endpoint - accessible to all
router.get('/test-email-noauth', async (req, res) => {
  try {
    // Get email parameter
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    console.log(`NOAUTH TEST: Attempting to send test email to ${email}`);
    
    // Send simple test email
    const emailSent = await emailService.sendEmail(
      email as string,
      'FilmVault - No Auth Test Email',
      'This is a no-auth test email from FilmVault to verify email delivery is working.',
      `<div>Test Email Content</div>`
    );
    
    return res.json({ 
      message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
      success: emailSent
    });
  } catch (error) {
    console.error('No-auth test email error:', error);
    return res.status(500).json({ 
      message: 'Error sending test email', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Test email configuration and sending - admin access only
router.get('/test-email', async (req, res) => {
  try {
    // Extract token from request
    const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }
    
    // Verify token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Get email parameter
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    // Get detailed environment info for troubleshooting
    const envInfo = {
      node_env: process.env.NODE_ENV,
      sendgrid_key_exists: !!process.env.SENDGRID_API_KEY,
      from_email: process.env.FROM_EMAIL || 'noreply@filmvault.space',
      client_url: process.env.CLIENT_URL || 'http://localhost:3000',
      network_info: {
        hostname: require('os').hostname(),
        has_internet: true, // We'll test this
        dns_working: true,  // We'll test this
        sendgrid_reachable: true // We'll test this
      }
    };
    
    // Network connectivity checks
    
    // Check if DNS resolution is working
    try {
      await new Promise<boolean>((resolve, reject) => {
        dns.lookup('api.sendgrid.com', (err: Error | null) => {
          if (err) {
            envInfo.network_info.dns_working = false;
            envInfo.network_info.sendgrid_reachable = false;
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('DNS resolution failed:', error);
    }
    
    // Check if internet is accessible
    try {
      await new Promise<boolean>((resolve, reject) => {
        https.get('https://www.google.com', (res: IncomingMessage) => {
          if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
            resolve(true);
          } else {
            envInfo.network_info.has_internet = false;
            reject(new Error(`Status code: ${res.statusCode}`));
          }
        }).on('error', (err: Error) => {
          envInfo.network_info.has_internet = false;
          reject(err);
        });
      });
    } catch (error) {
      console.error('Internet connectivity check failed:', error);
    }
    
    // Check if SendGrid is reachable
    try {
      await new Promise<boolean>((resolve, reject) => {
        https.get('https://api.sendgrid.com', (res: IncomingMessage) => {
          if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 404) {
            // 404 is expected since we're not hitting a valid endpoint
            resolve(true);
          } else {
            envInfo.network_info.sendgrid_reachable = false;
            reject(new Error(`Status code: ${res.statusCode}`));
          }
        }).on('error', (err: Error) => {
          envInfo.network_info.sendgrid_reachable = false;
          reject(err);
        });
      });
    } catch (error) {
      console.error('SendGrid connectivity check failed:', error);
    }
    
    // Send test email
    console.log('Sending test email to:', email);
    const emailSent = await emailService.sendEmail(
      email as string,
      'FilmVault - Test Email',
      'This is a test email from FilmVault to verify email delivery is working.',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #89C9B8;">FilmVault Test Email</h1>
        <p>This is a test email sent from FilmVault to verify email delivery is working.</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>`
    );
    
    return res.json({ 
      message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
      environment: envInfo
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ 
      message: 'Error sending test email', 
      error: error instanceof Error ? error.message : String(error) 
    });
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
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
    
    // Log detailed information about the verification process (for debugging)
    console.log('==== User Registration - Verification Information ====');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Verification token: ${verificationToken}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('====================================================');
    
    // In development mode, include verification info in the response
    const isDevelopment = process.env.NODE_ENV === 'development';
    const devInfo = isDevelopment ? {
      verification_token: verificationToken,
      verification_url: verificationUrl,
      notes: "Development mode: Use this URL to verify your account"
    } : undefined;
    
    // CRITICAL FIX: Complete all database operations before sending email
    // This prevents the serverless function from terminating before email is sent
    
    // Create response data object upfront
    const responseData = { 
      message: 'User registered successfully. Please check your email for a verification link.',
      ...(devInfo && { dev_info: devInfo })
    };
    
    // Send response immediately to client
    res.status(201).json(responseData);
    
    // IMPORTANT: Now we can send the email AFTER sending the response
    // This ensures the response is sent quickly, but the function stays alive long enough
    // to complete the email sending process
    try {
      console.log(`[${process.env.NODE_ENV}] Attempting to send verification email to ${email} after response sent`);
      
      const emailSent = await emailService.sendVerificationEmail(email, username, verificationToken);
      
      if (emailSent) {
        console.log(`Registration email successfully sent to ${email}`);
      } else {
        console.warn(`⚠️ Email sending failed for ${email} - REASON: sendVerificationEmail returned false`);
        console.warn(`Environment: ${process.env.NODE_ENV}, From: ${process.env.FROM_EMAIL || 'NOT_SET'}`);
      }
    } catch (emailError) {
      // Log detailed error information for debugging
      console.error(`🚨 Exception while sending verification email to ${email}:`, emailError);
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
      console.log(`User ${email} attempted to login but email is not verified`);
      return res.status(400).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: email
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
    
    // Create response data objects upfront
    const productionResponse = { 
      message: 'Verification email has been sent. Please check your email.',
    };
    
    const devResponse = process.env.NODE_ENV === 'development' ? {
      message: 'Verification email has been sent. Please check your email.',
      dev_info: {
        note: 'Development mode: Use this information to verify your account',
        verification_token: verificationToken,
        verification_url: verificationUrl,
        instructions: 'Either click the verification URL or copy the token and use it on the verification page.'
      }
    } : productionResponse;
    
    // Send response immediately to client
    if (process.env.NODE_ENV === 'production') {
      res.json(productionResponse);
    } else {
      res.json(devResponse);
    }
    
    // IMPORTANT: Now we can send the email AFTER sending the response
    // This ensures the response is sent quickly, but the function stays alive long enough
    // to complete the email sending process
    try {
      console.log(`[${process.env.NODE_ENV}] Attempting to resend verification email to ${email} after response sent`);
      
      const emailSent = await emailService.sendVerificationEmail(email, user.Usernames, verificationToken);
      
      if (emailSent) {
        console.log(`Verification email successfully resent to ${email}`);
      } else {
        console.warn(`⚠️ Resend verification email failed for ${email} - REASON: sendVerificationEmail returned false`);
        console.warn(`Environment: ${process.env.NODE_ENV}, From: ${process.env.FROM_EMAIL || 'NOT_SET'}`);
      }
    } catch (emailError) {
      // Log detailed error information for debugging
      console.error(`🚨 Exception while resending verification email to ${email}:`, emailError);
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
    
    // Create standard response 
    const standardResponse = { 
      message: 'If a user with that email exists, a password reset link has been sent to their email.',
    };
    
    // In development mode, include token for testing
    const devResponse = process.env.NODE_ENV === 'development' ? {
      ...standardResponse,
      dev_info: {
        note: 'Development mode: Use this information to reset your password',
        reset_token: resetToken,
        reset_url: resetUrl,
        instructions: 'Either click the reset URL or copy the token and use it on the reset password page.'
      }
    } : standardResponse;
    
    // Send response immediately
    if (process.env.NODE_ENV === 'production') {
      res.json(standardResponse);
    } else {
      res.json(devResponse);
    }
    
    // IMPORTANT: Now we can send the email AFTER sending the response
    // This ensures the response is sent quickly, but the function stays alive long enough
    // to complete the email sending process
    try {
      console.log(`[${process.env.NODE_ENV}] Attempting to send password reset email to ${email} after response sent`);
      
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        console.log(`Password reset email successfully sent to ${email}`);
      } else {
        console.warn(`⚠️ Password reset email failed for ${email} - REASON: sendPasswordResetEmail returned false`);
        console.warn(`Environment: ${process.env.NODE_ENV}, From: ${process.env.FROM_EMAIL || 'NOT_SET'}`);
      }
    } catch (emailError) {
      // Log detailed error information for debugging
      console.error(`🚨 Exception while sending password reset email to ${email}:`, emailError);
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