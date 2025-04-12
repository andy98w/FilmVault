#!/bin/bash

USER_ID=1  # The ID of the user you want to delete
API_URL="http://localhost:3000"

read -p "Enter your JWT admin token: " ADMIN_TOKEN

echo "Deleting user with ID: $USER_ID"

node -e "
const axios = require('axios');

async function deleteUser() {
  try {
    const response = await axios.delete(
      'http://localhost:3000/api/admin/users/1',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${process.argv[1]}\`
        }
      }
    );
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('User successfully deleted!');
  } catch (error) {
    console.error('Error deleting user:', error.response ? error.response.data : error.message);
  }
}

deleteUser();
" "$ADMIN_TOKEN"