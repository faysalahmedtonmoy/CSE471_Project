import { Router } from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const router = Router();

// Get messages for a conversation
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, page = 1, limit = 50 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID required' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Mark messages as delivered/read
    await Message.updateMany(
      { conversationId, receiverId: userId, status: 'sent' },
      { status: 'delivered', deliveredAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCount.set(userId, 0);
    await conversation.save();

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Conversation messages GET error:', error);
    res.status(500).json({ message: 'Unable to load messages' });
  }
});

// Mark messages as read
router.put('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, messageIds } = req.body;

    if (!conversationId || !messageIds) {
      return res.status(400).json({ message: 'Conversation ID and message IDs required' });
    }

    // Update message status
    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: userId },
      { status: 'read', readAt: new Date() }
    );

    // Reset unread count
    const conversation = await Conversation.findById(conversationId);
    conversation.unreadCount.set(userId, 0);
    await conversation.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Unable to mark messages as read' });
  }
});

export default router;