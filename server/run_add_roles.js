const mysql = require('mysql2/promise');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function runScript() {
  try {
    // Read SQL file
    const sqlScript = await readFile('./add_roles_to_users.sql', 'utf8');
    
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'iloveyou', // Add your password if needed
      database: 'mobile_app_db',
      multipleStatements: true
    });
    
    console.log('Connected to database');
    
    // Execute SQL script
    console.log('Running SQL script...');
    await connection.query(sqlScript);
    
    console.log('Role column added successfully');
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('Error running script:', error);
  }
}

runScript(); 