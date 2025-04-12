import pool from './config/db';

const runMigration = async () => {
  try {
    console.log('Starting LinkedIn link migration...');
    
    // Add LinkedInLink column to users table
    const addLinkedInLinkQuery = 'ALTER TABLE users ADD COLUMN LinkedInLink VARCHAR(255) DEFAULT NULL';
    
    console.log('Executing query:', addLinkedInLinkQuery);
    await pool.query(addLinkedInLinkQuery);
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();