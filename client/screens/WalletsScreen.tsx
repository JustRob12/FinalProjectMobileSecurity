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
  Platform,
  Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type WalletsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Wallets'>;

const WalletsScreen = () => {
  const navigation = useNavigation<WalletsScreenNavigationProp>();
  const [wallets, setWallets] = useState<api.Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<{ displayName?: string, photoURL?: string | null }>({});
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    loadWallets();
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

  const loadWallets = async () => {
    try {
      setLoading(true);
      const walletsData = await api.getWallets();
      setWallets(walletsData);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWallets();
    loadUserProfile();
  };

  const handleAddWallet = () => {
    navigation.navigate('WalletForm', { mode: 'create' });
  };

  const handleEditWallet = (walletId: number) => {
    navigation.navigate('WalletForm', { mode: 'edit', walletId });
  };

  const handleDeleteWallet = async (walletId: number, walletName: string) => {
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(`Delete wallet "${walletName}"? This will delete all transactions associated with this wallet.`);
          resolve(confirmed);
        } else {
          Alert.alert(
            'Delete Wallet',
            `Delete wallet "${walletName}"? This will delete all transactions associated with this wallet.`,
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
        await api.deleteWallet(walletId);
        loadWallets();
      } catch (error) {
        console.error('Error deleting wallet:', error);
        
        if (Platform.OS === 'web') {
          alert('Failed to delete wallet');
        } else {
          Alert.alert('Error', 'Failed to delete wallet');
        }
        
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: currency,
    });
  };

  const navigateToProfile = () => {
    navigation.navigate('Dashboard');
  };

  const handleImageError = () => {
    console.log('Failed to load profile image, falling back to placeholder');
    setProfileImageError(true);
  };

  const renderWalletItem = ({ item }: { item: api.Wallet }) => {
    return (
      <View style={styles.walletItem}>
        <View style={styles.walletContent}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletName}>{item.name}</Text>
            <View style={styles.walletActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditWallet(item.id)}
              >
                <Ionicons name="pencil-outline" size={18} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteWallet(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.walletBalance}>
            {formatCurrency(item.balance, item.currency)}
          </Text>
          <Text style={styles.walletCurrency}>{item.currency}</Text>
          
          <View style={styles.walletFooter}>
            <Text style={styles.walletDate}>
              Created: {new Date(item.created_at).toLocaleDateString()}
            </Text>
            
            <TouchableOpacity 
              style={styles.addTransactionButton}
              onPress={() => navigation.navigate('TransactionForm', { 
                mode: 'create',
                wallet_id: item.id
              })}
            >
              <Text style={styles.addTransactionButtonText}>+ Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wallets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Wallets</Text>
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
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWalletItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="wallet-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No wallets yet</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleAddWallet}
            >
              <Text style={styles.emptyStateButtonText}>Add Your First Wallet</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddWallet}>
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
  walletItem: {
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  walletContent: {
    padding: 15,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletName: {
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  walletCurrency: {
    fontSize: 14,
    color: '#666',
  },
  walletFooter: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletDate: {
    fontSize: 12,
    color: '#999',
  },
  addTransactionButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addTransactionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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

export default WalletsScreen; 