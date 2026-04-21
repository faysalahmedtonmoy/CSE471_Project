import { NextResponse } from 'next/server';
import connectDB from '../../../backend/lib/mongodb.js';
import Message from '../../../backend/models/Message.js';
import Conversation from '../../../backend/models/Conversation.js';
import User from '../../../backend/models/User.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

// Get conversations for user
export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const conversations = await Conversation.find({
      'participants.userId': decoded.userId
    })
    .populate('participants.userId', 'name email')
    .populate('lastMessage.senderId', 'name email')
    .sort({ updatedAt: -1 });

    // Add unread counts for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCount.get(decoded.userId) || 0;
      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ message: 'Unable to load conversations' }, { status: 500 });
  }
}

// Create new conversation or send message
export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { receiverId, content, messageType = 'text', attachments = [], serviceContext } = body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: decoded.userId } },
          { $elemMatch: { userId: receiverId } }
        ]
      },
      conversationType: serviceContext ? 'service_inquiry' : 'direct'
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { userId: decoded.userId },
          { userId: receiverId }
        ],
        conversationType: serviceContext ? 'service_inquiry' : 'direct',
        serviceContext: serviceContext || null
      });
    }

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: decoded.userId,
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

    return NextResponse.json({
      conversation: conversation,
      message: {
        ...message.toObject(),
        sender: await User.findById(message.senderId).select('name email')
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ message: 'Unable to send message' }, { status: 500 });
  }
}