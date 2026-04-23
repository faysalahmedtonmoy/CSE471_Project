import connectDB from "../../../../../backend/lib/mongodb.js";
import User from "../../../../../backend/models/User.js";
import ServiceRequest from "../../../../../backend/models/ServiceRequest.js";
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

    // For providers, count pending service requests
    let pendingRequestsCount = 0;
    if (user.role === 'PROVIDER') {
      pendingRequestsCount = await ServiceRequest.countDocuments({
        providerId: decoded.userId,
        providerAccepted: null, // Still pending
        status: 'pending'
      });
    }

    // Return user with additional data
    const userResponse = {
      ...user.toObject(),
      pendingRequestsCount
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}