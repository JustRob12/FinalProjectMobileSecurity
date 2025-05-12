import SQLite from 'react-native-sqlite-storage';
import { secureRetrieve, secureStore } from './secureStorage';
import * as CryptoJS from 'crypto-js';

// Key for storing the database encryption key
const DB_KEY_STORAGE = 'DB_ENCRYPTION_KEY';

// Helper function to generate a secure random key using CryptoJS
const generateSecureKey = (): string => {
  // Generate 32 random bytes (256 bits) for AES-256
  const randomWordArray = CryptoJS.lib.WordArray.random(32);
  return randomWordArray.toString(CryptoJS.enc.Hex);
};

// Initialize SQLCipher with encryption
export const initSecureDatabase = async (dbName: string): Promise<SQLite.SQLiteDatabase> => {
  try {
    // Get or generate a database encryption key
    let dbKey = await secureRetrieve(DB_KEY_STORAGE);
    
    if (!dbKey) {
      // Generate a new secure key for SQLCipher using CryptoJS
      const newKey = generateSecureKey();
      dbKey = newKey;
      
      // Store the key securely
      await secureStore(DB_KEY_STORAGE, dbKey);
    }
    
    // Open encrypted database with SQLCipher
    const db = await SQLite.openDatabase({
      name: dbName,
      location: 'default',
      key: dbKey,
      createFromLocation: 1
    });
    
    // Ensure encryption is working
    await db.executeSql('PRAGMA cipher_version;');
    
    console.log('Secure database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing secure database:', error);
    throw new Error('Failed to initialize secure database');
  }
};

// Helper to execute SQL with parameters securely
export const executeSecureQuery = async (
  db: SQLite.SQLiteDatabase,
  query: string,
  params: any[] = []
): Promise<any[]> => {
  try {
    const [results] = await db.executeSql(query, params);
    const rows = [];
    
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    
    return rows;
  } catch (error) {
    console.error('Error executing secure query:', error);
    throw error;
  }
};

// Close database securely
export const closeSecureDatabase = (db: SQLite.SQLiteDatabase): Promise<void> => {
  return db.close()
    .then(() => console.log('Database closed successfully'))
    .catch((error: Error) => {
      console.error('Error closing database:', error);
      throw error;
    });
}; 