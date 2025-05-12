import * as CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// This key should be stored in a secure way (e.g., in Android Keystore, iOS Keychain)
// For demo purposes, we'll generate and store it, but in production would use platform security
let ENCRYPTION_KEY: string | null = null;

// Generate a secure random key using CryptoJS instead of react-native-securerandom
const generateSecureKey = (): string => {
  // Generate 32 random bytes (256 bits) for AES-256
  const randomWordArray = CryptoJS.lib.WordArray.random(32);
  return randomWordArray.toString(CryptoJS.enc.Hex);
};

// Generate or retrieve the encryption key
export const initializeSecureStorage = async (): Promise<void> => {
  try {
    // Try to retrieve existing key
    const storedKey = await AsyncStorage.getItem('ENCRYPTION_KEY');
    
    if (storedKey) {
      ENCRYPTION_KEY = storedKey;
      console.log('Retrieved existing encryption key');
      
      // Verify the key works by trying to encrypt and decrypt test data
      try {
        const testData = { test: 'data' };
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(testData), ENCRYPTION_KEY).toString();
        const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        JSON.parse(decrypted); // This will throw if decryption failed
      } catch (e) {
        console.warn('Stored encryption key is invalid or corrupted, generating new key');
        // Generate a new key if the stored one doesn't work
        const newKey = generateSecureKey();
        ENCRYPTION_KEY = newKey;
        await AsyncStorage.setItem('ENCRYPTION_KEY', newKey);
        
        // Clear all secured items as they can't be decrypted anymore
        await AsyncStorage.removeItem('user');
        console.log('Generated new encryption key and cleared secured data');
      }
    } else {
      // Generate a new secure random key using CryptoJS
      const newKey = generateSecureKey();
      
      ENCRYPTION_KEY = newKey;
      
      // Store the key (in production, use Keychain/Keystore)
      await AsyncStorage.setItem('ENCRYPTION_KEY', newKey);
      console.log('Generated and stored new encryption key');
    }
  } catch (error) {
    console.error('Error initializing secure storage:', error);
    throw new Error('Failed to initialize secure storage');
  }
};

// Encrypt data with AES-256
export const encryptData = (data: any): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('Secure storage not initialized');
  }
  
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data with AES-256
export const decryptData = (encryptedData: string): any => {
  if (!ENCRYPTION_KEY) {
    throw new Error('Secure storage not initialized');
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    try {
      // Try to parse as JSON if it's valid JSON
      return JSON.parse(decryptedString);
    } catch {
      // Return as string if not JSON
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Store data securely
export const secureStore = async (key: string, data: any): Promise<void> => {
  try {
    const encryptedData = encryptData(data);
    await AsyncStorage.setItem(key, encryptedData);
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
    throw error;
  }
};

// Retrieve data securely
export const secureRetrieve = async (key: string): Promise<any> => {
  try {
    const encryptedData = await AsyncStorage.getItem(key);
    if (!encryptedData) return null;
    
    try {
      return decryptData(encryptedData);
    } catch (decryptError) {
      console.warn(`Failed to decrypt data for key ${key}, clearing corrupted entry:`, decryptError);
      // If we can't decrypt (likely due to key change), clear the corrupted data
      await AsyncStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    throw error;
  }
};

// Clear secure data
export const secureClear = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing data for key ${key}:`, error);
    throw error;
  }
}; 