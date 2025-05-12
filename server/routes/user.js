const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const db = require('../config/database');

// Protected route - get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Firebase user ID from the verified token
    const firebaseUid = req.user.uid;
    
    // First, check if user exists in our database
    const [users] = await db.query('SELECT * FROM users WHERE firebase_uid = ?', [firebaseUid]);
    
    if (users.length === 0) {
      // Create a new user record in the database if they don't exist yet
      // This is useful for storing additional user data not in Firebase
      const [result] = await db.query(
        'INSERT INTO users (firebase_uid, email, username) VALUES (?, ?, ?)',
        [firebaseUid, req.user.email, req.user.name || req.user.email.split('@')[0]]
      );
      
      return res.status(201).json({
        message: 'User profile created',
        user: {
          id: result.insertId,
          email: req.user.email,
          username: req.user.name || req.user.email.split('@')[0],
          firebase_uid: firebaseUid
        }
      });
    }
    
    // Return existing user data
    const user = users[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error in user profile route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 