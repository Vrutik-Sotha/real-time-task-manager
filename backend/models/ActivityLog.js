const mongoose = require('mongoose');
 
const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'Login',
        'Logout',
        'Task Created',
        'Task Updated',
        'Task Deleted',
        'Task Assigned',
        'Task Status Updated',
        'Role Updated',
        'User Deleted',
      ],
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
 