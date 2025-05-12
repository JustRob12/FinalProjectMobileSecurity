const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function setupGoogleUsersTable() {
  try {
    console.log('Setting up Google users table...');
    
    // Read the SQL file with proper path resolution
    const sqlPath = path.join(__dirname, 'google_users_table.sql');
    console.log('SQL file path:', sqlPath);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      await db.query(statement + ';');
      console.log('Executed SQL:', statement.trim().substring(0, 50) + '...');
    }
    
    console.log('Google users table setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up Google users table:', error);
    process.exit(1);
  }
}

// Run the setup
setupGoogleUsersTable(); 