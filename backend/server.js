/**
 * ============================================
 * FITORBIT BACKEND - MAIN SERVER FILE
 * ============================================
 * Entry point for the Express application
 * Initializes the server and connects to database
 */

const http = require('http');
const socketIO = require('socket.io');
const app = require('./src/app');
const env = require('./src/config/environment');
const Chat = require('./src/models/Chat');
const Notification = require('./src/models/Notification');
const { startAppointmentReminderScheduler } = require('./src/services/appointmentReminderScheduler');
const { startAppointmentCompletionScheduler } = require('./src/services/appointmentCompletionScheduler');

const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

// Create HTTP server with Socket.io
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: env.FRONTEND_URL || env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

// Store active connections
const activeUsers = new Map();
app.locals.activeUsers = activeUsers;

io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  /**
   * User connects to chat
   */
  socket.on('user_connect', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.broadcast.emit('user_online', { userId });
  });

  /**
   * User joins a conversation room
   */
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  /**
   * Relay message in real time (persistence is handled by POST /api/chat/messages).
   */
  socket.on('send_message', (data) => {
    const { conversationId, messageContent, messageType = 'text', _id, createdAt, receiverId } = data;
    if (!conversationId || !messageContent) return;

    io.to(`conversation_${conversationId}`).emit('receive_message', {
      _id,
      conversationId,
      senderId: socket.userId,
      receiverId,
      messageContent,
      messageType,
      createdAt: createdAt || new Date(),
    });
  });

  /**
   * Mark message as read
   */
  socket.on('mark_as_read', async (data) => {
    try {
      const { conversationId, messageIds } = data;

      await Chat.updateMany(
        { _id: { $in: messageIds }, receiverId: socket.userId },
        { status: 'read', readAt: new Date() }
      );

      io.to(`conversation_${conversationId}`).emit('messages_read', {
        messageIds,
        readBy: socket.userId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  /**
   * User is typing
   */
  socket.on('typing', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  /**
   * User stopped typing
   */
  socket.on('stop_typing', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  /**
   * User disconnects
   */
  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (userId) {
      activeUsers.delete(userId);
      socket.broadcast.emit('user_offline', { userId });
      console.log(`❌ User ${userId} disconnected`);
    }
  });

  /**
   * Error handling
   */
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Export io for use in other parts of the app if needed
app.locals.io = io;

// ============================================
// SERVER STARTUP
// ============================================
server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     🚀 FitOrbit Backend Server 🚀         ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║ 🌐 Port: ${PORT}${PORT === 5000 ? '                              ' : ''}║`);
  console.log(`║ 📡 Environment: ${NODE_ENV}${NODE_ENV === 'development' ? '                ║' : '                  ║'}`);
  console.log(`║ 🔗 API Base: http://localhost:${PORT}/api     ║`);
  console.log('║ 🔌 WebSocket: Enabled (Socket.io)        ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  startAppointmentReminderScheduler(app);
  startAppointmentCompletionScheduler(app);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // You can here write the log to file or send it to external services
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = server;
