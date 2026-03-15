const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const userSockets = new Map(); // userId -> socketId
const onlineUsers = new Set(); // Set of online userIds

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Verify JWT before allowing socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.verifiedUserId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with their ID – only accept the ID that was verified from the JWT
    socket.on('user:online', () => {
      const userId = socket.verifiedUserId;
      userSockets.set(userId, socket.id);
      onlineUsers.add(userId);
      socket.userId = userId;
      
      // Broadcast to all users that this user is online
      io.emit('user:status', { userId, status: 'online' });
      
      console.log(`User ${userId} is now online`);
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId, userId, userName }) => {
      socket.to(conversationId).emit('user:typing', { 
        conversationId, 
        userId, 
        userName,
        isTyping: true 
      });
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user:typing', { 
        conversationId, 
        userId,
        isTyping: false 
      });
    });

    // Handle new message
    socket.on('message:send', (data) => {
      const { conversationId, message } = data;
      // Broadcast to all users in the conversation except sender
      socket.to(conversationId).emit('message:received', message);
    });

    // Handle message read
    socket.on('message:read', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('message:read', { conversationId, userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        onlineUsers.delete(socket.userId);
        
        // Broadcast to all users that this user is offline
        io.emit('user:status', { userId: socket.userId, status: 'offline' });
        
        console.log(`User ${socket.userId} is now offline`);
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(conversationId).emit(event, data);
  }
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToConversation,
  isUserOnline,
  getOnlineUsers
};
