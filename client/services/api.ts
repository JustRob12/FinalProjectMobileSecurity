import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
    const response = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw (error as any).response?.data || { message: 'Network error' };
  }
};

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error) {
    throw (error as any).response?.data || { message: 'Network error' };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}; 