import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface BiometricLoginButtonProps {
  onAuthSuccess?: () => void;
}

const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const navigation = useNavigation<any>();

  // Check if biometric authentication is available and enabled
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        // Check if device supports biometrics
        const biometricStatus = await authService.checkBiometricAvailability();
        const isAvailable = biometricStatus === authService.BiometricStatus.AVAILABLE;
        setAvailable(isAvailable);
        
        if (isAvailable) {
          // Check if user has enabled biometrics
          const isBiometricsEnabled = await authService.isBiometricsEnabled();
          setEnabled(isBiometricsEnabled);
        }
      } catch (error) {
        console.error('Error checking biometrics:', error);
      }
    };
    
    checkBiometrics();
  }, []);
  
  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      
      // Authenticate with biometrics
      const success = await authService.authenticateWithBiometrics();
      
      if (success) {
        // In a real app, we would retrieve stored credentials and log in
        // For this demo, we'll simulate a successful login
        
        // Get the stored email from AsyncStorage (if available)
        const userJson = await AsyncStorage.getItem('user');
        let email = 'user@example.com'; // Default fallback
        
        if (userJson) {
          const userData = JSON.parse(userJson);
          email = userData.email || email;
        }
        
        // Create a dummy auth user with a 'user' role
        const authUser: authService.AuthUser = {
          id: 'biometric-auth-user',
          email: email,
          displayName: 'Biometric User',
          role: 'user',
          tokenExpiry: Date.now() + 3600000, // 1 hour
        };
        
        // Store auth user
        await AsyncStorage.setItem('biometricUser', JSON.stringify(authUser));
        
        // Call success callback or navigate
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          navigation.navigate('Dashboard');
        }
        
        // Show success message
        if (Platform.OS === 'web') {
          alert('Successfully authenticated with biometrics!');
        } else {
          Alert.alert('Success', 'Successfully authenticated with biometrics!');
        }
      } else {
        // Authentication failed
        if (Platform.OS === 'web') {
          alert('Biometric authentication failed. Please try again or use password.');
        } else {
          Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again or use password.');
        }
      }
    } catch (error) {
      console.error('Error with biometric authentication:', error);
      
      if (Platform.OS === 'web') {
        alert('Error with biometric authentication. Please try again or use password.');
      } else {
        Alert.alert('Error', 'Error with biometric authentication. Please try again or use password.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If biometrics are not available or not enabled, don't render the button
  if (!available || !enabled) {
    return null;
  }
  
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleBiometricAuth}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="finger-print" size={24} color="#fff" />
          <Text style={styles.buttonText}>Login with Biometrics</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2C8500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BiometricLoginButton; 