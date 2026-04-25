import { NextResponse } from "next/server";
import User from "../../../../../backend/models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const UserModel = User as any;

// Helper to connect DB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, otp } = await req.json();
    console.log('COMPLETE REGISTRATION:', { email, otp });

    if (!otp) {
      return NextResponse.json({ message: "OTP is required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    console.log('USER FOUND:', !!user, user ? { isVerified: user.isVerified, hasCode: !!user.verificationCode } : null);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User already verified" }, { status: 400 });
    }

    if (!user.verificationCode || user.verificationCode !== otp) {
      console.log('OTP MISMATCH:', { stored: user.verificationCode, provided: otp });
      return NextResponse.json({ message: "Invalid OTP code" }, { status: 400 });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.verificationCode = null;
    user.otpExpiresAt = null;
    await user.save();
    console.log('USER VERIFIED SUCCESSFULLY');

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({ 
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
