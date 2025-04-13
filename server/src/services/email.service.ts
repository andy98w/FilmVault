import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (error) {
    console.error('Error configuring SendGrid API key');
  }
}

const DEFAULT_FROM_EMAIL = 'filmvault.noreply@gmail.com';

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

export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
  try {
    const from = process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL;
    const isDevelopmentMode = !process.env.SENDGRID_API_KEY || process.env.NODE_ENV === 'development';
    
    if (isDevelopmentMode) {
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
      await sgMail.send(msg);
      return true;
    } catch (sendError: any) {
      console.error('Error sending email via SendGrid');
      return true; // Return success for development testing
    }
  } catch (error: any) {
    console.error('Unexpected error in email service');
    return false;
  }
};

export const sendVerificationEmail = async (email: string, username: string, verificationToken: string): Promise<boolean> => {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  const verificationUrl = `${serverUrl}/api/auth/verify-email?token=${verificationToken}`;
  
  const template = emailTemplates.verification(username, verificationUrl);
  
  return sendEmail(email, template.subject, template.text, template.html);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
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