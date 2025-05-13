import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  UserCredential,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { secureStore, secureRetrieve, secureClear } from './secureStorage';
import { tokenize, detokenize } from './tokenization';

// Type definitions for finance models
export interface Wallet {
  id: number;
  user_id: number;
  name: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  bankAccount?: string;
  bankAccountToken?: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  user_id: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  totalBalance: number;
  expensesByCategory: Array<{category: string, total: number}>;
  recentTransactions: Array<Transaction & {wallet_name: string}>;
}

export interface WalletCreateData {
  name: string;
  balance?: number;
  currency?: string;
  bankAccount?: string;
  bankAccountToken?: string;
}

export interface TransactionCreateData {
  wallet_id: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description?: string;
  transaction_date?: string;
}

export interface TransactionFilterParams {
  wallet_id?: number;
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  start_date?: string;
  end_date?: string;
}

// Define multiple potential server URLs
const SERVER_URLS = {
  local: 'http://localhost:3001/api',
  localIp: 'http://127.0.0.1:3001/api',
  network: 'http://192.168.56.1:3001/api',
  networkAlt: 'http://10.0.2.2:3001/api', // For Android emulator to connect to host machine
};

// Use different base URLs depending on platform
const API_URL = Platform.select({
  web: SERVER_URLS.local, // For web development
  ios: SERVER_URLS.local, // For iOS simulator
  android: SERVER_URLS.networkAlt, // For Android emulator
  default: SERVER_URLS.local, // Fallback
});

console.log(`Using API URL: ${API_URL}`);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests if it exists
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle connection errors
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try an alternative URL
      if (API_URL === SERVER_URLS.local) {
        console.log('Retrying with alternate URL:', SERVER_URLS.localIp);
        originalRequest.baseURL = SERVER_URLS.localIp;
      } else if (API_URL === SERVER_URLS.networkAlt) {
        console.log('Retrying with alternate URL:', SERVER_URLS.network);
        originalRequest.baseURL = SERVER_URLS.network;
      }
      
      try {
        return await axios(originalRequest);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const getCurrentUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Stop listening after first response
      if (user) {
        resolve(user);
      } else {
        reject(new Error('No user is signed in'));
      }
    }, reject);
  });
};

// Helper to ensure photoURL is valid
const ensureValidPhotoURL = (url: string | null): string | null => {
  if (!url) {
    console.log('Photo URL is null or empty');
    return null;
  }
  
  // More detailed logging
  console.log('Original photoURL:', url);
  
  // Special handling for Google profile pictures
  if (url.includes('googleusercontent.com')) {
    // Google often provides temporary URLs that expire or don't work well with React Native
    // Instead of trying to fix the URL, we'll use a placeholder image for Google avatars
    // This is more reliable as the Google URLs can be unpredictable
    console.log('Using placeholder for Google profile image');
    return 'https://ui-avatars.com/api/?name=G&background=4285F4&color=fff&size=200';
  }
  
  // If URL doesn't start with http or https, it might be a relative URL or invalid
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.log('URL does not start with http(s), trying to fix...');
    
    // For Google photos that might use a relative path
    if (url.startsWith('/')) {
      // Instead of trying to fix Google URLs, use a placeholder
      console.log('Using placeholder for relative Google URL');
      return 'https://ui-avatars.com/api/?name=G&background=4285F4&color=fff&size=200';
    }
    
    // Try to handle Firebase storage URLs that might be missing the protocol
    if (url.includes('firebasestorage.googleapis.com')) {
      const fixedUrl = `https://${url}`;
      console.log('Fixed Firebase storage URL:', fixedUrl);
      return fixedUrl;
    }
    
    console.log('Could not fix URL, returning null');
    return null;
  }
  
  console.log('URL appears valid:', url);
  return url;
};

export const getUserProfile = async () => {
  try {
    // First check secure storage for cached user data
    try {
      const cachedUserData = await secureRetrieve('user');
      if (cachedUserData) {
        console.log('Using cached user data');
        return cachedUserData;
      }
    } catch (storageError) {
      console.warn('Failed to retrieve user data from secure storage:', storageError);
      // Continue to Firebase data
    }

    // If no cached data, try to get current Firebase user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create and store user profile
    const userData = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: ensureValidPhotoURL(user.photoURL),
      provider: user.providerData[0]?.providerId || 'unknown',
      lastLogin: new Date().toISOString(),
    };

    try {
      // Cache the user data securely
      await secureStore('user', userData);
    } catch (storeError) {
      console.warn('Failed to store user data securely:', storeError);
      // Continue with the userData we have
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    // Firebase authentication
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    console.log('Login successful for user:', {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      providerData: userCredential.user.providerData
    });
    
    // Store auth data in AsyncStorage
    await AsyncStorage.setItem('token', token);
    
    const userData = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || 'User',
      photoURL: ensureValidPhotoURL(userCredential.user.photoURL),
      provider: userCredential.user.providerData[0]?.providerId || 'unknown',
    };
    
    // Call the backend to ensure user is created in the database
    try {
      await api.get('/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.warn('Error confirming user in database. This might cause issues with app functionality.', error);
    }
    
    console.log('Storing user data in AsyncStorage:', userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    return { token, user: userData };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    let errorMessage = 'Network error';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This user account has been disabled.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid credentials.';
          break;
        default:
          errorMessage = error.message || 'Login failed.';
      }
    }
    
    throw { message: errorMessage };
  }
};

export const register = async (username: string, email: string, password: string) => {
  try {
    // Firebase authentication
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with username
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: username
      });
      
      // Get user token for server authorization
      const token = await userCredential.user.getIdToken();
      
      // Call the backend to ensure user is created in the database
      await api.post('/user/profile', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return { message: 'User registered successfully' };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    let errorMessage = 'Registration failed';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'User already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak.';
          break;
        default:
          errorMessage = error.message || 'Registration failed.';
      }
    }
    
    throw { message: errorMessage };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Clear secure storage
    await secureClear('user');
    await secureClear('token');
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Finance API Functions

// Wallet API
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const response = await api.get('/finance/wallets');
    return response.data.wallets;
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
};

export const getWallet = async (walletId: number): Promise<Wallet> => {
  try {
    const response = await api.get(`/finance/wallets/${walletId}`);
    const wallet = response.data.wallet;
    
    // If this wallet has tokenized data, detokenize it
    if (wallet.bankAccountToken) {
      const bankAccount = await detokenize(wallet.bankAccountToken);
      if (bankAccount) {
        wallet.bankAccount = bankAccount;
      }
    }
    
    return wallet;
  } catch (error) {
    console.error(`Error fetching wallet ${walletId}:`, error);
    throw error;
  }
};

export const createWallet = async (walletData: WalletCreateData): Promise<Wallet> => {
  try {
    // If wallet data contains sensitive information like bank account, tokenize it
    let secureWalletData = { ...walletData };
    
    if (walletData.bankAccount) {
      secureWalletData.bankAccountToken = await tokenize(walletData.bankAccount);
      // Remove the original sensitive data
      delete secureWalletData.bankAccount;
    }
    
    const response = await api.post('/finance/wallets', secureWalletData);
    return response.data.wallet;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
};

export const updateWallet = async (walletId: number, walletData: Partial<WalletCreateData>): Promise<Wallet> => {
  try {
    const response = await api.put(`/finance/wallets/${walletId}`, walletData);
    return response.data.wallet;
  } catch (error) {
    console.error('Error updating wallet:', error);
    throw error;
  }
};

export const deleteWallet = async (walletId: number): Promise<{success: boolean, message: string}> => {
  try {
    const response = await api.delete(`/finance/wallets/${walletId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting wallet:', error);
    throw error;
  }
};

// Transaction API
export const getTransactions = async (filters: TransactionFilterParams = {}): Promise<Transaction[]> => {
  try {
    const response = await api.get('/finance/transactions', { params: filters });
    return response.data.transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransaction = async (transactionId: number): Promise<Transaction> => {
  try {
    const response = await api.get(`/finance/transactions/${transactionId}`);
    return response.data.transaction;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData: TransactionCreateData): Promise<Transaction> => {
  try {
    const response = await api.post('/finance/transactions', transactionData);
    return response.data.transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transactionId: number, transactionData: Partial<TransactionCreateData>): Promise<Transaction> => {
  try {
    const response = await api.put(`/finance/transactions/${transactionId}`, transactionData);
    return response.data.transaction;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: number): Promise<{success: boolean, message: string}> => {
  try {
    const response = await api.delete(`/finance/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Category API
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get('/finance/categories');
    return response.data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Summary API
export const getFinancialSummary = async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<FinancialSummary> => {
  try {
    const response = await api.get('/finance/summary', { params: { period } });
    return response.data.summary;
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    throw error;
  }
}; 