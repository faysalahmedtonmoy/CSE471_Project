import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Message from '../../../../backend/models/Message.js';
import Conversation from '../../../../backend/models/Conversation.js';
import User from '../../../../backend/models/User.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

// Get messages for a conversation
export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID required' }, { status: 400 });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(p => p.userId.toString() === decoded.userId);
    if (!isParticipant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Mark messages as delivered/read
    await Message.updateMany(
      { conversationId, receiverId: decoded.userId, status: 'sent' },
      { status: 'delivered', deliveredAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCount.set(decoded.userId, 0);
    await conversation.save();

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Conversation messages GET error:', error);
    return NextResponse.json({ message: 'Unable to load messages' }, { status: 500 });
  }
}

// Mark messages as read
export async function PUT(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { conversationId, messageIds } = body;

    if (!conversationId || !messageIds) {
      return NextResponse.json({ message: 'Conversation ID and message IDs required' }, { status: 400 });
    }

    // Update message status
    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: decoded.userId },
      { status: 'read', readAt: new Date() }
    );

    // Reset unread count
    const conversation = await Conversation.findById(conversationId);
    conversation.unreadCount.set(decoded.userId, 0);
    await conversation.save();

    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ message: 'Unable to mark messages as read' }, { status: 500 });
  }
}