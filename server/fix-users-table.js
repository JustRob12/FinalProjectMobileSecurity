const db = require('./config/database');

async function fixUsersTable() {
  try {
    console.log('Checking users table structure...');
    
    // First, check if the users table exists
    const [tables] = await db.query(`
      SHOW TABLES LIKE 'users'
    `);
    
    if (tables.length === 0) {
      console.log('Users table does not exist. Creating table...');
      // Create the users table
      await db.query(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          firebase_uid VARCHAR(128) UNIQUE,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NULL,
          profile_picture VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created successfully!');
    } else {
      console.log('Users table exists. Checking for required columns...');
      
      // Check if required columns exist
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'mobile_app_db' 
        AND TABLE_NAME = 'users'
      `);
      
      console.log('Current user table columns:', columns.map(c => c.COLUMN_NAME));
      
      // Check for each required column
      const columnNames = columns.map(c => c.COLUMN_NAME);
      
      // Check if firebase_uid exists
      if (!columnNames.includes('firebase_uid')) {
        console.log('Adding missing firebase_uid column...');
        await db.query(`
          ALTER TABLE users
          ADD COLUMN firebase_uid VARCHAR(128) UNIQUE AFTER id
        `);
        console.log('firebase_uid column added successfully!');
      } else {
        console.log('firebase_uid column already exists.');
      }
      
      // Check if profile_picture exists
      if (!columnNames.includes('profile_picture')) {
        console.log('Adding missing profile_picture column...');
        await db.query(`
          ALTER TABLE users
          ADD COLUMN profile_picture VARCHAR(255) AFTER password
        `);
        console.log('profile_picture column added successfully!');
      } else {
        console.log('profile_picture column already exists.');
      }
      
      // Check if password is nullable
      const [passwordInfo] = await db.query(`
        SELECT IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'mobile_app_db'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'password'
      `);
      
      if (passwordInfo.length > 0 && passwordInfo[0].IS_NULLABLE === 'NO') {
        console.log('Modifying password column to allow NULL values...');
        await db.query(`
          ALTER TABLE users
          MODIFY COLUMN password VARCHAR(255) NULL
        `);
        console.log('password column is now nullable.');
      } else {
        console.log('password column is already nullable or does not exist.');
      }
    }
    
    // Verify the final structure
    const [updatedColumns] = await db.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'mobile_app_db' 
      AND TABLE_NAME = 'users'
    `);
    
    console.log('Updated users table columns:', updatedColumns.map(c => `${c.COLUMN_NAME}${c.IS_NULLABLE === 'YES' ? ' (NULL)' : ''}`));
    console.log('Users table is now ready for use!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing users table:', error);
    process.exit(1);
  }
}

// Run the fix
fixUsersTable(); 