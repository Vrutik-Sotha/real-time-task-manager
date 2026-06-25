const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.username} (Socket ID: ${socket.id})`);

    // Join a user-specific room for targeted notifications
    socket.join(user._id.toString());

    // Update user online status
    try {
      user.isOnline = true;
      await user.save();
      
      // Notify all clients that a user came online
      io.emit('user_status_change', {
        userId: user._id,
        isOnline: true,
      });
    } catch (err) {
      console.error(`Error updating online status for ${user.username}:`, err.message);
    }

    // Fetch and send message history
    try {
      const messages = await Message.find()
        .populate('sender', 'username avatarColor isOnline')
        .sort({ createdAt: -1 })
        .limit(50);
      
      // Send message history in chronological order (reverse the fetched list)
      socket.emit('message_history', messages.reverse());
    } catch (err) {
      console.error('Error fetching message history:', err.message);
    }

    // Handle new chat message
    socket.on('send_message', async (data) => {
      try {
        const text = data?.text?.trim();
        if (!text) return;
        if (text.length > 1000) {
          socket.emit('message_error', { message: 'Message cannot exceed 1000 characters' });
          return;
        }

        const newMessage = await Message.create({
          sender: user._id,
          text,
        });

        const populatedMessage = await Message.findById(newMessage._id).populate(
          'sender',
          'username avatarColor isOnline'
        );

        io.emit('receive_message', populatedMessage);

        // Process mentions only. Chat delivery is real-time; notifications are reserved for explicit attention.
        const mentions = text.match(/@(\w+(\s\w+)?)/g);
        if (mentions) {
          // Clean mentions to get raw usernames (case insensitive search)
          const usernames = [...new Set(mentions.map(m => m.slice(1).trim()))];
          const mentionedUsers = await User.find({
            username: { $in: usernames.map(name => new RegExp('^' + escapeRegex(name) + '$', 'i')) }
          });

          for (const mu of mentionedUsers) {
            // Don't notify self
            if (mu._id.toString() === user._id.toString()) continue;

            const notif = await Notification.create({
              recipient: mu._id,
              sender: user._id,
              type: 'mention',
              message: `You were mentioned by ${user.username} in Team Chat`,
            });

            const populatedNotif = await Notification.findById(notif._id).populate('sender', 'username avatarColor role');
            io.to(mu._id.toString()).emit('new_notification', populatedNotif);
          }
        }
      } catch (err) {
        console.error('Error sending message:', err.message);
      }
    });

    // Handle typing indicator
    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('user_typing', {
        userId: user._id,
        username: user.username,
        isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username}`);
      
      try {
        // Double check if the user has other active sockets before setting to offline
        // (to handle multiple tabs open by same user)
        const activeSockets = await io.fetchSockets();
        const userHasOtherSockets = activeSockets.some(
          (s) => s.user && s.user._id.toString() === user._id.toString()
        );

        if (!userHasOtherSockets) {
          user.isOnline = false;
          await user.save();

          io.emit('user_status_change', {
            userId: user._id,
            isOnline: false,
          });
        }
      } catch (err) {
        console.error(`Error updating offline status for ${user.username}:`, err.message);
      }
    });
  });
};

module.exports = socketHandler;
