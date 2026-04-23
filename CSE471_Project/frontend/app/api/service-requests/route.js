import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import ServiceRequest from '../../../../backend/models/ServiceRequest.js';
import User from '../../../../backend/models/User.js';
import Notification from '../../../../backend/models/Notification.js';
import Message from '../../../../backend/models/Message.js';
import Conversation from '../../../../backend/models/Conversation.js';
import jwt from 'jsonwebtoken';
import { getIO } from '../../../../backend/lib/socket.js';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const requests = await ServiceRequest.find({ 
      $or: [
        { userId: decoded.userId },
        { providerId: decoded.userId }
      ]
    }).sort({ createdAt: -1 });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('ServiceRequests GET error:', error);
    return NextResponse.json({ message: 'Unable to load service requests' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const requestData = {
      userId: decoded.userId,
      providerId: body.providerId,
      serviceType: body.serviceType,
      description: body.description || '',
      appointmentDate: body.appointmentDate,
      status: 'pending',
      providerAccepted: null,  // Waiting for provider response
      providerResponse: '',
      providerRespondedAt: null,
    };

    const newRequest = await ServiceRequest.create(requestData);
    
    // Get user and provider details for notification
    const user = await User.findById(decoded.userId).select('name email');
    const provider = await User.findById(body.providerId).select('name email');

    // Send notification to provider
    const appointmentDate = new Date(body.appointmentDate).toLocaleString();
    const notificationTitle = `New Service Request from ${user.name}`;
    const notificationMessage = `${user.name} has booked you for ${body.serviceType} on ${appointmentDate}. Please accept or decline this request.`;

    await Notification.create({
      userId: body.providerId,
      type: 'service_request',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        serviceRequestId: newRequest._id,
        userId: decoded.userId,
        serviceType: body.serviceType,
        appointmentDate: body.appointmentDate,
        description: body.description,
      },
    });

    // Create automated message to provider
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: decoded.userId } },
          { $elemMatch: { userId: body.providerId } }
        ]
      },
      conversationType: 'service_inquiry'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { userId: decoded.userId },
          { userId: body.providerId }
        ],
        conversationType: 'service_inquiry',
        serviceContext: {
          serviceId: newRequest._id,
          serviceType: body.serviceType,
          serviceTitle: `Service Request: ${body.serviceType}`,
        }
      });
    }

    // Create system message for the booking
    const bookingMessage = `Hi ${provider.name}, I would like to book your services for ${body.serviceType} on ${appointmentDate}. ${body.description ? `Details: ${body.description}` : ''} Please accept or decline this booking request.`;
    
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: decoded.userId,
      receiverId: body.providerId,
      content: bookingMessage,
      messageType: 'text',
      attachments: [],
      status: 'sent',
    });

    // Update conversation with last message
    conversation.lastMessage = {
      messageId: message._id,
      content: message.content,
      senderId: message.senderId,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();
    const currentCount = conversation.unreadCount.get(body.providerId) || 0;
    conversation.unreadCount.set(body.providerId, currentCount + 1);
    await conversation.save();

    // Emit socket events for real-time updates
    const io = getIO();
    if (io) {
      // Emit new message to conversation room
      io.to(conversation._id.toString()).emit('new_message', {
        ...message.toObject(),
        sender: await User.findById(message.senderId).select('name email')
      });

      // Emit unread count update to provider
      // Find provider's socket and emit to it
      const providerSockets = Array.from(io.sockets.sockets.values()).filter(
        socket => socket.userId === body.providerId
      );
      providerSockets.forEach(socket => {
        io.to(socket.id).emit('unread_count_update', {
          conversationId: conversation._id,
          count: conversation.unreadCount.get(body.providerId) || 0
        });
      });

      // Emit service request notification to provider
      providerSockets.forEach(socket => {
        io.to(socket.id).emit('new_service_request', {
          requestId: newRequest._id,
          userName: user.name,
          serviceType: body.serviceType,
          appointmentDate: body.appointmentDate,
          description: body.description
        });
      });
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('ServiceRequests POST error:', error);
    return NextResponse.json({ message: 'Unable to create service request' }, { status: 500 });
  }
}