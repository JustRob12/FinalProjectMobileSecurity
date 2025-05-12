import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type TransactionDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TransactionDetail'>;
type TransactionDetailScreenRouteProp = RouteProp<RootStackParamList, 'TransactionDetail'>;

const TransactionDetailScreen = () => {
  const navigation = useNavigation<TransactionDetailScreenNavigationProp>();
  const route = useRoute<TransactionDetailScreenRouteProp>();
  const { transactionId } = route.params;
  
  const [transaction, setTransaction] = useState<api.Transaction | null>(null);
  const [wallet, setWallet] = useState<api.Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactionData();
  }, [transactionId]);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      // Load transaction details
      const transactionData = await api.getTransaction(transactionId);
      setTransaction(transactionData);
      
      // Load associated wallet
      const walletData = await api.getWallet(transactionData.wallet_id);
      setWallet(walletData);
    } catch (error) {
      console.error('Error loading transaction details:', error);
      showAlert('Error', 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (transaction) {
      navigation.navigate('TransactionForm', { 
        mode: 'edit', 
        transactionId: transaction.id 
      });
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('Are you sure you want to delete this transaction?');
          resolve(confirmed);
        } else {
          Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
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
        await api.deleteTransaction(transaction.id);
        showAlert('Success', 'Transaction deleted successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showAlert('Error', 'Failed to delete transaction');
        setLoading(false);
      }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  if (!transaction || !wallet) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>Transaction not found</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[
          styles.transactionTypeTag,
          { backgroundColor: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.transactionTypeText}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </Text>
        </View>
        
        <Text style={styles.amount}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
      
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{transaction.category}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {new Date(transaction.transaction_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Wallet</Text>
          <Text style={styles.detailValue}>{wallet.name}</Text>
        </View>
        
        {transaction.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{transaction.description}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {new Date(transaction.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={handleEdit}
        >
          <Ionicons name="pencil-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionTypeTag: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  transactionTypeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default TransactionDetailScreen; 