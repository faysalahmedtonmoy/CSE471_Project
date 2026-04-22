// filepath: frontend/app/api/push/subscribe/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import User from '../../../../backend/models/User.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

// Store push subscriptions (in production, use a separate collection)
const pushSubscriptions = new Map();

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const subscription = await req.json();
    
    // Store subscription with userId
    const userId = decoded.userId;
    pushSubscriptions.set(userId, subscription);
    
    return NextResponse.json({ message: 'Push subscription saved' });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ message: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const subscription = pushSubscriptions.get(decoded.userId);
    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Get push subscription error:', error);
    return NextResponse.json({ message: 'Failed to get subscription' }, { status: 500 });
  }
}

// Function to send push notification (called from other routes)
export async function sendPushNotification(userId, title, body, icon = '/icon.png') {
  const subscription = pushSubscriptions.get(userId);
  if (!subscription) return false;

  try {
    // In production, use web-push library with VAPID keys
    // For now, we'll rely on the in-app notification system
    console.log(`Push notification would be sent to ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}