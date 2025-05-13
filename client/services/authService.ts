import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from './api';
import { secureStore, secureRetrieve } from './secureStorage';

// Define user roles
export type UserRole = 'admin' | 'user' | 'guest';

// User profile interface with role
export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  tokenExpiry?: number;
}

// JWT Token interface
interface JWTPayload {
  uid: string;
  email?: string;
  role: UserRole;
  exp: number; // Expiration time
  iat: number; // Issued at time
}

// Biometric authentication status
export enum BiometricStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  UNSUPPORTED = 'UNSUPPORTED',
}

// Check if biometric authentication is available
export const checkBiometricAvailability = async (): Promise<BiometricStatus> => {
  try {
    // For a production app, you would use a library like expo-local-authentication
    // Since we're having dependency issues, we'll simulate biometric availability
    
    // Simplified check - in a real app use proper device capability checks
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Most modern devices support biometrics
      return BiometricStatus.AVAILABLE;
    }
    
    return BiometricStatus.UNSUPPORTED;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return BiometricStatus.UNAVAILABLE;
  }
};

// Enable or disable biometric authentication
export const setBiometricsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem('biometricsEnabled', enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting biometrics preference:', error);
  }
};

// Check if biometric authentication is enabled
export const isBiometricsEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem('biometricsEnabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error getting biometrics preference:', error);
    return false;
  }
};

// Authenticate with biometrics
export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    // For a production app, you would use a library like expo-local-authentication
    // Since we're having dependency issues, we'll simulate biometric authentication
    
    // Simplified mock - in a real app use proper biometric API
    // This simulates a successful authentication
    console.log('Simulating biometric authentication success');
    return true;
    
    // In a real implementation with expo-local-authentication:
    // const result = await LocalAuthentication.authenticateAsync({
    //   promptMessage: 'Authenticate to access your account',
    //   fallbackLabel: 'Use passcode',
    // });
    // return result.success;
  } catch (error) {
    console.error('Error authenticating with biometrics:', error);
    return false;
  }
};

// Login with email/password and optional biometrics
export const login = async (
  email: string, 
  password: string,
  useBiometrics: boolean = false
): Promise<{ user: AuthUser; token: string }> => {
  // First authenticate with regular credentials
  const authResult = await api.login(email, password);
  
  // Extract role from token if available, default to 'user'
  let userRole: UserRole = 'user';
  
  try {
    // Attempt to decode JWT to get role (simplified approach)
    // In a real app, use a proper JWT library
    const tokenParts = authResult.token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      userRole = payload.role || 'user';
    }
  } catch (error) {
    console.error('Error decoding JWT token:', error);
  }
  
  // Create AuthUser with role
  const authUser: AuthUser = {
    ...authResult.user,
    role: userRole,
    tokenExpiry: Date.now() + 3600000, // Token expires in 1 hour
  };
  
  // Store authentication state
  await secureStore('authUser', authUser);
  
  // If biometrics enabled, store credentials securely for future biometric auth
  if (useBiometrics) {
    await setBiometricsEnabled(true);
    // In a real app with proper keychain:
    // await Keychain.setGenericPassword(email, password, {
    //   service: 'biometricAuth',
    //   accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    //   accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // });
  }
  
  return { user: authUser, token: authResult.token };
};

// Check if token is expired
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const authUser = await secureRetrieve('authUser');
    if (!authUser || !authUser.tokenExpiry) {
      return true;
    }
    
    return Date.now() > authUser.tokenExpiry;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Refresh token if it's about to expire
export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  try {
    const authUser = await secureRetrieve('authUser');
    if (!authUser) {
      return false;
    }
    
    // If token expires in less than 5 minutes, refresh it
    const fiveMinutes = 5 * 60 * 1000;
    if (!authUser.tokenExpiry || (authUser.tokenExpiry - Date.now()) < fiveMinutes) {
      // Call API to refresh token
      const response = await api.api.post('/auth/refresh-token');
      
      if (response.data.success && response.data.token) {
        // Update token in storage
        await AsyncStorage.setItem('token', response.data.token);
        
        // Update expiry time
        authUser.tokenExpiry = Date.now() + 3600000; // 1 hour
        await secureStore('authUser', authUser);
        
        return true;
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Get current authenticated user with role
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    // Check if token is expired
    const expired = await isTokenExpired();
    if (expired) {
      const refreshed = await refreshTokenIfNeeded();
      if (!refreshed) {
        return null;
      }
    }
    
    return await secureRetrieve('authUser');
  } catch (error) {
    console.error('Error getting current auth user:', error);
    return null;
  }
};

// Check if user has required role
export const hasRole = async (requiredRole: UserRole): Promise<boolean> => {
  try {
    const user = await getCurrentAuthUser();
    
    if (!user) {
      return false;
    }
    
    // Role hierarchy: admin > user > guest
    if (requiredRole === 'guest') {
      // Any authenticated user has at least guest privileges
      return true;
    }
    
    if (requiredRole === 'user') {
      // Only user and admin roles have user privileges
      return user.role === 'user' || user.role === 'admin';
    }
    
    if (requiredRole === 'admin') {
      // Only admin role has admin privileges
      return user.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    // Clear secure storage
    await secureStore('authUser', null);
    await AsyncStorage.removeItem('token');
    
    // Call API logout function
    await api.logout();
  } catch (error) {
    console.error('Error during logout:', error);
  }
}; 