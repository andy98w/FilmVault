import pool from './config/db';

async function testDbConnection() {
  try {
    console.log("Attempting to connect to database via Network Load Balancer...");
    console.log(`Host: ${process.env.DB_HOST || '40.233.72.63'}`);
    console.log(`Database: ${process.env.DB_NAME || 'myfavmovies'}`);
    console.log("Port: 3306");
    
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    
    // Try to execute a simple query
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    console.table(rows);
    
    // Test a simple query
    try {
      const [versionResult] = await connection.query('SELECT VERSION() as version');
      console.log('MySQL Version:', versionResult[0].version);
    } catch (queryError) {
      console.warn('Could not get MySQL version:', queryError);
    }
    
    connection.release();
    console.log("Connection released successfully.");
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log("Make sure:");
    console.log("1. The database password is correct");
    console.log("2. The database 'myfavmovies' exists");
    console.log("3. The user 'admin' has permissions to connect from '%'");
    console.log("4. The NLB is properly routing traffic to port 3306");
  } finally {
    process.exit();
  }
}

testDbConnection();