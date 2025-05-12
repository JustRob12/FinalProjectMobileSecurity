import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type WalletDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WalletDetail'>;
type WalletDetailScreenRouteProp = RouteProp<RootStackParamList, 'WalletDetail'>;

const WalletDetailScreen = () => {
  const navigation = useNavigation<WalletDetailScreenNavigationProp>();
  const route = useRoute<WalletDetailScreenRouteProp>();
  const { walletId } = route.params;
  
  const [wallet, setWallet] = useState<api.Wallet | null>(null);
  const [transactions, setTransactions] = useState<api.Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [walletId]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // Load wallet details
      const walletData = await api.getWallet(walletId);
      setWallet(walletData);
      
      // Load associated transactions
      const transactionsData = await api.getTransactions({ wallet_id: walletId });
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading wallet details:', error);
      showAlert('Error', 'Failed to load wallet details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleEditWallet = () => {
    if (wallet) {
      navigation.navigate('WalletForm', { 
        mode: 'edit', 
        walletId: wallet.id 
      });
    }
  };

  const handleDeleteWallet = async () => {
    if (!wallet) return;
    
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(`Delete wallet "${wallet.name}"? This will delete all transactions associated with this wallet.`);
          resolve(confirmed);
        } else {
          Alert.alert(
            'Delete Wallet',
            `Delete wallet "${wallet.name}"? This will delete all transactions associated with this wallet.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };
    
    const confirmed = await confirmDelete();
    if (confirmed) {
      try {
        setLoading(true);
        await api.deleteWallet(wallet.id);
        showAlert('Success', 'Wallet deleted successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error deleting wallet:', error);
        showAlert('Error', 'Failed to delete wallet');
        setLoading(false);
      }
    }
  };

  const handleAddTransaction = () => {
    if (wallet) {
      navigation.navigate('TransactionForm', { 
        mode: 'create',
        wallet_id: wallet.id
      });
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = wallet?.currency || 'PHP';
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: currency,
    });
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const renderTransactionItem = ({ item }: { item: api.Transaction }) => {
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
            {item.description || 'No description'}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.transaction_date).toLocaleDateString()}
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
        <Text style={styles.loadingText}>Loading wallet details...</Text>
      </View>
    );
  }

  if (!wallet) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>Wallet not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.walletInfoCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletName}>{wallet.name}</Text>
          <View style={styles.walletActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEditWallet}
            >
              <Ionicons name="pencil-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDeleteWallet}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.walletBalance}>{formatCurrency(wallet.balance)}</Text>
        <Text style={styles.walletCurrency}>{wallet.currency}</Text>
        
        {wallet.bankAccount && (
          <View style={styles.bankAccountContainer}>
            <Text style={styles.bankAccountLabel}>Bank Account:</Text>
            <Text style={styles.bankAccountNumber}>{wallet.bankAccount}</Text>
          </View>
        )}
        
        <View style={styles.walletStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(
                transactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(
                transactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.transactionsHeaderContainer}>
        <Text style={styles.transactionsHeader}>Recent Transactions</Text>
        <TouchableOpacity 
          style={styles.addTransactionButton} 
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTransactionButtonText}>Add</Text>
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
            <Text style={styles.emptyStateText}>No transactions in this wallet</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleAddTransaction}
            >
              <Text style={styles.emptyStateButtonText}>Add Your First Transaction</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  walletInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  walletName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  walletActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    marginLeft: 8,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  walletCurrency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  transactionsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  transactionsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addTransactionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  bankAccountContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bankAccountLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bankAccountNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
});

export default WalletDetailScreen; 