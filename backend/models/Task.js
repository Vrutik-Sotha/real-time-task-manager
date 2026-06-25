const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Completed'],
      default: 'Todo',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    taskOwner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    assignmentDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
