const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const plaidClient = require('../config/plaid');
const db = require('../config/database');

// Create a link token to initialize Plaid Link
router.post('/create-link-token', verifyToken, async (req, res) => {
  try {
    // Verify user exists in our database
    const [users] = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [req.user.uid]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = users[0].id;
    
    // Create a link token with configs
    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: req.user.uid,  // Use firebase UID as client user ID
      },
      client_name: 'Mobile Security Finance App',
      products: ['transactions'],
      country_codes: ['US'], // Using only US as it's supported in sandbox
      language: 'en',
      webhook: 'https://your-webhook-url.com/plaid-webhook', // Replace with your webhook URL
    });
    
    res.json({
      success: true,
      link_token: createTokenResponse.data.link_token,
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create link token',
      error: error.message,
    });
  }
});

// Exchange public token for access token
router.post('/exchange-token', verifyToken, async (req, res) => {
  try {
    const { public_token } = req.body;
    
    if (!public_token) {
      return res.status(400).json({ success: false, message: 'Missing public token' });
    }
    
    // Exchange the public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    // Get the user ID
    const [users] = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [req.user.uid]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = users[0].id;
    
    // Check if this Plaid item already exists for the user
    const [existingItems] = await db.query(
      'SELECT * FROM plaid_items WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );
    
    // Store or update the access token in the database
    if (existingItems.length === 0) {
      // Insert new item
      await db.query(
        'INSERT INTO plaid_items (user_id, item_id, access_token, created_at) VALUES (?, ?, ?, NOW())',
        [userId, itemId, accessToken]
      );
    } else {
      // Update existing item
      await db.query(
        'UPDATE plaid_items SET access_token = ?, updated_at = NOW() WHERE id = ?',
        [accessToken, existingItems[0].id]
      );
    }
    
    res.json({
      success: true,
      message: 'Successfully linked account',
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to exchange token',
      error: error.message,
    });
  }
});

// Get accounts
router.get('/accounts', verifyToken, async (req, res) => {
  try {
    // Get the user ID
    const [users] = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [req.user.uid]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = users[0].id;
    
    // Get all access tokens for this user
    const [plaidItems] = await db.query('SELECT access_token FROM plaid_items WHERE user_id = ?', [userId]);
    
    if (plaidItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No linked accounts found' });
    }
    
    // For each access token, get the accounts
    const accountsPromises = plaidItems.map(async (item) => {
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.access_token,
      });
      return accountsResponse.data.accounts;
    });
    
    // Wait for all account requests to complete
    const accountsResults = await Promise.all(accountsPromises);
    
    // Flatten the array of account arrays
    const accounts = accountsResults.flat();
    
    res.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts',
      error: error.message,
    });
  }
});

// Get transactions
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Validate dates
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing start_date or end_date parameters',
      });
    }
    
    // Get the user ID
    const [users] = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [req.user.uid]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userId = users[0].id;
    
    // Get all access tokens for this user
    const [plaidItems] = await db.query('SELECT access_token FROM plaid_items WHERE user_id = ?', [userId]);
    
    if (plaidItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No linked accounts found' });
    }
    
    // For each access token, get the transactions
    const transactionPromises = plaidItems.map(async (item) => {
      try {
        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date,
          end_date,
          options: {
            include_personal_finance_category: true,
          },
        });
        return transactionsResponse.data.transactions;
      } catch (err) {
        console.error('Error getting transactions for item:', err);
        return []; // Return empty array on error for this specific item
      }
    });
    
    // Wait for all transaction requests to complete
    const transactionResults = await Promise.all(transactionPromises);
    
    // Flatten the array of transaction arrays
    const transactions = transactionResults.flat();
    
    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message,
    });
  }
});

module.exports = router; 