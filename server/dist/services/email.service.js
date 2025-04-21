"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
// Use require for compatibility
const sgMail = require('@sendgrid/mail');
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Configure SendGrid API key
if (process.env.SENDGRID_API_KEY) {
    try {
        // Set API key
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        if (process.env.SENDGRID_PROXY) {
            // Enable proxy support if configured
            sgMail.setProxy(process.env.SENDGRID_PROXY);
        }
        // Set timeout to 10 seconds to avoid hanging when network issues occur
        sgMail.setTimeout(10000);
    }
    catch (error) {
        console.error('Error configuring SendGrid:', error);
    }
}
else {
    console.warn('SENDGRID_API_KEY not found in environment variables. Email sending will be disabled.');
}
// Use a properly formatted FROM email with name for better deliverability
const DEFAULT_FROM_EMAIL = {
    email: 'noreply@filmvault.space',
    name: 'FilmVault'
};
const emailTemplates = {
    verification: (username, verificationUrl) => {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const verifyPageUrl = `${clientUrl}/verify-email`;
        const token = verificationUrl.includes('token=') ? verificationUrl.split('token=')[1] : verificationUrl;
        return {
            subject: 'Welcome to FilmVault - Please Verify Your Email',
            text: `Hello ${username},\n\nWelcome to FilmVault! Please verify your email by clicking on the following link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you have trouble with the link, please go directly to ${verifyPageUrl} and enter this verification token manually: ${token}\n\nThank you,\nThe FilmVault Team`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #89C9B8;">Welcome to FilmVault!</h1>
          </div>
          <p>Hello ${username},</p>
          <p>Thank you for registering with FilmVault. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #89C9B8; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">${verificationUrl}</p>
          <p><strong>Trouble with the link?</strong></p>
          <p>Go directly to <a href="${verifyPageUrl}">${verifyPageUrl}</a> and enter this token:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;">${token}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not sign up for FilmVault, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">This email was sent from <a href="https://filmvault.space">FilmVault</a>, a movie tracking application.</p>
          <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} FilmVault. All rights reserved.</p>
        </div>
      `
        };
    },
    passwordReset: (resetUrl) => {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetPageUrl = `${clientUrl}/reset-password`;
        const token = resetUrl.includes('token=') ? resetUrl.split('token=')[1] : resetUrl;
        return {
            subject: 'FilmVault - Password Reset Request',
            text: `Hello,\n\nYou requested a password reset. Please click on the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you have trouble with the link, please go directly to ${resetPageUrl} and enter this reset token manually: ${token}\n\nIf you did not request a password reset, please ignore this email.\n\nThank you,\nThe FilmVault Team`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #89C9B8;">Password Reset Request</h1>
          </div>
          <p>Hello,</p>
          <p>We received a request to reset your password for your FilmVault account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #89C9B8; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">${resetUrl}</p>
          <p><strong>Trouble with the link?</strong></p>
          <p>Go directly to <a href="${resetPageUrl}">${resetPageUrl}</a> and enter this token:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;">${token}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email and your account will remain secure.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">This email was sent from <a href="https://filmvault.space">FilmVault</a>, a movie tracking application.</p>
          <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} FilmVault. All rights reserved.</p>
        </div>
      `
        };
    }
};
const sendEmail = (to, subject, text, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse FROM_EMAIL environment variable or use default
        let from;
        if (process.env.FROM_EMAIL) {
            // If FROM_EMAIL is in "Name <email@domain.com>" format, parse it
            const fromEmailMatch = process.env.FROM_EMAIL.match(/^(.*?)\s*<(.+)>$/);
            if (fromEmailMatch) {
                from = {
                    name: fromEmailMatch[1].trim(),
                    email: fromEmailMatch[2].trim()
                };
            }
            else {
                // If just an email address
                from = {
                    name: 'FilmVault',
                    email: process.env.FROM_EMAIL
                };
            }
        }
        else {
            from = DEFAULT_FROM_EMAIL;
        }
        // Development mode - just return true
        if (!process.env.SENDGRID_API_KEY) {
            return true;
        }
        const msg = {
            to,
            from,
            subject,
            text,
            html,
        };
        try {
            // Use Promise.race with a timeout to prevent hanging in serverless environments
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('SendGrid request timed out after 10s')), 10000);
            });
            // Race between the actual send and the timeout
            const [response] = yield Promise.race([
                sgMail.send(msg),
                timeoutPromise
            ]);
            return true;
        }
        catch (sendError) {
            // In case of timeout, we'll still pretend it succeeded since SendGrid might have received it
            if (sendError.message && sendError.message.includes('timed out')) {
                return true;
            }
            return false;
        }
    }
    catch (error) {
        console.error('Unexpected error in email service');
        return false;
    }
});
exports.sendEmail = sendEmail;
const sendVerificationEmail = (email, username, verificationToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
        const template = emailTemplates.verification(username, verificationUrl);
        const result = yield (0, exports.sendEmail)(email, template.subject, template.text, template.html);
        return result;
    }
    catch (error) {
        console.error(`Error sending verification email to ${email}`);
        throw error;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = (email, resetToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
        const template = emailTemplates.passwordReset(resetUrl);
        const result = yield (0, exports.sendEmail)(email, template.subject, template.text, template.html);
        return result;
    }
    catch (error) {
        console.error(`Error sending password reset email to ${email}`);
        throw error;
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.default = {
    sendEmail: exports.sendEmail,
    sendVerificationEmail: exports.sendVerificationEmail,
    sendPasswordResetEmail: exports.sendPasswordResetEmail
};
