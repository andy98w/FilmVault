const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// User ID to delete - change this to the desired user ID
const userId = 1;

rl.question('Enter your JWT admin token: ', async (token) => {
  try {
    console.log(`Deleting user with ID ${userId}...`);
    
    const response = await axios.delete(
      `http://localhost:3000/api/admin/users/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('User successfully deleted!');
  } catch (error) {
    console.error('Error deleting user:', 
      error.response ? error.response.data : error.message);
  } finally {
    rl.close();
  }
});