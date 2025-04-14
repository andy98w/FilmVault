import pool from './config/db';

async function migrateRatings() {
  try {
    console.log('Starting rating migration...');
    
    // Get database version info
    const [versionInfo] = await pool.query('SELECT VERSION() as version');
    console.log('Database version:', (versionInfo as any[])[0].version);
    
    // 1. First, check if there are any constraints on the table
    try {
      // MySQL approach - drop check constraint
      await pool.query(`
        ALTER TABLE movie_ratings 
        MODIFY COLUMN rating DECIMAL(5,2) NOT NULL
      `);
      console.log('Removed rating column constraints');
    } catch (error) {
      console.log('Trying an alternative approach...');
    }
    
    // 2. Convert ratings one by one
    console.log('Converting existing ratings to 0-100 scale...');
    const [oldRatings] = await pool.query('SELECT * FROM movie_ratings');
    console.log(`Found ${(oldRatings as any[]).length} ratings to migrate`);
    
    // First create a temporary column to store the new values
    try {
      await pool.query('ALTER TABLE movie_ratings ADD COLUMN new_rating INT DEFAULT 0');
      
      // Update temporary column with converted values
      for (const rating of oldRatings as any[]) {
        const oldValue = rating.rating;
        // Convert from decimal 0-5 to integer 0-100
        const newValue = Math.round(oldValue * 20);
        
        await pool.query(
          `UPDATE movie_ratings SET new_rating = ? WHERE id = ?`,
          [newValue, rating.id]
        );
      }
      
      // Drop the old column and rename the new one
      await pool.query('ALTER TABLE movie_ratings DROP COLUMN rating');
      await pool.query('ALTER TABLE movie_ratings CHANGE COLUMN new_rating rating INT NOT NULL DEFAULT 0');
      await pool.query('ALTER TABLE movie_ratings ADD CONSTRAINT rating_check CHECK (rating >= 0 AND rating <= 100)');
      
      console.log('Successfully migrated to new rating column with 0-100 scale');
    } catch (error) {
      console.error('Error during column migration:', error);
      throw error;
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection pool
    process.exit(0);
  }
}

// Run the migration
migrateRatings();