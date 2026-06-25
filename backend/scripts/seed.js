require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_manager';

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    // Clear existing data
    console.log('Clearing old workspace data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Database cleared.');

    // Seed Users
    console.log('Creating demo users with roles...');
    const users = await User.create([
      {
        username: 'Workspace Admin',
        email: 'admin@example.com',
        password: 'password123',
        avatarColor: '#dc2626', // Red
        role: 'Admin',
        isOnline: false,
      },
      {
        username: 'Jordan Lead',
        email: 'jordan@example.com',
        password: 'password123',
        avatarColor: '#2563eb', // Blue
        role: 'Team Lead',
        isOnline: false,
      },
      {
        username: 'Alex Developer',
        email: 'alex@example.com',
        password: 'password123',
        avatarColor: '#7c3aed', // Purple
        role: 'Member',
        isOnline: false,
      },
      {
        username: 'Sarah Designer',
        email: 'sarah@example.com',
        password: 'password123',
        avatarColor: '#db2777', // Pink
        role: 'Member',
        isOnline: false,
      },
    ]);
    console.log(`Seeded ${users.length} workspace users with custom roles.`);

    const [admin, jordan, alex, sarah] = users;

    // Seed Tasks
    console.log('Seeding collaborative tasks...');
    const tasks = await Task.create([
      {
        title: 'Design UI Mockups',
        description: 'Create premium dark-themed wireframes and layouts for the task board and analytics widgets.',
        status: 'Completed',
        priority: 'High',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        creator: jordan._id,
        taskOwner: jordan._id,
        assignedTo: sarah._id,
        assignedBy: jordan._id,
        assignmentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Configure Express Server & DB',
        description: 'Set up database schemas for Users, Tasks, and Messages using Mongoose. Connect to local MongoDB instance.',
        status: 'Completed',
        priority: 'Medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        creator: admin._id,
        taskOwner: admin._id,
        assignedTo: alex._id,
        assignedBy: admin._id,
        assignmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        title: 'Integrate Socket.io Server & Client',
        description: 'Build real-time synchronization hooks so tasks and message feeds update automatically on all connected dashboards.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        creator: jordan._id,
        taskOwner: jordan._id,
        assignedTo: alex._id,
        assignedBy: jordan._id,
        assignmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Refactor Glassmorphism Dashboard Styling',
        description: 'Optimize CSS custom properties, responsive breakpoints, circular progress bars, and animations.',
        status: 'Todo',
        priority: 'Low',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        creator: admin._id,
        taskOwner: admin._id,
        assignedTo: sarah._id,
        assignedBy: admin._id,
        assignmentDate: new Date(Date.now()),
      },
      {
        title: 'Create Collaborative Team Settings Panel',
        description: 'Allow users to change their avatars, manage global room alerts, and invite new members.',
        status: 'Todo',
        priority: 'Medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue task!
        creator: jordan._id,
        taskOwner: jordan._id,
        assignedTo: jordan._id,
        assignedBy: jordan._id,
        assignmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log(`Seeded ${tasks.length} tasks.`);

    // Seed Messages
    console.log('Seeding team chat history...');
    await Message.create([
      {
        sender: jordan._id,
        text: 'Hey team! Welcome to the new collaborative workspace. Let’s use this chat room for daily task standups.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        sender: sarah._id,
        text: 'Hi Jordan! Glad to be here. I have already completed the "Design UI Mockups" task. Let me know what you think!',
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        sender: jordan._id,
        text: 'Excellent work Sarah, the layout looks extremely premium! @Alex Developer, how is the server configuration going?',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        sender: alex._id,
        text: 'Express backend and MongoDB connection are complete! Working on the Socket.io real-time connection now.',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        sender: jordan._id,
        text: 'Awesome, keep up the speed! Let me know if you need help testing the socket connections.',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ]);
    console.log('Seeded chat messages.');

    // Seed Activity Logs
    console.log('Seeding activity logs...');
    await ActivityLog.create([
      {
        user: admin._id,
        action: 'Login',
        details: 'Workspace Admin logged in successfully',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        user: admin._id,
        action: 'Task Created',
        details: 'Created task "Configure Express Server & DB"',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        user: admin._id,
        action: 'Task Assigned',
        details: 'Assigned task "Configure Express Server & DB" to Alex Developer',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        user: jordan._id,
        action: 'Login',
        details: 'Jordan Lead logged in successfully',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: jordan._id,
        action: 'Task Created',
        details: 'Created task "Design UI Mockups"',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: jordan._id,
        action: 'Task Assigned',
        details: 'Assigned task "Design UI Mockups" to Sarah Designer',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: sarah._id,
        action: 'Login',
        details: 'Sarah Designer logged in successfully',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        user: sarah._id,
        action: 'Task Status Updated',
        details: 'Updated status of "Design UI Mockups" from "Todo" to "Completed" via board',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        user: alex._id,
        action: 'Login',
        details: 'Alex Developer logged in successfully',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        user: alex._id,
        action: 'Task Status Updated',
        details: 'Updated status of "Configure Express Server & DB" from "In Progress" to "Completed" via board',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ]);
    console.log('Seeded Activity Logs.');

    // Seed Notifications
    console.log('Seeding demo notifications...');
    await Notification.create([
      {
        recipient: sarah._id,
        sender: jordan._id,
        type: 'assignment',
        message: 'You have been assigned a new task: "Design UI Mockups" by Jordan Lead',
        isRead: true,
      },
      {
        recipient: alex._id,
        sender: admin._id,
        type: 'assignment',
        message: 'You have been assigned a new task: "Configure Express Server & DB" by Workspace Admin',
        isRead: true,
      },
      {
        recipient: alex._id,
        sender: jordan._id,
        type: 'assignment',
        message: 'You have been assigned a new task: "Integrate Socket.io Server & Client" by Jordan Lead',
        isRead: false,
      },
      {
        recipient: alex._id,
        sender: jordan._id,
        type: 'mention',
        message: 'You were mentioned by Jordan Lead in Team Chat',
        isRead: false,
      },
    ]);
    console.log('Seeded Notifications.');

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
