import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import PlaidLinkButton from '../components/PlaidLinkButton';
import { Ionicons } from '@expo/vector-icons';

type LinkedAccountsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LinkedAccounts'>;

type Account = {
  account_id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string;
  };
};

const LinkedAccountsScreen = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<LinkedAccountsScreenNavigationProp>();

  // Function to load accounts
  const loadAccounts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.api.get('/plaid/accounts');
      if (response.data.success) {
        setAccounts(response.data.accounts || []);
      } else {
        // If the server response indicates failure but it's not a critical error,
        // we can just show an empty state instead of an error
        console.log('Server returned unsuccessful response:', response.data.message);
        setAccounts([]);
      }
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      
      // If it's a 404 error, it likely means there are no accounts yet,
      // so we should just show the empty state, not an error
      if (error.response?.status === 404) {
        console.log('No linked accounts available yet (404)');
        setAccounts([]);
        return;
      }
      
      // For other errors, we can log them but don't need to show an alert
      // as requested by the user
      const errorMessage = error.response?.data?.message || 'Failed to load accounts';
      console.log('Account loading error:', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load accounts on initial render and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    loadAccounts(false);
  }, [loadAccounts]);

  // Handle Plaid Link success
  const handlePlaidSuccess = useCallback(() => {
    // Reload accounts after successfully linking a new account
    loadAccounts();
  }, [loadAccounts]);

  // Render an account item
  const renderAccountItem = ({ item }: { item: Account }) => (
    <View style={styles.accountItem}>
      <View style={styles.accountIcon}>
        <Ionicons 
          name={getAccountIcon(item.type, item.subtype)} 
          size={24} 
          color="#007AFF" 
        />
      </View>
      <View style={styles.accountDetails}>
        <Text style={styles.accountName}>{item.name}</Text>
        <Text style={styles.accountInfo}>
          {item.mask ? `••••${item.mask}` : ""} • {capitalizeFirstLetter(item.subtype || item.type)}
        </Text>
      </View>
      <View style={styles.accountBalance}>
        <Text style={styles.balanceText}>
          {formatCurrency(item.balances.available || item.balances.current || 0, item.balances.iso_currency_code)}
        </Text>
      </View>
    </View>
  );

  // Helper function to format currency
  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Helper function to get appropriate icon for account type
  const getAccountIcon = (type: string, subtype: string) => {
    if (type === 'depository') {
      if (subtype === 'checking') return 'wallet-outline';
      if (subtype === 'savings') return 'wallet-outline';
      return 'wallet-outline';
    } else if (type === 'credit') {
      return 'card-outline';
    } else if (type === 'loan') {
      return 'cash-outline';
    } else if (type === 'investment') {
      return 'trending-up-outline';
    }
    return 'wallet-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Linked Accounts</Text>
        <Text style={styles.subtitle}>Connect your bank accounts to automatically track transactions</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : (
        <>
          {accounts.length > 0 ? (
            <FlatList
              data={accounts}
              renderItem={renderAccountItem}
              keyExtractor={(item) => item.account_id}
              style={styles.accountsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={() => (
                <View style={styles.footerContainer}>
                  <PlaidLinkButton onSuccess={handlePlaidSuccess} />
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="wallet-outline" size={80} color="#ccc" />
              <Text style={styles.emptyStateText}>No accounts linked yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Connect your bank accounts to automatically import transactions
              </Text>
              <View style={styles.linkButtonContainer}>
                <PlaidLinkButton onSuccess={handlePlaidSuccess} />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  accountsList: {
    flex: 1,
  },
  accountItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountInfo: {
    fontSize: 14,
    color: '#666',
  },
  accountBalance: {
    paddingLeft: 12,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  linkButtonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  footerContainer: {
    padding: 20,
  },
});

export default LinkedAccountsScreen; 