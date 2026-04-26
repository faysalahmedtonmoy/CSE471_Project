import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

const UserModel = User as any;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify caller is authenticated
    jwt.verify(token, process.env.JWT_SECRET || 'asepase-secret');
    
    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
       return NextResponse.json({ message: "receiverId is required" }, { status: 400 });
    }

    await connectDB();
    const receiver = await UserModel.findById(receiverId).select('-password');

    if (!receiver) {
      return NextResponse.json({ message: "Receiver not found in database" }, { status: 404 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ message: "Stream API keys missing" }, { status: 500 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Sync Receiver Profile to Stream Database
    await serverClient.upsertUser({
      id: receiverId,
      name: receiver.name,
      role: receiver.role === 'ADMIN' ? 'admin' : 'user',
      custom_role: receiver.role,
      email: receiver.email,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Sync Receiver Error:", error);
    return NextResponse.json({ message: "Server error", details: error.message }, { status: 500 });
  }
}
