const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { protect, restrictTo } = require('../middleware/auth');

const addIdToSet = (set, id) => {
  if (id) {
    set.add(id.toString());
  }
};

const isTaskVisibleToUser = (task, user) => {
  if (!task || !user) return false;
  if (user.role === 'Admin' || user.role === 'Team Lead') return true;

  const userId = user._id.toString();
  return [task.creator, task.assignedTo, task.taskOwner]
    .filter(Boolean)
    .some((id) => id.toString() === userId);
};

const emitTaskEvent = async (io, eventName, payload, task) => {
  if (!io || !task) return;

  try {
    const recipients = new Set();
    addIdToSet(recipients, task.creator);
    addIdToSet(recipients, task.assignedTo);
    addIdToSet(recipients, task.taskOwner);

    const privilegedUsers = await User.find({ role: { $in: ['Admin', 'Team Lead'] } }).select('_id');
    privilegedUsers.forEach((user) => addIdToSet(recipients, user._id));

    recipients.forEach((recipientId) => {
      io.to(recipientId).emit(eventName, payload);
    });
  } catch (err) {
    console.error(`Error emitting ${eventName}:`, err.message);
  }
};

// Helper to push notification to target user
const createAndSendNotification = async (io, recipientId, senderId, type, message) => {
  try {
    const notif = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
    });

    const populatedNotif = await Notification.findById(notif._id)
      .populate('sender', 'username avatarColor role');

    if (io) {
      io.to(recipientId.toString()).emit('new_notification', populatedNotif);
    }
  } catch (err) {
    console.error('Error sending notification:', err.message);
  }
};

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Admins and Leads can view all tasks, Members see tasks they created or are assigned to
    let query = {};
    if (req.user.role === 'Member') {
      query = {
        $or: [
          { creator: req.user._id },
          { assignedTo: req.user._id },
          { taskOwner: req.user._id }
        ]
      };
    }

    const tasks = await Task.find(query)
      .populate('creator', 'username avatarColor isOnline role')
      .populate('assignedTo', 'username avatarColor isOnline role')
      .populate('assignedBy', 'username avatarColor isOnline role')
      .populate('taskOwner', 'username avatarColor isOnline role')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (Admin, Team Lead only)
router.post('/', protect, restrictTo('Admin', 'Team Lead'), async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, taskOwner } = req.body;

  try {
    const taskData = {
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate,
      creator: req.user._id,
      taskOwner: taskOwner || req.user._id, // Default to creator
    };

    if (assignedTo) {
      taskData.assignedTo = assignedTo;
      taskData.assignedBy = req.user._id;
      taskData.assignmentDate = new Date();
    }

    if (status === 'Completed') {
      taskData.completionDate = new Date();
    }

    const task = await Task.create(taskData);

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'username avatarColor isOnline role')
      .populate('assignedTo', 'username avatarColor isOnline role')
      .populate('assignedBy', 'username avatarColor isOnline role')
      .populate('taskOwner', 'username avatarColor isOnline role');

    const io = req.app.get('io');

    // Activity Log
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Created',
      details: `Created task "${title}"`,
    });

    // If assigned, log and notify
    if (assignedTo) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Task Assigned',
        details: `Assigned task "${title}" to user ${populatedTask.assignedTo.username}`,
      });

      // Send Notification to assignee
      if (assignedTo.toString() !== req.user._id.toString()) {
        await createAndSendNotification(
          io,
          assignedTo,
          req.user._id,
          'assignment',
          `You have been assigned a new task: "${title}" by ${req.user.username}`
        );
      }
    }

    await emitTaskEvent(io, 'task_created', {
      task: populatedTask,
      sender: req.user.username,
    }, task);

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private (Admin, Team Lead only)
router.put('/:id', protect, restrictTo('Admin', 'Team Lead'), async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, taskOwner } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const io = req.app.get('io');
    const originalAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
    const originalStatus = task.status;

    // Update fields
    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority !== undefined ? priority : task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.taskOwner = taskOwner !== undefined ? (taskOwner || task.creator) : task.taskOwner;

    // Handle assignment changes
    if (assignedTo !== undefined) {
      const newAssignedTo = assignedTo || null;
      if (newAssignedTo !== originalAssignedTo) {
        task.assignedTo = newAssignedTo;
        if (newAssignedTo) {
          task.assignedBy = req.user._id;
          task.assignmentDate = new Date();
        } else {
          task.assignedBy = null;
          task.assignmentDate = null;
        }
      }
    }

    // Handle status transitions
    if (status !== undefined && status !== originalStatus) {
      task.status = status;
      if (status === 'Completed') {
        task.completionDate = new Date();
      } else {
        task.completionDate = null;
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'username avatarColor isOnline role')
      .populate('assignedTo', 'username avatarColor isOnline role')
      .populate('assignedBy', 'username avatarColor isOnline role')
      .populate('taskOwner', 'username avatarColor isOnline role');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Updated',
      details: `Updated task details for "${task.title}"`,
    });

    // Notify new assignee if assignment changed
    if (task.assignedTo && task.assignedTo.toString() !== originalAssignedTo) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Task Assigned',
        details: `Reassigned task "${task.title}" to ${populatedTask.assignedTo.username}`,
      });

      if (task.assignedTo.toString() !== req.user._id.toString()) {
        await createAndSendNotification(
          io,
          task.assignedTo,
          req.user._id,
          'assignment',
          `You have been assigned the task: "${task.title}" by ${req.user.username}`
        );
      }
    }

    // Notify of task status updates
    if (task.status !== originalStatus) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Task Status Updated',
        details: `Status of "${task.title}" updated to "${task.status}"`,
      });

      // Notify taskOwner or assignee
      if (task.status === 'Completed') {
        if (task.taskOwner && task.taskOwner.toString() !== req.user._id.toString()) {
          await createAndSendNotification(
            io,
            task.taskOwner,
            req.user._id,
            'completion',
            `Task "${task.title}" has been completed by ${req.user.username}`
          );
        }
      } else {
        if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
          await createAndSendNotification(
            io,
            task.assignedTo,
            req.user._id,
            'update',
            `Status of task "${task.title}" was updated to "${task.status}" by ${req.user.username}`
          );
        }
      }
    }

    await emitTaskEvent(io, 'task_updated', {
      task: populatedTask,
      sender: req.user.username,
    }, task);

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/tasks/:id/status
// @desc    Update task status only (Drag and Drop / Member status updates)
// @access  Private (All Roles)
router.patch('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  if (!status || !['Todo', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status' });
  }

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role === 'Member' && !isTaskVisibleToUser(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Members can only update their own or assigned tasks.',
      });
    }

    const originalStatus = task.status;
    task.status = status;

    if (status === 'Completed') {
      task.completionDate = new Date();
    } else {
      task.completionDate = null;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'username avatarColor isOnline role')
      .populate('assignedTo', 'username avatarColor isOnline role')
      .populate('assignedBy', 'username avatarColor isOnline role')
      .populate('taskOwner', 'username avatarColor isOnline role');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Status Updated',
      details: `Updated status of "${task.title}" from "${originalStatus}" to "${status}" via board`,
    });

    const io = req.app.get('io');

    // Notify Task Owner when a task status updates or gets completed
    if (originalStatus !== status) {
      if (status === 'Completed') {
        if (task.taskOwner && task.taskOwner.toString() !== req.user._id.toString()) {
          await createAndSendNotification(
            io,
            task.taskOwner,
            req.user._id,
            'completion',
            `Task "${task.title}" completed by ${req.user.username}`
          );
        }
      } else {
        // If someone else changes status
        if (task.taskOwner && task.taskOwner.toString() !== req.user._id.toString()) {
          await createAndSendNotification(
            io,
            task.taskOwner,
            req.user._id,
            'update',
            `Task "${task.title}" status changed to "${status}" by ${req.user.username}`
          );
        }
      }
    }

    await emitTaskEvent(io, 'task_updated', {
      task: populatedTask,
      sender: req.user.username,
    }, task);

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (Admin, Team Lead only)
router.delete('/:id', protect, restrictTo('Admin', 'Team Lead'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Deleted',
      details: `Deleted task "${task.title}"`,
    });

    const io = req.app.get('io');
    await emitTaskEvent(io, 'task_deleted', {
      taskId: req.params.id,
      sender: req.user.username,
    }, task);

    res.json({ success: true, message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
