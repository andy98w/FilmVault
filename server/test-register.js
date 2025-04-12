const axios = require('axios');

// Test registration with the email that was deleted
async function testRegister() {
  try {
    console.log('Testing registration with email: awseer09@gmail.com');
    
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      username: 'andyw98',
      email: 'awseer09@gmail.com',
      password: 'password123'
    });
    
    console.log('Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testRegister();