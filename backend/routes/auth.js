const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, restrictTo } = require('../middleware/auth');
 
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
    console.log("User inserted into MongoDB");
    console.log(user);
 
    // Log Activity (non-blocking)
    try {
      await ActivityLog.create({
        user: user._id,
        action: 'Login',
        details: `${user.username} registered and logged in`,
      });
    } catch (logErr) {
      console.error('Activity log error (register):', logErr.message);
    }
 
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
 
    // Log Activity (non-blocking)
    try {
      await ActivityLog.create({
        user: user._id,
        action: 'Login',
        details: `${user.username} logged in successfully`,
      });
    } catch (logErr) {
      console.error('Activity log error (login):', logErr.message);
    }
 
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
    // Log Activity (non-blocking)
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Logout',
        details: `${req.user.username} logged out`,
      });
    } catch (logErr) {
      console.error('Activity log error (logout):', logErr.message);
    }
 
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
    const users = await User.find({}).select('-createdAt -updatedAt -__v');
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
 
// @route   PUT /api/auth/users/:id/role
// @desc    Promote/Demote a user
// @access  Admin only
router.put('/users/:id/role', protect, restrictTo('Admin'), async (req, res) => {
  try {
    const { role } = req.body;
 
    if (!['Member', 'Team Lead'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }
 
    // Prevent admin from changing own role
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }
 
    const user = await User.findById(req.params.id);
 
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
 
    // Prevent modifying another admin
    if (user.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify another admin.',
      });
    }
 
    user.role = role;
    await user.save();
 
    // Log Activity (non-blocking — won't fail the role update if logging errors)
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Role Updated',
        details: `${req.user.username} changed ${user.username}'s role to ${role}`,
      });
    } catch (logErr) {
      console.error('Activity log error (role update):', logErr.message);
    }
 
    res.json({
      success: true,
      message: `Role updated to ${role}`,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
 
// @route   DELETE /api/auth/users/:id
// @desc    Delete a user
// @access  Admin only
router.delete('/users/:id', protect, restrictTo('Admin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }
 
    const user = await User.findById(req.params.id);
 
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
 
    // Prevent deleting another admin
    if (user.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete another admin.',
      });
    }
 
    await user.deleteOne();
 
    // Log Activity (non-blocking — won't fail the deletion if logging errors)
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'User Deleted',
        details: `${req.user.username} deleted user ${user.username}`,
      });
    } catch (logErr) {
      console.error('Activity log error (user delete):', logErr.message);
    }
 
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
 
module.exports = router;