const admin = require('firebase-admin');
require('dotenv').config();

// Process the private key to handle newlines and quotes correctly
let privateKey;
if (process.env.FIREBASE_PRIVATE_KEY) {
  // Remove quotes at the beginning and end if they exist
  privateKey = process.env.FIREBASE_PRIVATE_KEY.startsWith('"') ? 
    JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : 
    process.env.FIREBASE_PRIVATE_KEY;
  
  // Ensure newlines are properly formatted
  privateKey = privateKey.replace(/\\n/g, '\n');
} else {
  privateKey = undefined;
}

// Firebase Admin SDK credential
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'oauth-4df77',
  private_key_id: 'private-key-id', // replace with your actual private key ID
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`,
  universe_domain: 'googleapis.com'
};

// Debug information
console.log('Attempting to initialize Firebase Admin with:');
console.log('- Project ID:', serviceAccount.project_id);
console.log('- Client Email:', serviceAccount.client_email ? 'Set' : 'Not set');
console.log('- Private Key:', privateKey ? 'Set (starts with: ' + privateKey.substring(0, 20) + '...)' : 'Not set');

// Check for required credentials before initializing
if (!privateKey) {
  console.error('FIREBASE_PRIVATE_KEY is missing or invalid!');
  console.log('Environment variable value format:', typeof process.env.FIREBASE_PRIVATE_KEY);
  process.exit(1);
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('FIREBASE_CLIENT_EMAIL is missing!');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://oauth-4df77.firebaseio.com"
  });
  console.log("Firebase Admin SDK initialized successfully!");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1);
}

module.exports = admin; 