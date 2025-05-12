const mysql = require('mysql2/promise');
require('dotenv').config();

// Log database connection attempts for debugging
console.log('Attempting to connect to MySQL with:');
console.log('- Host:', process.env.DB_HOST);
console.log('- User:', process.env.DB_USER);
console.log('- Database:', process.env.DB_NAME);
console.log('- Password:', process.env.DB_PASSWORD ? 'Set (not shown)' : 'Not set');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'iloveyou', // Fallback password
  database: process.env.DB_NAME || 'mobile_app_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection function
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error testing database connection:', error.message);
    return false;
  }
};

// Run test connection
testConnection();

module.exports = pool; 