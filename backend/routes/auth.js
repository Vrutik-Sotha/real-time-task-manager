const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Colors for random avatar selection
const AVATAR_COLORS = [
  '#7c3aed', // Purple
  '#2563eb', // Blue
  '#059669', // Green
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
  '#0d9488', // Teal
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Select random avatar color
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      avatarColor,
      role: 'Member',
    });

    // Log Activity
    await ActivityLog.create({
      user: user._id,
      action: 'Login',
      details: `${user.username} registered and logged in`,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email or username, and select password explicitly
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }]
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Log Activity
    await ActivityLog.create({
      user: user._id,
      action: 'Login',
      details: `${user.username} logged in successfully`,
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Log user out & track activity
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user._id,
      action: 'Logout',
      details: `${req.user.username} logged out`,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   GET /api/auth/users
// @desc    Get all registered workspace users
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-email -createdAt -updatedAt -__v');
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
