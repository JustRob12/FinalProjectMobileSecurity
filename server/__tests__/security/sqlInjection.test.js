const request = require('supertest');
const express = require('express');
const app = express();
const authRoutes = require('../../routes/auth');

// Mock database for testing
jest.mock('../../config/database', () => ({
  query: jest.fn((sql, params) => {
    // For testing purposes, we'll check if parameters are properly used
    // and return appropriate mocked responses
    
    if (sql.includes('SELECT') && sql.includes('FROM users WHERE email = ?')) {
      if (params[0] === 'existing@example.com') {
        return [
          [{ id: 1, email: 'existing@example.com', password: '$2a$10$hashedpassword' }],
          []
        ];
      }
      return [[], []]; // User not found
    }
    
    if (sql.includes('INSERT INTO users')) {
      return [{ insertId: 123 }, []];
    }
    
    return [[], []];
  }),
}));

// Set up Express app for testing
app.use(express.json());
app.use('/auth', authRoutes);

describe('SQL Injection Prevention Tests', () => {
  // Test SQL injection in login
  test('Login endpoint should be protected against SQL injection', async () => {
    // Attempt SQL injection attack in the email field
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: "' OR 1=1 --",
        password: 'any_password'
      });
    
    // Should return 400 for invalid credentials, not 500 for SQL error
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid credentials');
    
    // Check if the database was called with parameterized query
    const db = require('../../config/database');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('?'),
      expect.arrayContaining(["' OR 1=1 --"])
    );
  });
  
  // Test SQL injection in registration
  test('Register endpoint should be protected against SQL injection', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: "victim'); DROP TABLE users; --",
        email: "attacker@example.com",
        password: "password123"
      });
    
    // Should return 201 for successful registration
    expect(response.status).toBe(201);
    
    // Check if the database was called with parameterized query
    const db = require('../../config/database');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('?'),
      expect.arrayContaining(["victim'); DROP TABLE users; --"])
    );
  });
  
  // Test other endpoints with potential SQL injection vulnerabilities
  // ...
}); 