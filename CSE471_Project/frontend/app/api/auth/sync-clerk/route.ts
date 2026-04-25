import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import User from '../../../../../backend/models/User.js';

async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI!);
}

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId, email, name, imageUrl } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Find existing user OR create new one
    let user = await User.findOne({ email });

    if (!user) {
      // New Clerk user — create with USER role, already verified
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: null, // No password since they use Clerk
        role: 'USER',
        isVerified: true, // Clerk verified their email
        clerkUserId: clerkUserId,
      });
    } else if (!user.clerkUserId) {
      // Existing user who logged in via Clerk for the first time
      user.clerkUserId = clerkUserId;
      user.isVerified = true;
      await user.save();
    }

    // Issue YOUR existing JWT so the rest of your app works perfectly
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User synced successfully',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (error: any) {
    console.error('Clerk sync error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
