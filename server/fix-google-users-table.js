const db = require('./config/database');

async function fixGoogleUsersTable() {
  try {
    console.log('Checking Google users table structure...');
    
    // Get current table structure
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'mobile_app_db' 
      AND TABLE_NAME = 'google_users'
    `);
    
    console.log('Current table columns:', columns.map(c => c.COLUMN_NAME));
    
    // Check if photo_url exists
    const hasPhotoUrl = columns.some(col => col.COLUMN_NAME === 'photo_url');
    
    if (!hasPhotoUrl) {
      console.log('Adding missing photo_url column...');
      await db.query(`
        ALTER TABLE google_users
        ADD COLUMN photo_url TEXT AFTER email
      `);
      console.log('Column added successfully!');
    } else {
      console.log('photo_url column already exists, no changes needed.');
    }
    
    // Verify the structure
    const [updatedColumns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'mobile_app_db' 
      AND TABLE_NAME = 'google_users'
    `);
    
    console.log('Updated table columns:', updatedColumns.map(c => c.COLUMN_NAME));
    console.log('Google users table is now ready for use!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing Google users table:', error);
    process.exit(1);
  }
}

// Run the fix
fixGoogleUsersTable(); 