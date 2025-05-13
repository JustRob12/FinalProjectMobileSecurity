import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';
import { attemptBackgroundSync } from '../services/syncService';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../components/ConfirmationModal';
import UserAvatar from '../components/UserAvatar';

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
  const [financeSummary, setFinanceSummary] = useState<api.FinancialSummary | null>(null);
  const [wallets, setWallets] = useState<api.Wallet[]>([]);
  const [logoutConfirmationVisible, setLogoutConfirmationVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);

  useEffect(() => {
    loadUserData();
    loadFinanceData();
    
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

  const loadFinanceData = async () => {
    try {
      // Load wallets
      const walletsData = await api.getWallets();
      setWallets(walletsData);

      // Load financial summary
      const summaryData = await api.getFinancialSummary('month');
      setFinanceSummary(summaryData);
    } catch (error) {
      console.error('Error loading finance data:', error);
    }
  };

  const confirmLogout = () => {
    setLogoutConfirmationVisible(true);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      setLogoutConfirmationVisible(false);
      await api.logout();
      
      // Show success modal before navigating
      setLogoutSuccessVisible(true);
    } catch (error) {
      console.error('Error during logout:', error);
      setLogoutLoading(false);
    }
  };

  const handleLogoutSuccessConfirm = () => {
    setLogoutSuccessVisible(false);
    setLogoutLoading(false);
    navigation.navigate('Login');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PHP',
    });
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
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <UserAvatar
            photoURL={photoURL}
            displayName={username}
            size={80}
          />
          <Text style={styles.title}>Welcome, {username}!</Text>
          {email && <Text style={styles.emailText}>{email}</Text>}
          {syncStatus && <Text style={styles.syncText}>{syncStatus}</Text>}
        </View>
        
        <Text style={styles.subtitle}>You are successfully logged in!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{financeSummary ? wallets.length : 0}</Text>
            <Text style={styles.statLabel}>Wallets</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{financeSummary ? formatCurrency(financeSummary.totalBalance) : '₱0.00'}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{financeSummary ? formatCurrency(financeSummary.netSavings) : '₱0.00'}</Text>
            <Text style={styles.statLabel}>Savings</Text>
          </View>
        </View>

        {financeSummary && (
          <View style={styles.financeSummaryCard}>
            <Text style={styles.financeSummaryTitle}>Monthly Summary</Text>
            
            <View style={styles.financeSummaryRow}>
              <View style={styles.financeSummaryItem}>
                <View style={[styles.iconCircle, {backgroundColor: 'rgba(76, 175, 80, 0.2)'}]}>
                  <Ionicons name="arrow-down-outline" size={16} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.financeSummaryLabel}>Income</Text>
                  <Text style={[styles.financeSummaryValue, {color: '#4CAF50'}]}>
                    {formatCurrency(financeSummary.totalIncome)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.financeSummaryDivider} />
              
              <View style={styles.financeSummaryItem}>
                <View style={[styles.iconCircle, {backgroundColor: 'rgba(244, 67, 54, 0.2)'}]}>
                  <Ionicons name="arrow-up-outline" size={16} color="#F44336" />
                </View>
                <View>
                  <Text style={styles.financeSummaryLabel}>Expenses</Text>
                  <Text style={[styles.financeSummaryValue, {color: '#F44336'}]}>
                    {formatCurrency(financeSummary.totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => navigation.navigate('FinanceDashboard')}
          >
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.featureButtonText}>Finance Tracker</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, logoutLoading && styles.buttonDisabled]} 
          onPress={confirmLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={logoutConfirmationVisible}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Yes, Logout"
        confirmColor="#FF3B30"
        onConfirm={handleLogout}
        onClose={() => setLogoutConfirmationVisible(false)}
      />

      {/* Logout Success Modal */}
      <ConfirmationModal
        visible={logoutSuccessVisible}
        title="Logged Out"
        message="You have been successfully logged out."
        confirmText="OK"
        confirmColor="#4CAF50"
        onConfirm={handleLogoutSuccessConfirm}
      />
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  financeSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  financeSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  financeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  financeSummaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  financeSummaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  financeSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  featuresContainer: {
    marginVertical: 20,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0e1f9',
  },
  featureButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 12,
  },
}); 