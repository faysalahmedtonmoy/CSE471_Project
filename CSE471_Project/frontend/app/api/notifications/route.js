import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Notification from '../../../../backend/models/Notification.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

// Get notifications for user
export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const notifications = await Notification.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ message: 'Unable to load notifications' }, { status: 500 });
  }
}

// Create notification (internal use)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const notification = await Notification.create({
      userId: body.userId,
      type: body.type,
      title: body.title,
      message: body.message,
      data: body.data || {}
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Notification POST error:', error);
    return NextResponse.json({ message: 'Unable to create notification' }, { status: 500 });
  }
}

// Mark notifications as read
export async function PUT(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { notificationIds } = body;

    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: decoded.userId },
      { read: true, readAt: new Date() }
    );

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ message: 'Unable to mark notifications as read' }, { status: 500 });
  }
}