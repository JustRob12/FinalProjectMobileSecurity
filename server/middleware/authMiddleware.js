const admin = require('../config/firebase-admin');

// Middleware to verify the Firebase token and extract user info
const verifyToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided'
      });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if token is expired (Firebase handles this, but we add an extra check)
    // This helps ensure short expiration for added security
    const tokenExpiration = new Date(decodedToken.exp * 1000);
    const now = new Date();
    
    if (now > tokenExpiration) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Token expired'
      });
    }
    
    // Add the user to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user', // Default to 'user' if no role specified
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid token',
      error: error.message
    });
  }
};

// Middleware to check if user has required role
const hasRole = (requiredRole) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }
    
    const userRole = req.user.role || 'user';
    
    // Role hierarchy: admin > user > guest
    if (requiredRole === 'guest') {
      // Any authenticated user has at least guest privileges
      return next();
    }
    
    if (requiredRole === 'user' && (userRole === 'user' || userRole === 'admin')) {
      // Only user and admin roles have user privileges
      return next();
    }
    
    if (requiredRole === 'admin' && userRole === 'admin') {
      // Only admin role has admin privileges
      return next();
    }
    
    // User doesn't have required role
    return res.status(403).json({
      success: false,
      message: `Forbidden - Requires ${requiredRole} role`
    });
  };
};

module.exports = { verifyToken, hasRole }; 