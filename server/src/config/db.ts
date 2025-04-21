import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// OCI Configuration from environment variables
const ociConfig = {
  user: process.env.OCI_USER_OCID || '',
  fingerprint: process.env.OCI_FINGERPRINT || '',
  tenancy: process.env.OCI_TENANCY_OCID || '',
  region: process.env.OCI_REGION || 'ca-toronto-1',
  key_file: process.env.OCI_KEY_FILE || '',
};

// Log database configuration
console.log('OCI Database Configuration:');
console.log(`  Region: ${ociConfig.region}`);
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  User: ${process.env.DB_USER}`);
console.log(`  Database: ${process.env.DB_NAME}`);

// Create database connection pool
let pool: any;

try {
  // Read OCI private key if exists
  const privateKey = fs.existsSync(ociConfig.key_file) 
    ? fs.readFileSync(ociConfig.key_file, 'utf8')
    : undefined;
    
  if (!privateKey) {
    console.warn(`OCI private key not found at ${ociConfig.key_file}`);
  }
  
  // Create connection pool
  const dbHost = process.env.DB_HOST || process.env.DB_NLB_IP || 'localhost';
  console.log(`Using database host: ${dbHost}`);
  
  pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      // Allow self-signed certificates from OCI MySQL
      rejectUnauthorized: false
    }
  });
  
  // Test the connection
  const testConnection = async () => {
    try {
      const connection = await pool.getConnection();
      console.log('Database connection successful!');
      
      // Try to get database info
      try {
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables in database:');
        console.table(rows);
      } catch (queryErr) {
        console.warn('Connected but could not query database:', queryErr);
      }
      
      connection.release();
      return true;
    } catch (error) {
      console.error('Error connecting to database:', error);
      console.log('Check db-connection-checklist.md for troubleshooting steps');
      throw error; // Re-throw error to fail app startup if DB connection fails
    }
  };
  
  // Execute the test immediately
  testConnection();
  
} catch (error) {
  console.error('Error creating database pool:', error);
  throw error; // Re-throw error to fail app startup if DB connection fails
}

export default pool;