import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// Create database connection pool. Local development defaults to an embedded,
// persistent SQLite database; OCI deployments can continue using MySQL.
let pool: any;

const createSqlitePool = () => {
  // Node 22.5+ ships this module. `require` keeps the project compatible with
  // the older @types/node version used by the original application.
  const { DatabaseSync } = require('node:sqlite');
  const databasePath = path.resolve(process.env.DB_PATH || './data/filmvault.sqlite');
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA journal_mode = WAL');

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Usernames TEXT NOT NULL,
      Emails TEXT UNIQUE NOT NULL,
      Passwords TEXT NOT NULL,
      ProfilePic TEXT DEFAULT 'default.jpg',
      Biography TEXT,
      FacebookLink TEXT,
      InstagramLink TEXT,
      YoutubeLink TEXT,
      GithubLink TEXT,
      email_verified_at TEXT,
      verification_token TEXT,
      reset_token TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      release_date TEXT,
      overview TEXT
    );
    CREATE TABLE IF NOT EXISTS user_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
    CREATE TABLE IF NOT EXISTS movie_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      rating INTEGER NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 100),
      rated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );
  `);

  const normalize = (sql: string) => sql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP').trim();
  const query = async (rawSql: string, params: any[] = []) => {
    const sql = normalize(rawSql);
    const showTables = sql.match(/^SHOW TABLES(?: LIKE ['\"]([^'\"]+)['\"])?/i);
    if (showTables) {
      const rows = showTables[1]
        ? database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").all(showTables[1])
        : database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
      return [rows, []];
    }

    const showColumns = sql.match(/^SHOW COLUMNS FROM ([A-Za-z0-9_]+)(?: LIKE ['\"]([^'\"]+)['\"])?/i);
    if (showColumns) {
      let rows = database.prepare(`PRAGMA table_info(${showColumns[1]})`).all().map((column: any) => ({
        Field: column.name,
        Type: column.type,
        Null: column.notnull ? 'NO' : 'YES',
        Key: column.pk ? 'PRI' : '',
        Default: column.dflt_value,
        Extra: column.pk ? 'auto_increment' : '',
      }));
      if (showColumns[2]) rows = rows.filter((column: any) => column.Field === showColumns[2]);
      return [rows, []];
    }

    if (/^(SELECT|WITH|PRAGMA)\b/i.test(sql)) {
      return [database.prepare(sql).all(...params), []];
    }

    const result = database.prepare(sql).run(...params);
    return [{
      insertId: Number(result.lastInsertRowid || 0),
      affectedRows: Number(result.changes || 0),
      changedRows: Number(result.changes || 0),
    }, []];
  };

  const connection = {
    query,
    beginTransaction: async () => database.exec('BEGIN'),
    commit: async () => database.exec('COMMIT'),
    rollback: async () => database.exec('ROLLBACK'),
    release: () => undefined,
  };

  console.log(`Using embedded SQLite database: ${databasePath}`);
  return { query, execute: query, getConnection: async () => connection };
};

try {
  if ((process.env.DB_DRIVER || '').toLowerCase() === 'sqlite') {
    pool = createSqlitePool();
  } else {
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
  
  // Only use SSL for remote database connections, not localhost
  const useSSL = dbHost !== 'localhost' && dbHost !== '127.0.0.1';

  pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(useSSL && {
      ssl: {
        // Allow self-signed certificates from OCI MySQL
        rejectUnauthorized: false
      }
    })
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
  }
  
} catch (error) {
  console.error('Error creating database pool:', error);
  throw error; // Re-throw error to fail app startup if DB connection fails
}

export default pool;
