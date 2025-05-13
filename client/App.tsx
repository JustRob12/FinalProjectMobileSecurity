import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import FinanceDashboardScreen from './screens/FinanceDashboardScreen';
import WalletsScreen from './screens/WalletsScreen';
import WalletFormScreen from './screens/WalletFormScreen';
import WalletDetailScreen from './screens/WalletDetailScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import TransactionFormScreen from './screens/TransactionFormScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import LinkedAccountsScreen from './screens/LinkedAccountsScreen';

import { initializeSecureStorage } from './services/secureStorage';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  FinanceDashboard: undefined;
  Wallets: undefined;
  WalletForm: { mode: 'create' | 'edit', walletId?: number };
  WalletDetail: { walletId: number };
  Transactions: undefined;
  TransactionForm: { mode: 'create' | 'edit', transactionId?: number, wallet_id?: number };
  TransactionDetail: { transactionId: number };
  LinkedAccounts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize secure storage and other security features
    const initSecurity = async () => {
      try {
        await initializeSecureStorage();
        // Other security initializations can go here
        setInitializing(false);
      } catch (error) {
        console.error('Failed to initialize security:', error);
        setInitError('Failed to initialize security features. Please restart the app.');
        setInitializing(false);
      }
    };

    initSecurity();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Initializing secure environment...</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          {initError}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Register' }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            headerLeft: () => null, // Disable back button
          }}
        />
        <Stack.Screen
          name="FinanceDashboard"
          component={FinanceDashboardScreen}
          options={{
            title: 'Finance',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="Wallets"
          component={WalletsScreen}
          options={{
            title: 'My Wallets',
          }}
        />
        <Stack.Screen
          name="WalletForm"
          component={WalletFormScreen}
          options={({ route }) => ({
            title: route.params?.mode === 'edit' ? 'Edit Wallet' : 'New Wallet',
          })}
        />
        <Stack.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{
            title: 'Transactions',
          }}
        />
        <Stack.Screen
          name="TransactionForm"
          component={TransactionFormScreen}
          options={({ route }) => ({
            title: route.params?.mode === 'edit' ? 'Edit Transaction' : 'New Transaction',
          })}
        />
        <Stack.Screen
          name="TransactionDetail"
          component={TransactionDetailScreen}
          options={{
            title: 'Transaction Details',
          }}
        />
        <Stack.Screen
          name="WalletDetail"
          component={WalletDetailScreen}
          options={{
            title: 'Wallet Details',
          }}
        />
        <Stack.Screen
          name="LinkedAccounts"
          component={LinkedAccountsScreen}
          options={{
            title: 'Linked Bank Accounts',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
