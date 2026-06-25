require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activities');
const socketHandler = require('./socket/socketHandler');

// Connect to Database
connectDB();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Refusing to start with an insecure token configuration.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Init Middleware for body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.io Server
const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Set io instance in app settings to make it accessible inside express routes
app.set('io', io);

// Initialize Socket event handlers
socketHandler(io);

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Task Manager API is running smoothly' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
