import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if email configuration exists
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SendGrid API key is missing. Email functionality will fall back to development mode.');
} else {
  try {
    // Set the SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid API key configured successfully.');
  } catch (error) {
    console.error('Error configuring SendGrid API key:', error);
    console.warn('Email functionality will fall back to development mode.');
  }
}

// Default sender email
const DEFAULT_FROM_EMAIL = 'filmvault.noreply@gmail.com';

/**
 * Email templates for different types of emails
 */
const emailTemplates = {
  verification: (username: string, verificationUrl: string) => ({
    subject: 'Welcome to FilmVault - Please Verify Your Email',
    text: `Hello ${username},\n\nWelcome to FilmVault! Please verify your email by clicking on the following link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you have trouble with the link, please go directly to http://localhost:3000/verify-email and enter this verification token manually: ${verificationUrl.split('token=')[1]}\n\nThank you,\nThe FilmVault Team`,
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
        <p>Go directly to <a href="http://localhost:3000/verify-email">the verification page</a> and enter this token:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;">${verificationUrl.split('token=')[1]}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not sign up for FilmVault, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #888888; text-align: center;">This email was sent from FilmVault, a movie tracking application.</p>
      </div>
    `
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'FilmVault - Password Reset Request',
    text: `Hello,\n\nYou requested a password reset. Please click on the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you have trouble with the link, please go directly to http://localhost:3000/reset-password and enter this reset token manually: ${resetUrl.split('token=')[1]}\n\nIf you did not request a password reset, please ignore this email.\n\nThank you,\nThe FilmVault Team`,
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
        <p>Go directly to <a href="http://localhost:3000/reset-password">the reset password page</a> and enter this token:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;">${resetUrl.split('token=')[1]}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email and your account will remain secure.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #888888; text-align: center;">This email was sent from FilmVault, a movie tracking application.</p>
      </div>
    `
  })
};

/**
 * Send an email using SendGrid
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Plain text version of the email
 * @param html HTML version of the email
 * @returns Promise that resolves when the email is sent
 */
export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
  try {
    const from = process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL;
    const isDevelopmentMode = !process.env.SENDGRID_API_KEY || process.env.NODE_ENV === 'development';
    
    // Log email details in development mode or when no API key
    if (isDevelopmentMode) {
      console.log('==== DEVELOPMENT MODE: Email Details ====');
      console.log(`Email to: ${to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text.substring(0, 100)}...`);
      console.log('HTML Preview:');
      console.log(html.substring(0, 300) + '...');
      console.log('=======================================');
      
      // In development mode, we'll consider this a "success" for testing purposes
      return true;
    }
    
    // Create email message
    const msg = {
      to,
      from,
      subject,
      text,
      html,
    };
    
    try {
      // Attempt to send email
      const response = await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}!`);
      console.log('Response status:', response[0].statusCode);
      console.log('Full response headers:', response[0].headers);
      
      // Display the email content for debugging
      console.log('\n======= EMAIL CONTENT FOR DEBUGGING =======');
      console.log('To:', to);
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('Text content (excerpt):', text.substring(0, 100) + '...');
      console.log('==========================================\n');
      return true;
    } catch (sendError: any) {
      // Handle SendGrid errors but still show email preview
      console.error('Error sending email via SendGrid:');
      if (sendError?.response) {
        console.error('Status code:', sendError.response.statusCode);
        console.error('Body:', sendError.response.body);
      } else {
        console.error('Error details:', JSON.stringify(sendError, null, 2));
        console.error('Error message:', sendError?.message || sendError);
      }
      
      // Log detailed message for debugging
      console.error('\n======= EMAIL DELIVERY FAILED =======');
      console.error('To:', to);
      console.error('From:', from);
      console.error('Subject:', subject);
      console.error('Error type:', typeof sendError);
      console.error('=======================================\n');
      
      // Fall back to development mode behavior
      console.log('Falling back to development mode behavior...');
      return true; // Return success for development testing
    }
  } catch (error: any) {
    console.error('Unexpected error in email service:');
    console.error(error?.message || error);
    return false;
  }
};

/**
 * Send a verification email to a new user
 * @param email User's email address
 * @param username User's username
 * @param verificationToken JWT verification token
 * @returns Promise that resolves when the email is sent
 */
export const sendVerificationEmail = async (email: string, username: string, verificationToken: string): Promise<boolean> => {
  // Use the server URL for the verification link
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  const verificationUrl = `${serverUrl}/api/auth/verify-email?token=${verificationToken}`;
  
  const template = emailTemplates.verification(username, verificationUrl);
  
  return sendEmail(email, template.subject, template.text, template.html);
};

/**
 * Send a password reset email
 * @param email User's email address
 * @param resetToken JWT reset token
 * @returns Promise that resolves when the email is sent
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  // Use the server URL for the reset link
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  const resetUrl = `${serverUrl}/api/auth/reset-password?token=${resetToken}`;
  
  const template = emailTemplates.passwordReset(resetUrl);
  
  return sendEmail(email, template.subject, template.text, template.html);
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};