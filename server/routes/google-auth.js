const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');
const db = require('../config/database');

// Handle Google sign-in verification and database recording
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'No ID token provided' 
      });
    }
    
    // Verify the ID token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;
    
    console.log('Verified Google user:', { uid, email, name });
    
    // Begin transaction to ensure data consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check if user already exists in the users table
      const [users] = await connection.query(
        'SELECT * FROM users WHERE firebase_uid = ?', 
        [uid]
      );
      
      // If user doesn't exist, create them
      if (users.length === 0) {
        await connection.query(
          'INSERT INTO users (firebase_uid, username, email, profile_picture) VALUES (?, ?, ?, ?)',
          [uid, name || email.split('@')[0], email, picture]
        );
        console.log('Created new user record for:', email);
      }
      
      // Check if this Google user already exists in google_users table
      const [googleUsers] = await connection.query(
        'SELECT * FROM google_users WHERE firebase_uid = ?',
        [uid]
      );
      
      if (googleUsers.length === 0) {
        // Insert new Google user record
        await connection.query(
          'INSERT INTO google_users (firebase_uid, email, display_name, photo_url) VALUES (?, ?, ?, ?)',
          [uid, email, name, picture]
        );
        console.log('Created new Google user record for:', email);
      } else {
        // Update last sign-in time and other details if needed
        await connection.query(
          'UPDATE google_users SET last_sign_in = CURRENT_TIMESTAMP, display_name = ?, photo_url = ? WHERE firebase_uid = ?',
          [name, picture, uid]
        );
        console.log('Updated Google user record for:', email);
      }
      
      // Commit the transaction
      await connection.commit();
      
      // Generate custom token for client if needed
      // const customToken = await admin.auth().createCustomToken(uid);
      
      // Return success response with user data
      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        user: {
          uid,
          email,
          displayName: name,
          photoURL: picture,
          emailVerified: email_verified
        }
      });
      
    } catch (error) {
      // If error, rollback changes
      await connection.rollback();
      console.error('Database transaction error:', error);
      throw error;
    } finally {
      // Release connection back to pool
      connection.release();
    }
    
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Failed to authenticate Google user',
      error: error.message
    });
  }
});

// Get all Google users (admin only)
router.get('/users', async (req, res) => {
  try {
    const [googleUsers] = await db.query(`
      SELECT g.*, u.username 
      FROM google_users g
      JOIN users u ON g.firebase_uid = u.firebase_uid
      ORDER BY g.last_sign_in DESC
    `);
    
    res.status(200).json({
      success: true,
      count: googleUsers.length,
      users: googleUsers
    });
  } catch (error) {
    console.error('Error fetching Google users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Google users',
      error: error.message
    });
  }
});

module.exports = router; 