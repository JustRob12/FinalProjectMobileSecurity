import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Google client IDs from environment variables
const GOOGLE_WEB_CLIENT_ID = '816779798174-1431kc4pg7opl4m8jc4u7pmt66q1brmb.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '816779798174-d1fn4e5vdpi4hjqovgusnd7qhavloimf.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '816779798174-7njrlf8e8lh5fba07ut5ucndehqj64o6.apps.googleusercontent.com';

const GoogleSignInButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        // Log for debugging
        console.log('Attempting Google Sign-In with Firebase...');
        console.log('Using Web Client ID:', GOOGLE_WEB_CLIENT_ID);
        
        // Configure Google provider with the correct client ID
        googleProvider.setCustomParameters({
          'client_id': GOOGLE_WEB_CLIENT_ID,
          'prompt': 'select_account'
        });
        
        // Use try/catch specifically for the popup to get better error details
        try {
          // Web implementation
          const result = await signInWithPopup(auth, googleProvider);
          
          // Log successful sign-in
          console.log('Google Sign-In successful', result.user.email);
          
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          
          if (credential && result.user) {
            // Store user data
            await handleSuccessfulLogin(result.user);
            navigation.navigate('Dashboard');
          }
        } catch (popupError: any) {
          // Get detailed error information
          console.error('Firebase Popup Error:', popupError.code, popupError.message);
          
          // Show specific error message based on error code
          let errorMessage = 'Failed to sign in with Google. Please try again.';
          
          if (popupError.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized for OAuth operations. Please add it in the Firebase Console.';
          } else if (popupError.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was canceled. Please try again when ready.';
          } else if (popupError.code === 'auth/cancelled-popup-request') {
            errorMessage = 'The sign-in process was cancelled.';
          } else if (popupError.code === 'auth/invalid-credential') {
            errorMessage = 'The authentication credential is invalid. Please check your client ID.';
          }
          
          if (Platform.OS === 'web') {
            alert(errorMessage);
          } else {
            Alert.alert('Google Sign-In Error', errorMessage);
          }
          
          throw popupError; // Re-throw for outer catch
        }
      } else if (Platform.OS === 'android') {
        Alert.alert('Android Sign-In', 'Google Sign-In on Android is not fully implemented yet. Using Client ID: ' + GOOGLE_ANDROID_CLIENT_ID);
      } else if (Platform.OS === 'ios') {
        Alert.alert('iOS Sign-In', 'Google Sign-In on iOS is not fully implemented yet. Using Client ID: ' + GOOGLE_IOS_CLIENT_ID);
      } else {
        // For other platforms
        Alert.alert('Not Implemented', 'Google Sign-In is not implemented for this platform yet');
      }
    } catch (error: any) {
      // This will catch any errors not caught by the inner try/catch
      console.error('Error signing in with Google:', error);
      
      const errorMessage = error.message || 'Failed to sign in with Google. Please try again.';
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Authentication Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (user: any) => {
    // Create a minimal user object with important fields
    const userData = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL,
    };
    
    // Store auth data in AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    // Generate a token (in a real app, you'd get this from your server)
    const token = await user.getIdToken();
    await AsyncStorage.setItem('token', token);
    
    console.log('User data stored successfully:', userData.email);
  };

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={signInWithGoogle}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#4285F4',
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
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default GoogleSignInButton; 