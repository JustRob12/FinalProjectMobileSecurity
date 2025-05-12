const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function setupFinanceTables() {
  try {
    console.log('Setting up finance tracking tables...');
    
    // Read the SQL file with proper path resolution
    const sqlPath = path.join(__dirname, 'finance_tables.sql');
    console.log('SQL file path:', sqlPath);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await db.query(statement + ';');
        console.log('Executed SQL:', statement.trim().substring(0, 50) + '...');
      } catch (error) {
        // If error is due to table or index already existing, continue
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log('Table or index already exists, continuing...');
        } else {
          // For other errors, throw to be caught by outer catch
          throw error;
        }
      }
    }
    
    console.log('Finance tables setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up finance tables:', error);
    process.exit(1);
  }
}

// Run the setup
setupFinanceTables(); 