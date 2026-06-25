const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect, restrictTo } = require('../middleware/auth');

// @route   GET /api/activities
// @desc    Get all recent activity logs
// @access  Private (Admin & Team Lead only)
router.get('/', protect, restrictTo('Admin', 'Team Lead'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .populate('user', 'username avatarColor role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
