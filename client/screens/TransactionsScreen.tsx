import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Transactions'>;

const TransactionsScreen = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const [transactions, setTransactions] = useState<api.Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState<{[key: number]: api.Wallet}>({});
  const [userProfile, setUserProfile] = useState<{ displayName?: string, photoURL?: string | null }>({});
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await api.getUserProfile();
      setUserProfile(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Load wallets for wallet names
      const walletsData = await api.getWallets();
      const walletsMap: {[key: number]: api.Wallet} = {};
      walletsData.forEach(wallet => {
        walletsMap[wallet.id] = wallet;
      });
      setWallets(walletsMap);
      
      // Load transactions
      const transactionsData = await api.getTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
    loadUserProfile();
  };

  const handleAddTransaction = () => {
    navigation.navigate('TransactionForm', { mode: 'create' });
  };

  const navigateToProfile = () => {
    navigation.navigate('Dashboard');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PHP',
    });
  };

  const handleImageError = () => {
    console.log('Failed to load profile image, falling back to placeholder');
    setProfileImageError(true);
  };

  const renderTransactionItem = ({ item }: { item: api.Transaction }) => {
    const wallet = wallets[item.wallet_id];
    const walletName = wallet ? wallet.name : 'Unknown Wallet';
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
      >
        <View style={[
          styles.transactionIconContainer, 
          { backgroundColor: item.type === 'income' ? '#4CAF50' : '#F44336' }
        ]}>
          <Ionicons 
            name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'} 
            size={18} 
            color="#fff" 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDescription}>
            {item.description || walletName}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.transaction_date).toLocaleDateString()} • {walletName}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Transactions</Text>
          {userProfile.displayName && (
            <Text style={styles.headerSubtitle}>Hi, {userProfile.displayName}</Text>
          )}
        </View>
        <TouchableOpacity onPress={navigateToProfile}>
          {userProfile.photoURL && !profileImageError ? (
            <Image 
              source={{ uri: userProfile.photoURL }} 
              style={styles.profileImage}
              onError={handleImageError}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransactionItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleAddTransaction}
            >
              <Text style={styles.emptyStateButtonText}>Add Your First Transaction</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddTransaction}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default TransactionsScreen; 