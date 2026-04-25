import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../../../../backend/models/User.js';

async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI!);
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    // Parse the provider data
    const { location, skills, workType, shopAddress, phone, serviceType } = await req.json();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.role === 'PROVIDER') {
      return NextResponse.json({ message: 'User is already a provider' }, { status: 400 });
    }

    // Update user to provider
    user.role = 'PROVIDER';
    user.location = location || user.location;
    user.skills = Array.isArray(skills) ? skills : (skills || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);
    user.workType = workType || 'shop';
    user.shopAddress = shopAddress || null;
    user.phone = phone || null;
    user.serviceType = serviceType || null;

    await user.save();

    // Issue a fresh JWT with the updated role
    const newToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Successfully upgraded to Provider',
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Upgrade provider error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
