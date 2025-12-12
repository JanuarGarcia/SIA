const { authenticate } = require('./auth');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  // First authenticate the user
  authenticate(req, res, () => {
    // Check if user is admin
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }
  });
};

module.exports = { requireAdmin };

