import React, { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { usePlaidLink } from 'react-plaid-link';
import * as api from '../services/api';
import { useNavigation } from '@react-navigation/native';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

// Define an interface for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess, onExit }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // Step 1: Get link token from your server when component mounts
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        setLoading(true);
        const response = await api.api.post('/plaid/create-link-token');
        if (response.data.success) {
          setLinkToken(response.data.link_token);
        } else {
          const errorMessage = response.data.message || 'Failed to create link token';
          if (Platform.OS === 'web') {
            alert(errorMessage);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } catch (error: unknown) {
        console.error('Error fetching link token:', error);
        const errorMessage = (error as ApiError).response?.data?.message || 'Failed to create link token';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, []);

  // Step 2: Handle success - exchange public token for access token
  const handleSuccess = useCallback(async (publicToken: string) => {
    try {
      setLoading(true);
      const response = await api.api.post('/plaid/exchange-token', { public_token: publicToken });
      
      if (response.data.success) {
        if (Platform.OS === 'web') {
          alert('Successfully linked your account!');
        } else {
          Alert.alert('Success', 'Successfully linked your account!');
        }
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Navigate back to previous screen or refresh current screen
        // This depends on your app's navigation flow
      } else {
        const errorMessage = response.data.message || 'Failed to link account';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: unknown) {
      console.error('Error exchanging public token:', error);
      const errorMessage = (error as ApiError).response?.data?.message || 'Failed to link account';
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  // Step 3: Handle exit - user closed Plaid Link
  const handleExit = useCallback(() => {
    console.log('Plaid Link closed');
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess: (public_token: string) => handleSuccess(public_token),
    onExit: () => handleExit(),
  };

  const { open, ready } = usePlaidLink(config);

  // Handle button click
  const handlePress = () => {
    if (ready) {
      open();
    } else {
      if (Platform.OS === 'web') {
        alert('Plaid Link is not ready yet. Please try again.');
      } else {
        Alert.alert('Not Ready', 'Plaid Link is not ready yet. Please try again.');
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, (!ready || loading) && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={!ready || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Connect Bank Account</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2C8500', // Plaid green color
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlaidLinkButton; 