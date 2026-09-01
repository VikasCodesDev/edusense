/**
 * EduSense Authentication & Role-Based Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'edusense_jwt_secret_dev_key_2026';

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.findById('users', decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User session invalid or user no longer exists.'
      });
    }

    // Attach sanitized user to request object
    const { passwordHash, ...safeUser } = user;
    safeUser.id = user._id;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token.'
    });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: This resource requires one of the following roles: [${roles.join(', ')}]. Current role: ${req.user.role}.`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET
};
