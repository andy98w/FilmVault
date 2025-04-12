import dotenv from 'dotenv';
import emailService from './src/services/email.service';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Validation function
function checkEmailConfig() {
  console.log('Checking email configuration...');
  
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'filmvault.noreply@gmail.com';
  
  if (!sendgridApiKey) {
    console.log('❌ SENDGRID_API_KEY is missing in your .env file');
    return false;
  }
  
  console.log(`✅ SENDGRID_API_KEY found: ${sendgridApiKey.substring(0, 14)}...`);
  console.log(`ℹ️ FROM_EMAIL configured to: ${fromEmail}`);
  console.log(`ℹ️ IMPORTANT: The sender email "${fromEmail}" must be verified in your SendGrid account!`);
  console.log(`ℹ️ Visit: https://app.sendgrid.com/settings/sender_auth to verify your sender identity.`);
  console.log('');
  
  return true;
}

// Test function
async function testEmailService(testEmail: string) {
  console.log('Testing email service...');
  console.log(`Sending test emails to: ${testEmail}`);
  
  const username = 'TestUser';
  const token = 'test-verification-token-12345';
  
  console.log(`\nSending VERIFICATION email to: ${testEmail}`);
  
  try {
    const result = await emailService.sendVerificationEmail(testEmail, username, token);
    
    if (result) {
      console.log('✅ Verification email sent successfully!');
      console.log('   If you don\'t see it in your inbox, please check your spam/junk folder.');
    } else {
      console.log('❌ Failed to send verification email.');
    }
    
    // Test password reset email
    console.log(`\nSending PASSWORD RESET email to: ${testEmail}`);
    const resetResult = await emailService.sendPasswordResetEmail(testEmail, token);
    
    if (resetResult) {
      console.log('✅ Password reset email sent successfully!');
      console.log('   If you don\'t see it in your inbox, please check your spam/junk folder.');
    } else {
      console.log('❌ Failed to send password reset email.');
    }
  } catch (error) {
    console.error('Error during email test:', error);
  }
}

// Main function
async function main() {
  if (!checkEmailConfig()) {
    console.log('❌ Email configuration is incomplete. Please check your .env file.');
    rl.close();
    return;
  }
  
  // Check if email was provided as command line argument
  let testEmail: string = process.argv[2] || process.env.TEST_EMAIL || '';
  
  if (!testEmail) {
    // Prompt user for email address
    testEmail = await new Promise<string>((resolve) => {
      rl.question('Enter email address to send test emails to: ', (answer) => {
        resolve(answer);
      });
    });
  }
  
  if (!testEmail || !testEmail.includes('@')) {
    console.log('❌ Invalid email address. Test aborted.');
    rl.close();
    return;
  }
  
  await testEmailService(testEmail);
  
  // Ask if emails were received
  const received = await new Promise<boolean>((resolve) => {
    rl.question('\nDid you receive the test emails? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
  
  if (received) {
    console.log('\n🎉 Great! Your email system is working correctly.');
    console.log('Users will now receive verification and password reset emails.');
  } else {
    console.log('\n⚠️ Email delivery issues detected. Here are some troubleshooting steps:');
    console.log('1. Check your spam/junk folder');
    console.log('2. Verify that your sender email is properly verified in SendGrid');
    console.log('3. Try with a different email provider (Gmail, Outlook, etc.)');
    console.log('4. Check SendGrid activity logs at https://app.sendgrid.com/email_activity');
    console.log('5. Ensure your SendGrid account is active and not restricted');
    
    // Ask if user wants to try a different email
    const tryAnother = await new Promise<boolean>((resolve) => {
      rl.question('\nWould you like to try sending to a different email address? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
    
    if (tryAnother) {
      const anotherEmail = await new Promise<string>((resolve) => {
        rl.question('Enter another email address: ', (answer) => {
          resolve(answer);
        });
      });
      
      if (anotherEmail && anotherEmail.includes('@')) {
        await testEmailService(anotherEmail);
      } else {
        console.log('❌ Invalid email address. Test aborted.');
      }
    }
  }
  
  rl.close();
}

// Run the main function
main().then(() => {
  console.log('\nEmail test completed.');
}).catch(err => {
  console.error('Test failed with error:', err);
  rl.close();
});