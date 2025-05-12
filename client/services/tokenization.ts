import { encryptData, decryptData } from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Token map storage key
const TOKEN_STORAGE_KEY = 'TOKENIZED_DATA_MAP';

// Load the token map from storage
const loadTokenMap = async (): Promise<Record<string, string>> => {
  try {
    const tokenMapJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenMapJson) return {};
    return JSON.parse(tokenMapJson);
  } catch (error) {
    console.error('Error loading token map:', error);
    return {};
  }
};

// Save the token map to storage
const saveTokenMap = async (tokenMap: Record<string, string>): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenMap));
  } catch (error) {
    console.error('Error saving token map:', error);
    throw error;
  }
};

// Tokenize sensitive data
export const tokenize = async (sensitiveData: string): Promise<string> => {
  try {
    // Generate a unique token
    const token = `TKN_${uuidv4()}`;
    
    // Encrypt the sensitive data
    const encryptedData = encryptData(sensitiveData);
    
    // Add to the token map
    const tokenMap = await loadTokenMap();
    tokenMap[token] = encryptedData;
    await saveTokenMap(tokenMap);
    
    return token;
  } catch (error) {
    console.error('Error tokenizing sensitive data:', error);
    throw error;
  }
};

// Detokenize to get original data
export const detokenize = async (token: string): Promise<string | null> => {
  try {
    const tokenMap = await loadTokenMap();
    const encryptedData = tokenMap[token];
    
    if (!encryptedData) {
      console.warn(`Token ${token} not found`);
      return null;
    }
    
    return decryptData(encryptedData);
  } catch (error) {
    console.error(`Error detokenizing token ${token}:`, error);
    throw error;
  }
};

// Remove a token
export const removeToken = async (token: string): Promise<void> => {
  try {
    const tokenMap = await loadTokenMap();
    delete tokenMap[token];
    await saveTokenMap(tokenMap);
  } catch (error) {
    console.error(`Error removing token ${token}:`, error);
    throw error;
  }
}; 