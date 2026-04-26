import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

const UserModel = User as any;

export async function POST(req: NextRequest) {
  try {
    const { email, name, clerkUserId } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
        name: name || email.split('@')[0],
        email,
        password: null, 
        role: 'USER',
        isVerified: true, 
        clerkUserId: clerkUserId,
      });
    } else {
      if (!user.clerkUserId) {
        user.clerkUserId = clerkUserId;
      }
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Social login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
