const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase-admin');
const db = require('../config/database');
const { verifyToken, hasRole } = require('../middleware/authMiddleware');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate a new token with a short expiration (1 hour)
const generateToken = async (uid, role = 'user') => {
  const additionalClaims = {
    role: role,
    // Add other custom claims as needed
  };
  
  // Create a custom token with the role claim
  // This will expire in 1 hour (3600 seconds)
  return await admin.auth().createCustomToken(uid, additionalClaims);
};

// Refresh JWT token
router.post('/refresh-token', verifyToken, async (req, res) => {
  try {
    // Get the user ID from the verified token
    const uid = req.user.uid;
    
    // Check if user exists in database
    const [users] = await db.query(
      'SELECT role FROM users WHERE firebase_uid = ?',
      [uid]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user role from database
    const role = users[0].role || 'user';
    
    // Generate a new token with the user's role
    const token = await generateToken(uid, role);
    
    res.json({
      success: true,
      token: token,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message
    });
  }
});

// Get user role
router.get('/role', verifyToken, async (req, res) => {
  try {
    // Get the user ID from the verified token
    const uid = req.user.uid;
    
    // Check if user exists in database
    const [users] = await db.query(
      'SELECT role FROM users WHERE firebase_uid = ?',
      [uid]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user role from database
    const role = users[0].role || 'user';
    
    res.json({
      success: true,
      role: role
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user role',
      error: error.message
    });
  }
});

// Example of an admin-only endpoint
router.get('/admin', verifyToken, hasRole('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'You have access to admin resources',
    user: req.user
  });
});

// Example of a user-level endpoint
router.get('/user', verifyToken, hasRole('user'), (req, res) => {
  res.json({
    success: true,
    message: 'You have access to user resources',
    user: req.user
  });
});

// Example of a guest-level endpoint (any authenticated user)
router.get('/guest', verifyToken, hasRole('guest'), (req, res) => {
  res.json({
    success: true,
    message: 'You have access to guest resources',
    user: req.user
  });
});

module.exports = router; 