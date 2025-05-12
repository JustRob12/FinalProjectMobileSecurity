import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as api from '../services/api';
import { Picker } from '@react-native-picker/picker';

type WalletFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WalletForm'>;
type WalletFormScreenRouteProp = RouteProp<RootStackParamList, 'WalletForm'>;

type FormData = {
  name: string;
  balance: string;
  currency: string;
  bankAccount: string;
};

// Available currencies
const CURRENCIES = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'JPY - Japanese Yen', value: 'JPY' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'CNY - Chinese Yuan', value: 'CNY' },
  { label: 'INR - Indian Rupee', value: 'INR' },
];

const WalletFormScreen = () => {
  const navigation = useNavigation<WalletFormScreenNavigationProp>();
  const route = useRoute<WalletFormScreenRouteProp>();
  const { mode, walletId } = route.params || { mode: 'create' };
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    balance: '0',
    currency: 'USD',
    bankAccount: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (mode === 'edit' && walletId) {
      loadWalletData(walletId);
    }
  }, [mode, walletId]);

  const loadWalletData = async (id: number) => {
    try {
      setInitialLoading(true);
      const wallet = await api.getWallet(id);
      setFormData({
        name: wallet.name,
        balance: wallet.balance.toString(),
        currency: wallet.currency,
        bankAccount: wallet.bankAccount || '',
      });
    } catch (error) {
      showAlert('Error', 'Failed to load wallet data');
      console.error('Error loading wallet:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Wallet name is required';
    }
    
    const balanceNum = parseFloat(formData.balance);
    if (isNaN(balanceNum)) {
      newErrors.balance = 'Balance must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const walletData = {
        name: formData.name.trim(),
        balance: parseFloat(formData.balance),
        currency: formData.currency,
        bankAccount: formData.bankAccount.trim() || undefined,
      };
      
      if (mode === 'edit' && walletId) {
        await api.updateWallet(walletId, walletData);
        showAlert('Success', 'Wallet updated successfully');
      } else {
        await api.createWallet(walletData);
        showAlert('Success', 'Wallet created successfully');
      }
      
      navigation.goBack();
      
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} wallet:`, error);
      showAlert('Error', `Failed to ${mode === 'edit' ? 'update' : 'create'} wallet`);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wallet data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Wallet Name *</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter wallet name"
            autoCapitalize="words"
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <Text style={styles.label}>Initial Balance</Text>
          <TextInput
            style={[styles.input, errors.balance ? styles.inputError : null]}
            value={formData.balance}
            onChangeText={(value) => handleChange('balance', value)}
            placeholder="0.00"
            keyboardType="numeric"
          />
          {errors.balance ? <Text style={styles.errorText}>{errors.balance}</Text> : null}

          <Text style={styles.label}>Currency</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.currency}
              onValueChange={(value) => handleChange('currency', value)}
              style={styles.picker}
            >
              {CURRENCIES.map((currency) => (
                <Picker.Item 
                  key={currency.value} 
                  label={currency.label} 
                  value={currency.value} 
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Bank Account Number (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.bankAccount}
            onChangeText={(value) => handleChange('bankAccount', value)}
            placeholder="Enter bank account number"
            keyboardType="numeric"
            secureTextEntry={true}
          />
          <Text style={styles.helperText}>This will be stored securely and tokenized.</Text>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'edit' ? 'Update Wallet' : 'Create Wallet'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 15,
    fontStyle: 'italic',
  },
});

export default WalletFormScreen; 