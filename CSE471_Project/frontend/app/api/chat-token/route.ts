import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../../../backend/models/User.js';

const UserModel = User as any;

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    // 1. Verify user's identity
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asepase-secret') as any;
    
    await connectDB();
    const user = await UserModel.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 2. Initialize Stream Server Client
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ message: "Stream API keys missing" }, { status: 500 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const userId = user._id.toString();

    // 3. Sync User Profile to Stream Database
    await serverClient.upsertUser({
      id: userId,
      name: user.name,
      role: user.role === 'ADMIN' ? 'admin' : 'user', // Stream roles are 'admin', 'user', 'guest', 'anonymous'
      custom_role: user.role, // Save actual role (USER, PROVIDER) as custom data
      email: user.email,
    });

    // 4. Generate Stream Auth Token
    const streamToken = serverClient.createToken(userId);

    return NextResponse.json({
      token: streamToken,
      userId: userId,
      name: user.name,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Chat Token Error:", error);
    return NextResponse.json({ message: "Invalid token or server error", details: error.message }, { status: 500 });
  }
}
