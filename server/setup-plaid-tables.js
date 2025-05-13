require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');
const db = require('./config/database');

async function setupPlaidTables() {
  try {
    console.log('Setting up Plaid tables...');
    
    // Read SQL file
    const sql = fs.readFileSync('./plaid_tables.sql', 'utf8');
    const statements = sql
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .map(statement => statement.trim() + ';');
    
    // Connect and execute SQL
    const connection = await db.getConnection();
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      await connection.query(statement);
    }
    
    connection.release();
    console.log('Plaid tables setup complete!');
    
  } catch (error) {
    console.error('Error setting up Plaid tables:', error);
  } finally {
    process.exit();
  }
}

setupPlaidTables(); 