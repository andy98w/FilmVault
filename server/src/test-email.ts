import * as sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if email configuration exists
if (!process.env.SENDGRID_API_KEY) {
  console.error('SendGrid API key is missing. Please add SENDGRID_API_KEY to your .env file.');
  process.exit(1);
}

// Set the SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a test function to send an email
async function testEmail() {
  console.log('Email settings:');
  console.log(`- SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '[Set but not displayed]' : '[Not set]'}`);
  console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL || 'Not set, using default'}`);
  
  try {
    const from = process.env.FROM_EMAIL || 'filmvault.noreply@gmail.com';
    const to = from; // Sending to the same address for testing
    
    console.log(`Sending test email from ${from} to ${to}...`);
    
    const msg = {
      to,
      from,
      subject: 'FilmVault Email Test',
      text: 'This is a test email to verify that the SendGrid email functionality is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #89C9B8;">FilmVault Email Test</h1>
          </div>
          <p>This is a test email to verify that the SendGrid email functionality is working correctly.</p>
          <p>Configuration:</p>
          <ul>
            <li>From email: ${from}</li>
            <li>Server time: ${new Date().toISOString()}</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">This is an automated test email from FilmVault.</p>
        </div>
      `,
    };
    
    const response = await sgMail.send(msg);
    console.log('Test email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    
    return true;
  } catch (error: any) {
    console.error('Error sending test email:');
    if (error?.response) {
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
    } else {
      console.error(error?.message || error);
    }
    return false;
  }
}

// Run test
testEmail()
  .then((success) => {
    console.log('\nEmail test:', success ? 'PASSED' : 'FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });