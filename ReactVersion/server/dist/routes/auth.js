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
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = __importDefault(require("../config/db"));
const router = express_1.default.Router();
// Register a new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const [existingUsers] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Create verification token
        const verificationToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        // Insert new user
        yield db_1.default.query('INSERT INTO users (Usernames, Emails, Passwords, verification_token) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, verificationToken]);
        // Send verification email
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const verificationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
        yield transporter.sendMail({
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Verify email
router.get('/verify-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        // Update user
        yield db_1.default.query('UPDATE users SET email_verified_at = NOW() WHERE Emails = ? AND verification_token = ?', [decoded.email, token]);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?verified=true`);
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Invalid or expired verification token' });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const [users] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
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
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.Usernames, email: user.Emails }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.Usernames,
                email: user.Emails,
                profilePic: user.ProfilePic
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
        // Create new verification token
        const verificationToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        // Update user with new token
        yield db_1.default.query('UPDATE users SET verification_token = ? WHERE Emails = ?', [verificationToken, email]);
        // Send verification email
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const verificationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
        yield transporter.sendMail({
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
        // Find user
        const [users] = yield db_1.default.query('SELECT * FROM users WHERE Emails = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Generate reset token
        const resetToken = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
        // Update user with reset token
        yield db_1.default.query('UPDATE users SET reset_token = ? WHERE Emails = ?', [resetToken, email]);
        // Send reset email
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        yield transporter.sendMail({
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
        if (!token) {
            return res.status(400).json({ message: 'Reset token is required' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        // Hash new password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Update user password
        yield db_1.default.query('UPDATE users SET Passwords = ?, reset_token = NULL WHERE Emails = ? AND reset_token = ?', [hashedPassword, decoded.email, token]);
        res.json({ message: 'Password reset successful' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Invalid or expired reset token' });
    }
}));
exports.default = router;
