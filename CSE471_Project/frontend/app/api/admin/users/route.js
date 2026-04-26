import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

const authenticateAdmin = (authorizationHeader) => {
  if (!authorizationHeader) return null;
  const token = authorizationHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'ADMIN') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

export async function GET(req) {
  try {
    await connectDB();

    const authorization = req.headers.get('authorization');
    const admin = authenticateAdmin(authorization);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const users = await User.find({}).select('-password').lean();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Admin GET users error:', error);
    return NextResponse.json({ message: 'Unable to fetch users' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const authorization = req.headers.get('authorization');
    const admin = authenticateAdmin(authorization);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, isProviderVerified } = body;
    if (!userId) {
      return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
    }

    const updateFields = {};
    if (role) updateFields.role = role;
    if (typeof isProviderVerified !== 'undefined') {
      updateFields.isProviderVerified = Boolean(isProviderVerified);
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: 'No update fields provided' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Admin PUT users error:', error);
    return NextResponse.json({ message: 'Unable to update user' }, { status: 500 });
  }
}
