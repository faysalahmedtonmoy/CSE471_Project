import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationId -> Set of userIds

let ioInstance = null;

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  ioInstance = io;

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // User comes online
    onlineUsers.set(socket.userId, socket.id);
    updateUserPresence(socket.userId, true);

    // Join user's conversations
    socket.on('join_conversations', async () => {
      try {
        const conversations = await Conversation.find({
          'participants.userId': socket.userId
        });

        conversations.forEach(conv => {
          socket.join(conv._id.toString());
        });
      } catch (error) {
        console.error('Error joining conversations:', error);
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', attachments = [], replyTo } = data;

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          receiverId: data.receiverId,
          content,
          messageType,
          attachments,
          replyTo
        });

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            messageId: message._id,
            content: message.content,
            senderId: message.senderId,
            timestamp: message.createdAt
          },
          updatedAt: new Date()
        });

        // Update unread count for other participants
        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach(participant => {
          if (participant.userId.toString() !== socket.userId) {
            const currentCount = conversation.unreadCount.get(participant.userId.toString()) || 0;
            conversation.unreadCount.set(participant.userId.toString(), currentCount + 1);
          }
        });
        await conversation.save();

        // Create notification for receiver
        const receiverUser = await User.findById(data.receiverId);
        if (receiverUser) {
          await Notification.create({
            userId: data.receiverId,
            type: 'message',
            title: 'New Message',
            message: `You have a new message from ${socket.userEmail}`,
            data: {
              conversationId,
              senderId: socket.userId,
              messageId: message._id
            }
          });
        }

        // Emit to conversation room
        io.to(conversationId).emit('new_message', {
          ...message.toObject(),
          sender: await User.findById(message.senderId).select('name email')
        });

        // Emit unread count update
        conversation.participants.forEach(participant => {
          const participantSocketId = onlineUsers.get(participant.userId.toString());
          if (participantSocketId) {
            io.to(participantSocketId).emit('unread_count_update', {
              conversationId,
              count: conversation.unreadCount.get(participant.userId.toString()) || 0
            });
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        await Message.updateMany(
          { _id: { $in: messageIds }, receiverId: socket.userId },
          { status: 'read', readAt: new Date() }
        );

        // Update unread count
        const conversation = await Conversation.findById(conversationId);
        conversation.unreadCount.set(socket.userId, 0);
        await conversation.save();

        // Notify sender about read receipt
        io.to(conversationId).emit('messages_read', {
          conversationId,
          readerId: socket.userId,
          messageIds
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Notify provider of new service request
    socket.on('notify_new_service_request', (data) => {
      const providerSocketId = onlineUsers.get(data.providerId.toString());
      if (providerSocketId) {
        io.to(providerSocketId).emit('new_service_request', data);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(socket.userId);

      socket.to(conversationId).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(socket.userId);
      }

      socket.to(conversationId).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: false
      });
    });

    // User presence updates
    socket.on('update_presence', () => {
      updateUserPresence(socket.userId, true);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      onlineUsers.delete(socket.userId);
      updateUserPresence(socket.userId, false);

      // Remove from typing indicators
      typingUsers.forEach((users, conversationId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          io.to(conversationId).emit('user_typing', {
            conversationId,
            userId: socket.userId,
            isTyping: false
          });
        }
      });
    });
  });

  const updateUserPresence = async (userId, isOnline) => {
    try {
      // Update user presence in conversations
      await Conversation.updateMany(
        { 'participants.userId': userId },
        {
          $set: {
            'participants.$[elem].isOnline': isOnline,
            'participants.$[elem].lastSeen': new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.userId': userId }]
        }
      );

      // Emit presence update to all conversations the user is in
      const conversations = await Conversation.find({
        'participants.userId': userId
      });

      conversations.forEach(conv => {
        io.to(conv._id.toString()).emit('presence_update', {
          userId,
          isOnline,
          lastSeen: new Date()
        });
      });

    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  };

  return io;
};

export const getIO = () => ioInstance;