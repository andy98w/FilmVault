"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const router = express_1.default.Router();
// Simple test endpoints
router.get('/test-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Testing database connection...');
        const connection = yield db_1.default.getConnection();
        console.log('Database connection successful');
        // Check if users table exists
        const [tables] = yield connection.query("SHOW TABLES LIKE 'users'");
        console.log('Tables query result:', tables);
        if (tables.length === 0) {
            return res.status(500).json({ message: 'Users table does not exist' });
        }
        connection.release();
        return res.json({ message: 'Database connection successful' });
    }
    catch (error) {
        console.error('Database test error:', error);
        return res.status(500).json({ message: 'Database connection failed', error: error instanceof Error ? error.message : String(error) });
    }
}));
// Simple registration test
router.post('/test-register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Test registration attempt:', Object.assign(Object.assign({}, req.body), { password: '[REDACTED]' }));
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Insert directly without hashing - FOR TESTING ONLY
        try {
            const result = yield db_1.default.query('INSERT INTO users (Usernames, Emails, Passwords) VALUES (?, ?, ?)', [username, email, password] // Using plaintext password for test
            );
            console.log('Test user insertion result:', result);
            return res.status(201).json({ message: 'Test user created successfully' });
        }
        catch (insertError) {
            console.error('Test registration DB error:', insertError);
            return res.status(500).json({
                message: 'Test registration failed',
                error: insertError instanceof Error ? insertError.message : String(insertError)
            });
        }
    }
    catch (error) {
        console.error('Test registration error:', error);
        return res.status(500).json({
            message: 'Test registration failed',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Register a new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Registration attempt:', Object.assign(Object.assign({}, req.body), { password: '[REDACTED]' }));
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
            const [existingUsers] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
            console.log('Existing users query result:', { count: existingUsers.length });
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'User already exists' });
            }
        }
        catch (dbError) {
            console.error('Database error when checking existing users:', dbError);
            return res.status(500).json({ message: 'Database error' });
        }
        console.log('Hashing password...');
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Create verification token
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        const verificationToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' } // 24 hour expiration
        );
        // Insert new user with verification token
        console.log('Inserting new user...');
        try {
            const result = yield db_1.default.query('INSERT INTO users (Usernames, Emails, Passwords, verification_token) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, verificationToken]);
            console.log('User insertion result:', result);
        }
        catch (insertError) {
            console.error('Database error when inserting new user:', insertError);
            return res.status(500).json({ message: 'Failed to create user account' });
        }
        // Since we're having issues with email services, let's enhance the development mode
        // with a clear verification URL and guidance
        console.log('Using enhanced development mode for email verification');
        // Create verification URL
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        // Log detailed information about the verification process
        console.log('==== User Registration - Verification Information ====');
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Verification token: ${verificationToken}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('====================================================');
        // For development, we'll provide two options:
        // 1. Auto-verify the user (skipping email verification)
        // 2. Return the verification link in the response
        try {
            // Don't auto-verify the user, so we can test the verification flow
            // Instead, return the verification URL in the response
            res.status(201).json({
                message: 'User registered successfully. In production, you would receive an email with a verification link.',
                dev_info: {
                    note: 'DEVELOPMENT MODE: Use this information to verify your account',
                    verification_token: verificationToken,
                    verification_url: verificationUrl,
                    instructions: 'Either click the verification URL or copy the token and use it on the verification page.'
                }
            });
        }
        catch (error) {
            console.error('Error in development mode verification:', error);
            res.status(201).json({
                message: 'User registered but there was an issue. Please use the verification token below.',
                dev_info: {
                    verification_token: verificationToken,
                    verification_url: verificationUrl
                }
            });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        // Provide more detailed error message
        let errorMessage = 'Server error';
        if (error instanceof Error) {
            errorMessage = `Server error: ${error.message}`;
        }
        res.status(500).json({ message: errorMessage });
    }
}));
// Verify email
router.post('/verify-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Find user by verification token
            const [users] = yield db_1.default.query('SELECT * FROM users WHERE verification_token = ? AND Emails = ?', [token, decoded.email]);
            if (users.length === 0) {
                return res.status(400).json({ message: 'Invalid verification token' });
            }
            // Update user verification status
            yield db_1.default.query('UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE Emails = ? AND verification_token = ?', [decoded.email, token]);
            // Return success response
            return res.json({ message: 'Email verified successfully! You can now log in.' });
        }
        catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }
    }
    catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ message: 'Server error during verification' });
    }
}));
// Handle email verification link from email
router.get('/verify-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?error=Token is required`);
        }
        // Redirect to the front-end verification page
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
    }
    catch (error) {
        console.error('Email verification redirect error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?error=Server error`);
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user with admin status
        const [users] = yield db_1.default.query('SELECT id, Usernames, Emails, Passwords, ProfilePic, email_verified_at, is_admin FROM users WHERE Emails = ?', [email]);
        const user = users[0];
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
        const isMatch = yield bcrypt_1.default.compare(password, user.Passwords);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Check if JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        // Generate JWT token with admin status
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.Usernames,
            email: user.Emails,
            isAdmin: user.is_admin === 1
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.Usernames,
                email: user.Emails,
                profilePic: user.ProfilePic,
                isAdmin: user.is_admin === 1
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Resend verification email
router.post('/resend-verification', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // Find user
        const [users] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        if (user.email_verified_at) {
            return res.status(400).json({ message: 'Email is already verified' });
        }
        // Check if JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        // Create new verification token
        const verificationToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Update the verification token in the database
        yield db_1.default.query('UPDATE users SET verification_token = ? WHERE Emails = ?', [verificationToken, email]);
        // Using enhanced development mode for email verification
        console.log('Using enhanced development mode for resending verification');
        // Create verification URL
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        // Log detailed information about the verification process
        console.log('==== Resend Verification - Information ====');
        console.log(`Email: ${email}`);
        console.log(`Verification token: ${verificationToken}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('===========================================');
        // Return the verification URL and token in the response for development purposes
        res.json({
            message: 'In production, a verification email would be sent. Since this is development mode, use the information below.',
            dev_info: {
                note: 'DEVELOPMENT MODE: Use this information to verify your account',
                verification_token: verificationToken,
                verification_url: verificationUrl,
                instructions: 'Either click the verification URL or copy the token and use it on the verification page.'
            }
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Forgot password
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const [users] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
        // For security reasons, don't tell the client if the user exists or not
        // Just return a success message either way
        if (users.length === 0) {
            return res.json({
                message: 'If a user with that email exists, a password reset link will be sent to their email'
            });
        }
        const user = users[0];
        // Check JWT_SECRET environment variable
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        // Generate reset token
        const resetToken = jsonwebtoken_1.default.sign({ email, userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Update user with reset token
        yield db_1.default.query('UPDATE users SET reset_token = ? WHERE Emails = ?', [resetToken, email]);
        // Using enhanced development mode for password reset
        console.log('Using enhanced development mode for password reset');
        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        // Log detailed information about the reset process
        console.log('==== Password Reset - Information ====');
        console.log(`Email: ${email}`);
        console.log(`Reset token: ${resetToken}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('=====================================');
        // Return the reset URL and token in the response for development purposes
        res.json({
            message: 'If this email is registered, a reset link has been sent. Since this is development mode, you can use the information below.',
            dev_info: {
                note: 'DEVELOPMENT MODE: Use this information to reset your password',
                reset_token: resetToken,
                reset_url: resetUrl,
                instructions: 'Either click the reset URL or copy the token and use it on the reset password page.'
            }
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Reset password
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Find user by reset token
            const [users] = yield db_1.default.query('SELECT * FROM users WHERE reset_token = ? AND Emails = ?', [token, decoded.email]);
            if (users.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }
            // Hash new password
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            // Update user password and clear reset token
            yield db_1.default.query('UPDATE users SET Passwords = ?, reset_token = NULL WHERE Emails = ? AND reset_token = ?', [hashedPassword, decoded.email, token]);
            res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
        }
        catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
