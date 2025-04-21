// Simple SendGrid test script
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from production environment
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

// Load SendGrid
const sgMail = require('@sendgrid/mail');

// Print environment variables (censored for security)
console.log('Environment variables check:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL || 'not set'}`);
console.log(`- SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- SENDGRID_API_KEY length: ${process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0}`);
console.log(`- CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);

// Configure SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not set. Cannot proceed with test.');
  process.exit(1);
}

// Configure API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send a test email
async function sendTestEmail() {
  const testEmail = process.env.TEST_EMAIL || 'your-email@example.com';
  if (testEmail === 'your-email@example.com') {
    console.log('Please set TEST_EMAIL environment variable or edit this script.');
    console.log('Not sending test email to the default address.');
    return;
  }

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
    from = {
      email: 'noreply@filmvault.space',
      name: 'FilmVault'
    };
  }

  console.log('Preparing to send test email:');
  console.log(`- From: ${JSON.stringify(from)}`);
  console.log(`- To: ${testEmail}`);
  
  try {
    const msg = {
      to: testEmail,
      from: from,
      subject: 'FilmVault - SendGrid Test Email',
      text: 'This is a test email to verify SendGrid configuration',
      html: '<div style="font-family: Arial, sans-serif;"><h1>SendGrid Test Email</h1><p>This test email confirms your SendGrid configuration is working.</p><p>Timestamp: ' + new Date().toISOString() + '</p></div>'
    };

    console.log('Sending email...');
    const [response] = await sgMail.send(msg);
    
    console.log('Email sent successfully!');
    console.log(`Status code: ${response.statusCode}`);
    console.log('Headers:', response.headers);
    return true;
  } catch (error: any) {
    console.error('Error sending test email:');
    console.error(error);
    
    if (error.response) {
      console.error('SendGrid API Error Response:');
      console.error(error.response.body);
    }
    
    return false;
  }
}

// Run the test
sendTestEmail().then(success => {
  if (success) {
    console.log('Test completed successfully!');
  } else {
    console.log('Test failed. Check error logs above.');
  }
});