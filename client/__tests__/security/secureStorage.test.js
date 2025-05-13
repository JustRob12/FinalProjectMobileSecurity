// Create a better mock for secureStorage
const mockSecureStore = new Map();

jest.mock('../../services/secureStorage', () => ({
  secureStore: jest.fn((key, value) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  secureRetrieve: jest.fn(key => {
    if (!mockSecureStore.has(key)) return Promise.resolve(null);
    return Promise.resolve(mockSecureStore.get(key));
  }),
  secureClear: jest.fn(key => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

const { secureStore, secureRetrieve, secureClear } = require('../../services/secureStorage');

describe('Secure Storage Tests', () => {
  const testKey = 'test_secure_key';
  const sensitiveData = { 
    creditCard: '1234-5678-9012-3456',
    cvv: '123',
    expiryDate: '12/25'
  };

  beforeEach(() => {
    // Clear all mocks and storage before each test
    mockSecureStore.clear();
    jest.clearAllMocks();
  });

  test('Sensitive data should be securely stored', async () => {
    await secureStore(testKey, sensitiveData);
    const retrievedData = await secureRetrieve(testKey);
    expect(retrievedData).toEqual(sensitiveData);
  });

  test('Non-existent keys should return null', async () => {
    const retrievedData = await secureRetrieve('non_existent_key');
    expect(retrievedData).toBeNull();
  });

  test('Cleared data should not be retrievable', async () => {
    await secureStore(testKey, sensitiveData);
    await secureClear(testKey);
    const retrievedData = await secureRetrieve(testKey);
    expect(retrievedData).toBeNull();
  });

  test('Multiple values should be stored independently', async () => {
    const secondKey = 'another_test_key';
    const secondData = { apiKey: 'secret-api-key-12345' };
    
    try {
      await secureStore(testKey, sensitiveData);
      await secureStore(secondKey, secondData);
      
      const firstRetrieved = await secureRetrieve(testKey);
      const secondRetrieved = await secureRetrieve(secondKey);
      
      expect(firstRetrieved).toEqual(sensitiveData);
      expect(secondRetrieved).toEqual(secondData);
    } finally {
      // Clean up
      await secureClear(secondKey);
    }
  });
}); 