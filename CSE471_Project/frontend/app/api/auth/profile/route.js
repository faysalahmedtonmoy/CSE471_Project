import connectDB from "../../../../../backend/lib/mongodb.js";
import User from "../../../../../backend/models/User.js";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}