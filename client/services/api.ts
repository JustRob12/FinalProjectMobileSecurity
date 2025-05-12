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

export const getUserProfile = async () => {
  try {
    // First check AsyncStorage for cached user data
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
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
      photoURL: user.photoURL || null,
      provider: user.providerData[0]?.providerId || 'unknown',
      lastLogin: new Date().toISOString(),
    };

    // Cache the user data
    await AsyncStorage.setItem('user', JSON.stringify(userData));
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
    
    // Store auth data in AsyncStorage
    await AsyncStorage.setItem('token', token);
    
    const userData = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
    
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
    // Firebase sign out
    await signOut(auth);
    
    // Clear local storage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}; 