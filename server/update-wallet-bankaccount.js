const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateWalletsSchema() {
  try {
    // Create the connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mobile_app_db'
    });

    console.log('Connected to the database successfully!');

    // Check if the column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'bankAccountToken'
    `, [process.env.DB_NAME || 'mobile_app_db']);

    if (columns.length === 0) {
      // Column doesn't exist, so add it
      console.log('Adding bankAccountToken column to wallets table...');
      await connection.query(`
        ALTER TABLE wallets 
        ADD COLUMN bankAccountToken VARCHAR(255)
      `);
      console.log('Column added successfully!');
    } else {
      console.log('bankAccountToken column already exists in wallets table.');
    }

    await connection.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error updating database schema:', error);
    process.exit(1);
  }
}

updateWalletsSchema(); 