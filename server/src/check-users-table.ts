import pool from './config/db';

async function checkUsersTable() {
  try {
    console.log('Checking users table structure...');
    const connection = await pool.getConnection();
    
    try {
      // Get table structure
      const [columns] = await connection.query('SHOW COLUMNS FROM users');
      console.log('Users table columns:');
      console.table(columns);

      // Check for test users
      const [users] = await connection.query('SELECT id, Usernames, Emails, email_verified_at FROM users LIMIT 5');
      console.log('Sample users (limiting sensitive data):');
      console.table(users);
      
      connection.release();
      console.log('Connection released successfully');
    } catch (error) {
      console.error('Error querying users table:', error);
      connection.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

checkUsersTable();