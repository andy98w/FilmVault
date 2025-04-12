import dotenv from 'dotenv';
import emailService from './src/services/email.service';

// Load environment variables
dotenv.config();

// Output separator
const separator = '========================================';

async function testToAddress(emailAddress: string) {
  console.log(`${separator}`);
  console.log(`Testing email delivery to: ${emailAddress}`);
  console.log(`${separator}`);
  
  const username = 'TestUser';
  const token = 'test-verification-token-12345';
  
  // Send verification email
  console.log('\nSending VERIFICATION email...');
  try {
    const result = await emailService.sendVerificationEmail(emailAddress, username, token);
    
    if (result) {
      console.log('✅ Verification email sent successfully!');
      console.log('  If you don\'t see it in your inbox:');
      console.log('  - Check your spam/junk folder');
      console.log('  - Check email filters or forwarding rules');
      console.log('  - Try another email address');
    } else {
      console.log('❌ Failed to send verification email.');
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
  
  // Send password reset email
  console.log('\nSending PASSWORD RESET email...');
  try {
    const result = await emailService.sendPasswordResetEmail(emailAddress, token);
    
    if (result) {
      console.log('✅ Password reset email sent successfully!');
      console.log('  If you don\'t see it in your inbox, check your spam/junk folder.');
    } else {
      console.log('❌ Failed to send password reset email.');
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
  
  console.log(`\n${separator}`);
}

// Main function
async function main() {
  // Get the sender email from environment variables
  const senderEmail = process.env.FROM_EMAIL || 'filmvault.noreply@gmail.com';
  console.log(`Sender email: ${senderEmail}`);
  console.log('Make sure this email is verified in your SendGrid account!');
  
  // Check for command line argument
  const targetEmail = process.argv[2] || process.env.TEST_EMAIL;
  
  if (!targetEmail) {
    console.log('\n❌ No email address provided!');
    console.log('Usage: npx ts-node test-email-simple.ts your.email@example.com');
    console.log('   or: Set TEST_EMAIL in your .env file');
    return;
  }
  
  if (!targetEmail.includes('@')) {
    console.log('\n❌ Invalid email address format');
    return;
  }
  
  await testToAddress(targetEmail);
  
  // Provide troubleshooting information
  console.log('\nTroubleshooting tips if emails are not being received:');
  console.log('1. Check spam/junk folders');
  console.log('2. Add the sender to your contacts');
  console.log('3. Try different email providers (Gmail, Outlook, Yahoo, etc.)');
  console.log('4. Check SendGrid activity logs: https://app.sendgrid.com/email_activity');
  console.log('5. Verify your sending domain in SendGrid for better deliverability');
  console.log(`${separator}`);
}

// Run the main function
main().catch(err => {
  console.error('Test failed with error:', err);
});