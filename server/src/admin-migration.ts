import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
};

// Function to check if a column exists
async function columnExists(connection: mysql.Connection, table: string, column: string): Promise<boolean> {
  const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
  return (columns as any[]).length > 0;
}

// Function to add a column if it doesn't exist
async function addColumnIfNotExists(connection: mysql.Connection, table: string, column: string, definition: string) {
  if (!(await columnExists(connection, table, column))) {
    console.log(`Adding ${column} column to ${table} table...`);
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`${column} column added successfully.`);
    return true;
  } else {
    console.log(`The ${column} column already exists in ${table} table.`);
    return false;
  }
}

// Function to add created_at and updated_at columns
async function addTimestampColumns(connection: mysql.Connection, table: string) {
  let modified = false;
  
  // Add created_at column if it doesn't exist
  if (await addColumnIfNotExists(
    connection, 
    table, 
    'created_at', 
    'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  )) {
    modified = true;
  }
  
  // Add updated_at column if it doesn't exist
  if (await addColumnIfNotExists(
    connection, 
    table, 
    'updated_at', 
    'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  )) {
    modified = true;
  }
  
  return modified;
}

// Make the first user an admin
async function makeFirstUserAdmin(connection: mysql.Connection) {
  // Check if there are any users
  const [users] = await connection.query('SELECT id FROM users LIMIT 1');
  
  if ((users as any[]).length > 0) {
    const firstUserId = (users as any[])[0].id;
    console.log(`Making user with ID ${firstUserId} an admin...`);
    
    await connection.query(
      'UPDATE users SET is_admin = 1 WHERE id = ?',
      [firstUserId]
    );
    
    console.log(`User ${firstUserId} is now an admin.`);
    return true;
  } else {
    console.log('No users found. No admin has been set.');
    return false;
  }
}

// Main migration function
async function runMigration() {
  console.log('Starting admin migration...');
  console.log('Database configuration:');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`Database: ${dbConfig.database}`);
  
  let connection: mysql.Connection;
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection established.');
    
    // Add is_admin column to users table
    await addColumnIfNotExists(
      connection, 
      'users', 
      'is_admin', 
      'BOOLEAN DEFAULT 0'
    );
    
    // Add timestamp columns to users table
    await addTimestampColumns(connection, 'users');
    
    // Make the first user an admin
    await makeFirstUserAdmin(connection);
    
    console.log('Migration completed successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error?.message || error);
    process.exit(1);
  } finally {
    if (connection!) {
      await connection!.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Admin migration script finished.');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('Fatal error during migration:', error?.message || error);
    process.exit(1);
  });