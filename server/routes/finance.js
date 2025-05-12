const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');

// Helper function to get user ID from Firebase UID
async function getUserIdFromFirebaseUid(firebaseUid) {
  const [users] = await db.query(
    'SELECT id FROM users WHERE firebase_uid = ?',
    [firebaseUid]
  );
  
  if (users.length === 0) {
    throw new Error(`User not found with firebase_uid: ${firebaseUid}`);
  }
  
  return users[0].id;
}

// Helper function to format date for MySQL
const formatDateForMySQL = (dateString) => {
  if (!dateString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
};

// ===================== WALLET ROUTES =====================

// Get all wallets for a user
router.get('/wallets', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    
    const [wallets] = await db.query(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({ success: true, wallets });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific wallet
router.get('/wallets/:id', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const walletId = req.params.id;
    
    const [wallets] = await db.query(
      'SELECT * FROM wallets WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );
    
    if (wallets.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    res.json({ success: true, wallet: wallets[0] });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new wallet
router.post('/wallets', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const { name, balance, currency, bankAccountToken } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Wallet name is required' });
    }
    
    const [result] = await db.query(
      'INSERT INTO wallets (user_id, name, balance, currency, bankAccountToken) VALUES (?, ?, ?, ?, ?)',
      [userId, name, balance || 0, currency || 'USD', bankAccountToken || null]
    );
    
    const [newWallet] = await db.query(
      'SELECT * FROM wallets WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ success: true, wallet: newWallet[0] });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a wallet
router.put('/wallets/:id', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const walletId = req.params.id;
    const { name, balance, currency, bankAccountToken } = req.body;
    
    // Check if wallet belongs to user
    const [wallets] = await db.query(
      'SELECT * FROM wallets WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );
    
    if (wallets.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // Prepare update fields and values
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (balance !== undefined) {
      updateFields.push('balance = ?');
      updateValues.push(balance);
    }
    
    if (currency !== undefined) {
      updateFields.push('currency = ?');
      updateValues.push(currency);
    }
    
    if (bankAccountToken !== undefined) {
      updateFields.push('bankAccountToken = ?');
      updateValues.push(bankAccountToken);
    }
    
    // Only update if there are fields to update
    if (updateFields.length > 0) {
      // Add walletId to values
      updateValues.push(walletId);
      
      // Update the wallet
      await db.query(
        `UPDATE wallets SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    // Get the updated wallet
    const [updatedWallet] = await db.query(
      'SELECT * FROM wallets WHERE id = ?',
      [walletId]
    );
    
    res.json({ success: true, wallet: updatedWallet[0] });
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a wallet
router.delete('/wallets/:id', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const walletId = req.params.id;
    
    // Check if wallet belongs to user
    const [wallets] = await db.query(
      'SELECT * FROM wallets WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );
    
    if (wallets.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // Delete the wallet
    await db.query('DELETE FROM wallets WHERE id = ?', [walletId]);
    
    res.json({ success: true, message: 'Wallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===================== TRANSACTION ROUTES =====================

// Get all transactions for a user
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const walletId = req.query.wallet_id;
    const type = req.query.type;
    const category = req.query.category;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    // Build the query with filters
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];
    
    if (walletId) {
      query += ' AND wallet_id = ?';
      params.push(walletId);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (startDate) {
      query += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND transaction_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY transaction_date DESC';
    
    const [transactions] = await db.query(query, params);
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific transaction
router.get('/transactions/:id', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const transactionId = req.params.id;
    
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    res.json({ success: true, transaction: transactions[0] });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new transaction
router.post('/transactions', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const { wallet_id, amount, type, category, description, transaction_date } = req.body;
    
    if (!wallet_id || !amount || !type || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet ID, amount, type, and category are required' 
      });
    }
    
    // Check if wallet belongs to user
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE id = ? AND user_id = ?',
      [wallet_id, userId]
    );
    
    if (wallets.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // Create the transaction
    const [result] = await connection.query(
      'INSERT INTO transactions (wallet_id, user_id, amount, type, category, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [wallet_id, userId, amount, type, category, description || null, formatDateForMySQL(transaction_date)]
    );
    
    // Update wallet balance
    let newBalance;
    if (type === 'income') {
      newBalance = wallets[0].balance + parseFloat(amount);
    } else if (type === 'expense') {
      newBalance = wallets[0].balance - parseFloat(amount);
    } else {
      newBalance = wallets[0].balance; // No change for transfers
    }
    
    await connection.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, wallet_id]
    );
    
    // Get the new transaction
    const [newTransaction] = await connection.query(
      'SELECT * FROM transactions WHERE id = ?',
      [result.insertId]
    );
    
    await connection.commit();
    
    res.status(201).json({ success: true, transaction: newTransaction[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Update a transaction
router.put('/transactions/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const transactionId = req.params.id;
    const { amount, type, category, description, transaction_date } = req.body;
    
    // Check if transaction belongs to user
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const oldTransaction = transactions[0];
    
    // Get the wallet
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE id = ?',
      [oldTransaction.wallet_id]
    );
    
    const wallet = wallets[0];
    
    // Calculate the balance adjustment
    let balanceAdjustment = 0;
    
    // Remove the effect of the old transaction
    if (oldTransaction.type === 'income') {
      balanceAdjustment -= parseFloat(oldTransaction.amount);
    } else if (oldTransaction.type === 'expense') {
      balanceAdjustment += parseFloat(oldTransaction.amount);
    }
    
    // Add the effect of the new transaction
    if (type === 'income') {
      balanceAdjustment += parseFloat(amount || oldTransaction.amount);
    } else if (type === 'expense') {
      balanceAdjustment -= parseFloat(amount || oldTransaction.amount);
    }
    
    // Update the transaction
    await connection.query(
      'UPDATE transactions SET amount = ?, type = ?, category = ?, description = ?, transaction_date = ? WHERE id = ?',
      [
        amount || oldTransaction.amount,
        type || oldTransaction.type,
        category || oldTransaction.category,
        description !== undefined ? description : oldTransaction.description,
        formatDateForMySQL(transaction_date),
        transactionId
      ]
    );
    
    // Update the wallet balance
    const newBalance = wallet.balance + balanceAdjustment;
    await connection.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, wallet.id]
    );
    
    // Get the updated transaction
    const [updatedTransaction] = await connection.query(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    await connection.commit();
    
    res.json({ success: true, transaction: updatedTransaction[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Delete a transaction
router.delete('/transactions/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const transactionId = req.params.id;
    
    // Check if transaction belongs to user
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, userId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const transaction = transactions[0];
    
    // Get the wallet
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE id = ?',
      [transaction.wallet_id]
    );
    
    const wallet = wallets[0];
    
    // Calculate the updated balance
    let newBalance = wallet.balance;
    if (transaction.type === 'income') {
      newBalance -= parseFloat(transaction.amount);
    } else if (transaction.type === 'expense') {
      newBalance += parseFloat(transaction.amount);
    }
    
    // Delete the transaction
    await connection.query('DELETE FROM transactions WHERE id = ?', [transactionId]);
    
    // Update the wallet balance
    await connection.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, wallet.id]
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// ===================== CATEGORY ROUTES =====================

// Get all categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===================== SUMMARY ROUTES =====================

// Get financial summary for a user
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const userId = await getUserIdFromFirebaseUid(req.user.uid);
    const period = req.query.period || 'month'; // day, week, month, year
    
    // Calculate the start date based on the period
    let startDate;
    const today = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get total income
    const [incomeResult] = await db.query(
      'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income" AND transaction_date >= ?',
      [userId, startDateStr]
    );
    
    // Get total expenses
    const [expenseResult] = await db.query(
      'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" AND transaction_date >= ?',
      [userId, startDateStr]
    );
    
    // Get total wallets balance
    const [walletResult] = await db.query(
      'SELECT SUM(balance) as total FROM wallets WHERE user_id = ?',
      [userId]
    );
    
    // Get expenses by category
    const [expensesByCategory] = await db.query(
      `SELECT category, SUM(amount) as total 
       FROM transactions 
       WHERE user_id = ? AND type = "expense" AND transaction_date >= ?
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDateStr]
    );
    
    // Get recent transactions
    const [recentTransactions] = await db.query(
      `SELECT t.*, w.name as wallet_name 
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [userId]
    );
    
    const summary = {
      period,
      totalIncome: incomeResult[0].total || 0,
      totalExpenses: expenseResult[0].total || 0,
      netSavings: (incomeResult[0].total || 0) - (expenseResult[0].total || 0),
      totalBalance: walletResult[0].total || 0,
      expensesByCategory,
      recentTransactions
    };
    
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 