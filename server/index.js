require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const googleAuthRoutes = require('./routes/google-auth');
const financeRoutes = require('./routes/finance');
const plaidRoutes = require('./routes/plaid');
const db = require('./config/database');

const app = express();

// Enhanced CORS settings
app.use(cors({
  origin: [
    'http://localhost:19006', // Web client in development
    'http://localhost:19000', // Expo client
    'http://192.168.56.1:19000', // Expo client on local network
    'http://192.168.56.1:19006', // Web client on local network
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/google-auth', googleAuthRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/plaid', plaidRoutes);

// Simple route to check Firebase credentials
app.get('/api/check-firebase', (req, res) => {
  res.json({
    message: 'Firebase credentials loaded',
    project_id: process.env.FIREBASE_PROJECT_ID || 'oauth-4df77',
    firebase_client_email_set: !!process.env.FIREBASE_CLIENT_EMAIL,
    firebase_private_key_set: !!process.env.FIREBASE_PRIVATE_KEY
  });
});

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api`);
  console.log(`Access the API on your network at http://192.168.56.1:${PORT}/api`);
}); 