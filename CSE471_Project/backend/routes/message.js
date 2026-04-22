import { Router } from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const router = Router();

// Get conversations for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .populate('participants.userId', 'name email')
      .populate('lastMessage.senderId', 'name email')
      .sort({ updatedAt: -1 });

    // Add unread counts for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCount.get(userId) || 0;
      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Conversations GET error:', error);
    res.status(500).json({ message: 'Unable to load conversations' });
  }
});

// Create new conversation or send message
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { receiverId, content, messageType = 'text', attachments = [], serviceContext } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId } },
          { $elemMatch: { userId: receiverId } }
        ]
      },
      conversationType: serviceContext ? 'service_inquiry' : 'direct'
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { userId: userId },
          { userId: receiverId }
        ],
        conversationType: serviceContext ? 'service_inquiry' : 'direct',
        serviceContext: serviceContext || null
      });
    }

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      receiverId,
      content,
      messageType,
      attachments
    });

    // Update conversation
    conversation.lastMessage = {
      messageId: message._id,
      content: message.content,
      senderId: message.senderId,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();

    // Update unread count
    const currentCount = conversation.unreadCount.get(receiverId) || 0;
    conversation.unreadCount.set(receiverId, currentCount + 1);
    await conversation.save();

    const sender = await User.findById(message.senderId).select('name email');
    res.status(201).json({
      conversation: conversation,
      message: {
        ...message.toObject(),
        sender
      }
    });
  } catch (error) {
    console.error('Message POST error:', error);
    res.status(500).json({ message: 'Unable to send message' });
  }
});

export default router;