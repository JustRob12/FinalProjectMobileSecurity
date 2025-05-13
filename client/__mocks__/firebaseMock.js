// Firebase mock
const firebaseMock = {
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
};

module.exports = firebaseMock; 