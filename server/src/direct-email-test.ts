import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`Running in ${nodeEnv} environment`);

if (nodeEnv === 'production') {
  const absolutePath = path.join(__dirname, '../.env.production');
  if (require('fs').existsSync(absolutePath)) {
    console.log(`Loading environment from absolute path: ${absolutePath}`);
    dotenv.config({ path: absolutePath });
  } else {
    console.log('Loading environment from relative path: .env.production');
    dotenv.config({ path: '.env.production' });
  }
} else {
  const devPath = path.join(__dirname, '../.env.development');
  if (require('fs').existsSync(devPath)) {
    console.log(`Loading environment from: ${devPath}`);
    dotenv.config({ path: devPath });
  } else {
    console.log('Loading environment from: .env.development');
    dotenv.config({ path: '.env.development' });
  }
}

// Use require for compatibility
const sgMail = require('@sendgrid/mail');

// Configure SendGrid API key and additional settings
if (process.env.SENDGRID_API_KEY) {
  try {
    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Log environment info for debugging
    console.log(`SendGrid configuration:`);
    console.log(`- Environment: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`- API Key: ${process.env.SENDGRID_API_KEY ? '[CONFIGURED]' : '[MISSING]'}`);
    console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL || 'not set (will use default)'}`);
    
    if (process.env.SENDGRID_PROXY) {
      // Enable proxy support if configured
      sgMail.setProxy(process.env.SENDGRID_PROXY);
      console.log(`- Proxy: ${process.env.SENDGRID_PROXY}`);
    }
    
    // Set timeout to 30 seconds to avoid hanging when network issues occur
    sgMail.setTimeout(30000);
    
    console.log('SendGrid configured successfully');
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

async function sendDirectEmail(to: string) {
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
    
    // Always attempt to send emails if we have a SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.log('Missing SendGrid API key - email would be sent to:', to);
      console.log('Email from:', from);
      // For development, just log the email and return true
      return true;
    }
    
    // Log email details for debugging
    console.log('Sending email via SendGrid:');
    console.log(`- From: ${JSON.stringify(from)}`);
    console.log(`- To: ${to}`);
    console.log(`- Subject: Direct Test Email`);
    
    const msg = {
      to,
      from, // This is now an object with name and email
      subject: 'FilmVault - DIRECT Test Email',
      text: 'This is a direct test email from FilmVault to verify email delivery is working.',
      html: `<div>
        <h1>FilmVault Direct Test Email</h1>
        <p>This is a test email sent directly using the SendGrid client to verify email delivery is working.</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>`,
    };
    
    try {
      console.log(`Attempting to send email to ${to} via SendGrid...`);
      const [response] = await sgMail.send(msg);
      
      // Log detailed response information
      console.log(`Email sent successfully to ${to}`);
      console.log(`SendGrid response status: ${response?.statusCode}`);
      
      // If we get here, email was sent successfully
      return true;
    } catch (sendError: any) {
      // SendGrid-specific error handling with detailed information
      console.error('Error sending email via SendGrid:', sendError);
      
      // Check for common SendGrid errors
      if (sendError.code === 401) {
        console.error('SendGrid authentication failed: Invalid API key');
      } else if (sendError.code === 403) {
        console.error('SendGrid authorization failed: May need to verify sender identity or check API key permissions');
      } else if (sendError.code === 429) {
        console.error('SendGrid rate limit reached: Too many requests');
      } else if (sendError.code === 'ENOTFOUND' || sendError.code === 'ECONNREFUSED') {
        console.error('Network error: Unable to connect to SendGrid API. Check network/firewall settings');
      } else if (sendError.code === 'ETIMEDOUT') {
        console.error('Connection to SendGrid timed out. Check network connectivity and proxy settings');
      }
      
      // Log detailed error information
      if (sendError.response?.body) {
        console.error('SendGrid error details:', JSON.stringify(sendError.response.body));
      }
      
      // Log the full error message for debugging
      console.error('Full error:', sendError.message);
      
      // Don't return true on error in production or development
      return false;
    }
  } catch (error: any) {
    console.error('Unexpected error in email service:', error);
    return false;
  }
}

// Run the direct test
const email = process.argv[2] || 'awseer09@gmail.com';
console.log(`Starting direct email test to: ${email}`);

sendDirectEmail(email)
  .then((result) => {
    console.log(`Direct email test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in direct email test:', error);
    process.exit(1);
  });