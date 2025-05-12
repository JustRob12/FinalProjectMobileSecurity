import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';
import { attemptBackgroundSync } from '../services/syncService';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type UserProfile = {
  id: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  provider?: string;
  lastLogin?: string;
};

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [username, setUsername] = useState<string>('User');
  const [email, setEmail] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    
    // Attempt to sync any pending server operations
    attemptBackgroundSync()
      .then(result => {
        if (result.synced > 0) {
          setSyncStatus(`Synchronized ${result.synced} pending operations`);
        }
      })
      .catch(error => {
        console.error('Background sync failed:', error);
      });
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await api.getUserProfile();
      
      if (userData) {
        setUsername(userData.displayName || 'User');
        setEmail(userData.email || '');
        setPhotoURL(userData.photoURL || null);
        console.log('Loaded user data:', userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const errorMessage = 'Could not load user profile. Please login again.';
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
      
      // Navigate back to login screen
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await api.logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          {photoURL && (
            <Image 
              source={{ uri: photoURL }} 
              style={styles.profileImage} 
            />
          )}
          <Text style={styles.title}>Welcome, {username}!</Text>
          {email && <Text style={styles.emailText}>{email}</Text>}
          {syncStatus && <Text style={styles.syncText}>{syncStatus}</Text>}
        </View>
        
        <Text style={styles.subtitle}>You are successfully logged in!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, logoutLoading && styles.buttonDisabled]} 
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  syncText: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 