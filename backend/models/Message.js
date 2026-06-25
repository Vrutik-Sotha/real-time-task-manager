const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Please add message text'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
