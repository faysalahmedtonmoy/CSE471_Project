import { NextResponse } from 'next/server';
import connectDB from '../../../../../backend/lib/mongodb.js';
import ServiceRequest from '../../../../../backend/models/ServiceRequest.js';
import User from '../../../../../backend/models/User.js';
import Notification from '../../../../../backend/models/Notification.js';
import jwt from 'jsonwebtoken';
import { getIO } from '../../../../../backend/lib/socket.js';

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

    const id = req.nextUrl.pathname.split('/').pop();
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 });
    }

    if (request.userId.toString() !== decoded.userId && request.providerId.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error('ServiceRequest GET error:', error);
    return NextResponse.json({ message: 'Unable to load service request' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.pathname.split('/').pop();
    const body = await req.json();
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 });
    }

    if (request.userId.toString() !== decoded.userId && request.providerId.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Handle provider acceptance/decline
    if (typeof body.providerAccepted !== 'undefined' && request.providerId.toString() === decoded.userId) {
      request.providerAccepted = body.providerAccepted;
      request.providerResponse = body.providerResponse || '';
      request.providerRespondedAt = new Date();

      // Send notification to user about provider's response
      const provider = await User.findById(request.providerId).select('name');
      const statusMessage = request.providerAccepted 
        ? `${provider.name} has accepted your service request!` 
        : `${provider.name} has declined your service request.${request.providerResponse ? ` Reason: ${request.providerResponse}` : ''}`;

      const notificationTitle = request.providerAccepted 
        ? '✅ Service Request Accepted' 
        : '❌ Service Request Declined';

      await Notification.create({
        userId: request.userId,
        type: 'service_request',
        title: notificationTitle,
        message: statusMessage,
        data: {
          serviceRequestId: request._id,
          providerId: request.providerId,
          accepted: request.providerAccepted,
        },
      });

      // Emit socket event for real-time update
      const io = getIO();
      if (io) {
        // Find conversation between user and provider
        const conversation = await Conversation.findOne({
          participants: {
            $all: [
              { $elemMatch: { userId: request.userId } },
              { $elemMatch: { userId: request.providerId } }
            ]
          },
          conversationType: 'service_inquiry'
        });

        if (conversation) {
          // Create a system message about the provider's response
          const responseMessage = await Message.create({
            conversationId: conversation._id,
            senderId: request.providerId,
            receiverId: request.userId,
            content: request.providerAccepted 
              ? `✅ I have accepted your service request!` 
              : `❌ I have declined your service request.${request.providerResponse ? ` Reason: ${request.providerResponse}` : ''}`,
            messageType: 'text',
            attachments: [],
            status: 'sent',
          });

          // Update conversation
          conversation.lastMessage = {
            messageId: responseMessage._id,
            content: responseMessage.content,
            senderId: responseMessage.senderId,
            timestamp: responseMessage.createdAt
          };
          conversation.updatedAt = new Date();
          const currentCount = conversation.unreadCount.get(request.userId) || 0;
          conversation.unreadCount.set(request.userId, currentCount + 1);
          await conversation.save();

          // Emit new message to conversation room
          io.to(conversation._id.toString()).emit('new_message', {
            ...responseMessage.toObject(),
            sender: await User.findById(responseMessage.senderId).select('name email')
          });
        }
      }
    }

    // Handle regular status updates
    if (body.status) request.status = body.status;
    if (typeof body.rating !== 'undefined') request.rating = body.rating;
    if (typeof body.review !== 'undefined') request.review = body.review;
    
    await request.save();

    return NextResponse.json({ request });
  } catch (error) {
    console.error('ServiceRequest PUT error:', error);
    return NextResponse.json({ message: 'Unable to update service request' }, { status: 500 });
  }
}