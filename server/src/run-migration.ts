import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addColumnIfNotExists(connection: mysql.Connection, tableName: string, columnName: string, definition: string) {
  try {
    // Check if column exists
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`);
    
    if ((columns as any[]).length === 0) {
      // Column doesn't exist, add it
      console.log(`Adding ${columnName} column...`);
      await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
      return true;
    } else {
      console.log(`Column ${columnName} already exists, skipping...`);
      return false;
    }
  } catch (error) {
    console.error(`Error handling column ${columnName}:`, error);
    return false;
  }
}

async function runMigration() {
  let connection: mysql.Connection | null = null;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '40.233.72.63',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'myfavmovies'
    });

    await addColumnIfNotExists(connection, 'users', 'verification_token', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'reset_token', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'Biography', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'users', 'FacebookLink', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'InstagramLink', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'YoutubeLink', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'GithubLink', 'VARCHAR(255) NULL');
    
    console.log('Checking columns...');
    const [rows] = await connection.query('SHOW COLUMNS FROM users');
    console.log('Users table columns:');
    console.table(rows);
    
    console.log('✅ Migration completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error);
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();