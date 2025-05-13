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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

type TransactionFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TransactionForm'>;
type TransactionFormScreenRouteProp = RouteProp<RootStackParamList, 'TransactionForm'>;

type FormData = {
  wallet_id: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  transaction_date: Date;
};

const TransactionFormScreen = () => {
  const navigation = useNavigation<TransactionFormScreenNavigationProp>();
  const route = useRoute<TransactionFormScreenRouteProp>();
  const { mode, transactionId } = route.params || { mode: 'create' };
  
  const [formData, setFormData] = useState<FormData>({
    wallet_id: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    transaction_date: new Date(),
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [wallets, setWallets] = useState<api.Wallet[]>([]);
  const [categories, setCategories] = useState<api.Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && transactionId) {
      loadTransactionData(transactionId);
    }
  }, [mode, transactionId]);

  const loadFormData = async () => {
    try {
      setInitialLoading(true);
      // Load wallets
      const walletsData = await api.getWallets();
      setWallets(walletsData);
      
      if (walletsData.length > 0) {
        setFormData(prev => ({ ...prev, wallet_id: walletsData[0].id.toString() }));
      }
      
      // Load categories
      const categoriesData = await api.getCategories();
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        const defaultCategory = categoriesData.find(c => c.type === 'expense') || categoriesData[0];
        setFormData(prev => ({ ...prev, category: defaultCategory.name }));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      showAlert('Error', 'Failed to load initial data');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadTransactionData = async (id: number) => {
    try {
      const transaction = await api.getTransaction(id);
      setFormData({
        wallet_id: transaction.wallet_id.toString(),
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description || '',
        transaction_date: new Date(transaction.transaction_date),
      });
    } catch (error) {
      console.error('Error loading transaction:', error);
      showAlert('Error', 'Failed to load transaction data');
    }
  };

  const handleChange = (name: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.wallet_id) {
      newErrors.wallet_id = 'Wallet is required';
    }
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
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
      
      const transactionData = {
        wallet_id: parseInt(formData.wallet_id),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        transaction_date: formData.transaction_date.toISOString(),
      };
      
      if (mode === 'edit' && transactionId) {
        await api.updateTransaction(transactionId, transactionData);
        showAlert('Success', 'Transaction updated successfully');
      } else {
        await api.createTransaction(transactionData);
        showAlert('Success', 'Transaction created successfully');
      }
      
      navigation.goBack();
      
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} transaction:`, error);
      showAlert('Error', `Failed to ${mode === 'edit' ? 'update' : 'create'} transaction`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleChange('transaction_date', selectedDate);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === 'both' || category.type === formData.type
  );

  // Create a map to filter out duplicate category names
  const uniqueCategories = filteredCategories.reduce((unique, category) => {
    if (!unique.some(item => item.name === category.name)) {
      unique.push(category);
    }
    return unique;
  }, [] as api.Category[]);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading data...</Text>
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
          <Text style={styles.label}>Transaction Type *</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.selectedTypeButton,
                formData.type === 'income' && { backgroundColor: '#4CAF50' }
              ]}
              onPress={() => handleChange('type', 'income')}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'income' && styles.selectedTypeButtonText
              ]}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.selectedTypeButton,
                formData.type === 'expense' && { backgroundColor: '#F44336' }
              ]}
              onPress={() => handleChange('type', 'expense')}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'expense' && styles.selectedTypeButtonText
              ]}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'transfer' && styles.selectedTypeButton,
                formData.type === 'transfer' && { backgroundColor: '#FF9800' }
              ]}
              onPress={() => handleChange('type', 'transfer')}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'transfer' && styles.selectedTypeButtonText
              ]}>Transfer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Wallet *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.wallet_id}
              onValueChange={(value: string) => handleChange('wallet_id', value)}
              style={styles.picker}
              enabled={!loading}
            >
              {wallets.map(wallet => (
                <Picker.Item
                  key={wallet.id}
                  label={`${wallet.name} (${wallet.balance} ${wallet.currency})`}
                  value={wallet.id.toString()}
                />
              ))}
            </Picker>
          </View>
          {errors.wallet_id ? <Text style={styles.errorText}>{errors.wallet_id}</Text> : null}

          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={[styles.input, errors.amount ? styles.inputError : null]}
            value={formData.amount}
            onChangeText={(value) => handleChange('amount', value)}
            placeholder="0.00"
            keyboardType="numeric"
            editable={!loading}
          />
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value: string) => handleChange('category', value)}
              style={styles.picker}
              enabled={!loading}
            >
              {uniqueCategories.map(category => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.name}
                />
              ))}
            </Picker>
          </View>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Add notes about the transaction"
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text style={styles.dateButtonText}>
              {formData.transaction_date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.transaction_date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'edit' ? 'Update Transaction' : 'Add Transaction'}
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
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedTypeButtonText: {
    color: '#fff',
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
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
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
});

export default TransactionFormScreen; 