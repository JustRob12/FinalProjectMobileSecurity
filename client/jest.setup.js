// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock SecureStore if using Expo
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock firebase config
jest.mock('./config/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
  googleProvider: {},
  app: {
    name: '[DEFAULT]',
  },
}));

// Mock CryptoJS for encryption tests
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted-data' })),
    decrypt: jest.fn(() => ({ toString: () => 'decrypted-data' })),
  },
  enc: {
    Utf8: 'utf8-encoding',
    Hex: 'hex-encoding',
  },
  lib: {
    WordArray: {
      random: jest.fn(() => ({ 
        toString: () => '123456789abcdef'
      })),
    },
  },
}));

// Mock axios for API testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
      baseURL: 'https://example.com/api',
    },
  })),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock for our internal service files
jest.mock('./services/tokenization', () => ({
  tokenize: jest.fn(data => Promise.resolve(`tokenized-${data}`)),
  detokenize: jest.fn(token => {
    if (token === 'invalid-token-123') return Promise.resolve(null);
    return Promise.resolve('1234567890123456');
  }),
}));

jest.mock('./services/secureStorage', () => ({
  secureStore: jest.fn((key, value) => Promise.resolve()),
  secureRetrieve: jest.fn(key => {
    if (key === 'non_existent_key') return Promise.resolve(null);
    if (key === 'test_secure_key') return Promise.resolve({ 
      creditCard: '1234-5678-9012-3456',
      cvv: '123',
      expiryDate: '12/25'
    });
    if (key === 'another_test_key') return Promise.resolve({ 
      apiKey: 'secret-api-key-12345' 
    });
    return Promise.resolve(null);
  }),
  secureClear: jest.fn(key => Promise.resolve()),
}));

// Mock for react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn(obj => obj.android || obj.default)
  }
}));

// Configure console
global.console = {
  ...console,
  // Uncomment to ignore specific console outputs during tests
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}; 