const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      let { username, email, password, firstName, lastName } = req.body;

      // Clean up optional fields - convert empty strings to undefined
      firstName = firstName && firstName.trim() ? firstName.trim() : undefined;
      lastName = lastName && lastName.trim() ? lastName.trim() : undefined;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({
            success: false,
            message: 'Email is already registered',
          });
        }
        if (existingUser.username === username) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken',
          });
        }
      }

      // Create new user
      // Note: Admins can only be registered manually in the database
      // Role is explicitly not set here - defaults to 'student' in User model
      const userData = {
        username,
        email,
        password,
      };
      
      // Only add firstName and lastName if they exist
      if (firstName) userData.firstName = firstName;
      if (lastName) userData.lastName = lastName;
      
      // Explicitly prevent role from being set through registration
      // Admins must be manually added to the database
      // The role field will default to 'student' in the User model

      const user = new User(userData);

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Return user data (password is automatically excluded by toJSON method)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error stack:', error.stack);

      // Handle duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`,
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      }

      // Handle JWT_SECRET missing error
      if (error.message && error.message.includes('JWT_SECRET')) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact administrator.',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, username, password } = req.body;

      // Check if either email or username is provided
      if (!email && !username) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either email or username',
        });
      }

      // Find user by email or username
      const query = email ? { email: email.toLowerCase() } : { username };
      const user = await User.findOne(query).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      // Generate token
      const token = generateToken(user._id);

      // Return user data and token
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error stack:', error.stack);

      // Handle JWT_SECRET missing error
      if (error.message && error.message.includes('JWT_SECRET')) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact administrator.',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal, server-side can invalidate if needed)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. However, we can log the logout event or
    // implement token blacklisting if needed in the future.

    res.json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Public
router.post('/verify-token', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or expired',
    });
  }
});

// @route   POST /api/auth/admin/register
// @desc    Register a new admin user (requires admin secret)
// @access  Public (but requires admin secret key)
router.post(
  '/admin/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('adminSecret')
      .notEmpty()
      .withMessage('Admin secret is required'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { username, email, password, firstName, lastName, adminSecret } = req.body;

      // Verify admin secret
      const validAdminSecret = process.env.ADMIN_SECRET || 'ADMIN_SECRET_KEY_2024';
      if (adminSecret !== validAdminSecret) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin secret. Admin registration is restricted.',
        });
      }

      // Clean up optional fields
      const cleanFirstName = firstName && firstName.trim() ? firstName.trim() : undefined;
      const cleanLastName = lastName && lastName.trim() ? lastName.trim() : undefined;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({
            success: false,
            message: 'Email is already registered',
          });
        }
        if (existingUser.username === username) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken',
          });
        }
      }

      // Create new admin user
      const userData = {
        username,
        email,
        password,
        role: 'admin', // Set role to admin
      };
      
      if (cleanFirstName) userData.firstName = cleanFirstName;
      if (cleanLastName) userData.lastName = cleanLastName;

      const user = new User(userData);
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Return user data
      res.status(201).json({
        success: true,
        message: 'Admin user registered successfully',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error('Admin registration error:', error);
      console.error('Error stack:', error.stack);

      // Handle duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`,
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      }

      // Handle JWT_SECRET missing error
      if (error.message && error.message.includes('JWT_SECRET')) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact administrator.',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Server error during admin registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/admin/login
// @desc    Login admin user (same as regular login but redirects to admin dashboard)
// @access  Public
router.post(
  '/admin/login',
  [
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, username, password } = req.body;

      // Check if either email or username is provided
      if (!email && !username) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either email or username',
        });
      }

      // Find user by email or username
      const query = email ? { email: email.toLowerCase() } : { username };
      const user = await User.findOne(query).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      // Generate token
      const token = generateToken(user._id);

      // Return user data and token
      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Error stack:', error.stack);

      // Handle JWT_SECRET missing error
      if (error.message && error.message.includes('JWT_SECRET')) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact administrator.',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Server error during admin login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;

