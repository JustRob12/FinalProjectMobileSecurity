import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../components/UserAvatar';

type FinanceDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FinanceDashboard'>;

const FinanceDashboardScreen = () => {
  const navigation = useNavigation<FinanceDashboardScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<api.FinancialSummary | null>(null);
  const [wallets, setWallets] = useState<api.Wallet[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [userProfile, setUserProfile] = useState<{ displayName?: string, photoURL?: string | null }>({});

  useEffect(() => {
    loadFinanceData();
    loadUserProfile();
  }, [selectedPeriod]);

  const loadUserProfile = async () => {
    try {
      const userData = await api.getUserProfile();
      console.log('User profile loaded:', userData);
      setUserProfile(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      // Load wallets
      const walletsData = await api.getWallets();
      setWallets(walletsData);

      // Load financial summary
      const summaryData = await api.getFinancialSummary(selectedPeriod);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFinanceData();
    loadUserProfile();
  };

  const handleAddWallet = () => {
    navigation.navigate('WalletForm', { mode: 'create' });
  };

  const handleAddTransaction = () => {
    navigation.navigate('TransactionForm', { mode: 'create' });
  };

  const handleViewAllTransactions = () => {
    navigation.navigate('Transactions');
  };
  
  const handleViewWallets = () => {
    navigation.navigate('Wallets');
  };

  const handleViewLinkedAccounts = () => {
    navigation.navigate('LinkedAccounts');
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading financial data...</Text>
      </View>
    );
  }

  // Calculate percentages for expense breakdown
  const totalExpenses = summary?.totalExpenses || 0;
  const expensePercentages = summary?.expensesByCategory?.map(item => ({
    ...item,
    percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0
  })) || [];

  return (
    <View style={styles.mainContainer}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Finance Dashboard</Text>
          {userProfile.displayName && (
            <Text style={styles.headerSubtitle}>Welcome back, {userProfile.displayName}</Text>
          )}
        </View>
        <TouchableOpacity onPress={navigateToProfile}>
          <UserAvatar
            photoURL={userProfile.photoURL}
            displayName={userProfile.displayName}
            size={40}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Period selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'day' && styles.selectedPeriodButton]} 
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.selectedPeriodButtonText]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'week' && styles.selectedPeriodButton]} 
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.selectedPeriodButtonText]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriodButton]} 
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.selectedPeriodButtonText]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriodButton]} 
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.selectedPeriodButtonText]}>Year</Text>
          </TouchableOpacity>
        </View>

        {/* Main metrics card */}
        <View style={styles.mainMetricCard}>
          <Text style={styles.mainMetricTitle}>Total Balance</Text>
          <Text style={styles.mainMetricValue}>{summary ? formatCurrency(summary.totalBalance) : '₱0.00'}</Text>
          
          <View style={styles.mainMetricDetails}>
            <View style={styles.metricItem}>
              <View style={[styles.iconCircle, {backgroundColor: 'rgba(76, 175, 80, 0.2)'}]}>
                <Ionicons name="arrow-down-outline" size={16} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.metricLabel}>Income</Text>
                <Text style={[styles.metricValue, {color: '#4CAF50'}]}>{summary ? formatCurrency(summary.totalIncome) : '₱0.00'}</Text>
              </View>
            </View>
            
            <View style={styles.metricDivider} />
            
            <View style={styles.metricItem}>
              <View style={[styles.iconCircle, {backgroundColor: 'rgba(244, 67, 54, 0.2)'}]}>
                <Ionicons name="arrow-up-outline" size={16} color="#F44336" />
              </View>
              <View>
                <Text style={styles.metricLabel}>Expenses</Text>
                <Text style={[styles.metricValue, {color: '#F44336'}]}>{summary ? formatCurrency(summary.totalExpenses) : '₱0.00'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wallets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Wallets</Text>
          <TouchableOpacity onPress={handleViewWallets}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.walletsContainer}>
          {wallets.map(wallet => (
            <TouchableOpacity 
              key={wallet.id} 
              style={styles.walletCard}
              onPress={() => navigation.navigate('WalletDetail', { walletId: wallet.id })}
            >
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={20} color="#fff" />
              </View>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletBalance}>{formatCurrency(wallet.balance)}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.addWalletCard} onPress={handleAddWallet}>
            <Ionicons name="add-circle" size={28} color="#007AFF" />
            <Text style={styles.addWalletText}>Add Wallet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Linked Accounts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
          <TouchableOpacity onPress={handleViewLinkedAccounts}>
            <Text style={styles.viewAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linkedAccountsContainer}>
          <TouchableOpacity style={styles.linkedAccountsCard} onPress={handleViewLinkedAccounts}>
            <View style={styles.linkedAccountsIcon}>
              <Ionicons name="card-outline" size={24} color="#2C8500" />
            </View>
            <View style={styles.linkedAccountsContent}>
              <Text style={styles.linkedAccountsTitle}>Connect Bank Accounts</Text>
              <Text style={styles.linkedAccountsSubtitle}>Link your accounts to automatically track transactions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Expense Breakdown */}
        {summary && summary.expensesByCategory && summary.expensesByCategory.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            </View>
            
            <View style={styles.expenseBreakdownContainer}>
              {expensePercentages.slice(0, 4).map((item, index) => (
                <View key={index} style={styles.expenseCategory}>
                  <View style={styles.expenseLabelContainer}>
                    <View style={[styles.expenseDot, {backgroundColor: getCategoryColor(item.category)}]} />
                    <Text style={styles.expenseCategoryName}>{item.category}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatCurrency(item.total)}</Text>
                  <View style={styles.expenseBarContainer}>
                    <View 
                      style={[
                        styles.expenseBar, 
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: getCategoryColor(item.category)
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
              
              {expensePercentages.length > 4 && (
                <TouchableOpacity style={styles.moreExpensesButton}>
                  <Text style={styles.moreExpensesText}>View more categories</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={handleViewAllTransactions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {summary && summary.recentTransactions.length > 0 ? (
          <View style={styles.transactionsContainer}>
            {summary.recentTransactions.map(transaction => (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: transaction.id })}
              >
                <View style={[
                  styles.transactionIconContainer, 
                  { backgroundColor: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
                ]}>
                  <Ionicons 
                    name={transaction.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                    size={18} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  <Text style={styles.transactionDescription}>{transaction.description || transaction.wallet_name}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
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
        )}

        {/* Add some space at the bottom */}
        <View style={{height: 80}} />
      </ScrollView>

      {/* Add transaction button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddTransaction}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Helper function to get color for expense categories
const getCategoryColor = (category: string): string => {
  const colors = {
    'Food': '#FF9800',
    'Groceries': '#4CAF50',
    'Transport': '#2196F3',
    'Entertainment': '#9C27B0',
    'Shopping': '#F44336',
    'Utilities': '#607D8B',
    'Rent': '#795548',
    'Health': '#E91E63',
    'Education': '#3F51B5',
    'Travel': '#00BCD4',
  };
  
  // @ts-ignore
  return colors[category] || '#607D8B'; // Return gray as default
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
    paddingVertical: 15,
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  mainMetricCard: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainMetricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mainMetricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  mainMetricDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 15,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  walletsContainer: {
    paddingLeft: 15,
    marginBottom: 15,
  },
  walletCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addWalletCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginRight: 15,
    width: 150,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addWalletText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  expenseBreakdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 15,
    marginTop: 0,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseCategory: {
    marginBottom: 12,
  },
  expenseLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  expenseCategoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  expenseBar: {
    height: '100%',
    borderRadius: 3,
  },
  moreExpensesButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  moreExpensesText: {
    fontSize: 14,
    color: '#007AFF',
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 15,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
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
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 30,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 15,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  linkedAccountsContainer: {
    padding: 15,
  },
  linkedAccountsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkedAccountsIcon: {
    marginRight: 16,
  },
  linkedAccountsContent: {
    flex: 1,
  },
  linkedAccountsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  linkedAccountsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default FinanceDashboardScreen; 