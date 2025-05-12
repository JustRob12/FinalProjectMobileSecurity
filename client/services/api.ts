import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  UserCredential,
  updateProfile
} from 'firebase/auth';

// Use different base URLs depending on platform
const API_URL = Platform.select({
  web: 'http://localhost:3000/api', // For web development
  ios: 'http://localhost:3000/api', // For iOS simulator
  android: 'http://192.168.56.1:3000/api', // For Android emulator/device
  default: 'http://192.168.56.1:3000/api', // Fallback
});

console.log(`Using API URL: ${API_URL}`);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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