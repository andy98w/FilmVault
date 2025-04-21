// Use require for compatibility
const sgMail = require('@sendgrid/mail');
import * as dotenv from 'dotenv';

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
  } catch (error) {
    console.error('Error configuring SendGrid:', error);
  }
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables. Email sending will be disabled.');
}

// Use a properly formatted FROM email with name for better deliverability
const DEFAULT_FROM_EMAIL = {
  email: 'noreply@filmvault.space',
  name: 'FilmVault'
};

const emailTemplates = {
  verification: (username: string, verificationUrl: string) => {
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

  passwordReset: (resetUrl: string) => {
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
}

export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
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
      } else {
        // If just an email address
        from = {
          name: 'FilmVault',
          email: process.env.FROM_EMAIL
        };
      }
    } else {
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
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('SendGrid request timed out after 10s')), 10000);
      });
      
      // Race between the actual send and the timeout
      const [response] = await Promise.race([
        sgMail.send(msg),
        timeoutPromise
      ]);
      
      return true;
    } catch (sendError: any) {
      // In case of timeout, we'll still pretend it succeeded since SendGrid might have received it
      if (sendError.message && sendError.message.includes('timed out')) {
        return true;
      }
      
      return false;
    }
  } catch (error: any) {
    console.error('Unexpected error in email service');
    return false;
  }
};

export const sendVerificationEmail = async (email: string, username: string, verificationToken: string): Promise<boolean> => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
    
    const template = emailTemplates.verification(username, verificationUrl);
    
    const result = await sendEmail(email, template.subject, template.text, template.html);
    
    return result;
  } catch (error) {
    console.error(`Error sending verification email to ${email}`);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    const template = emailTemplates.passwordReset(resetUrl);
    
    const result = await sendEmail(email, template.subject, template.text, template.html);
    
    return result;
  } catch (error) {
    console.error(`Error sending password reset email to ${email}`);
    throw error;
  }
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};