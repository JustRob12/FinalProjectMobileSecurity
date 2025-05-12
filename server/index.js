require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
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