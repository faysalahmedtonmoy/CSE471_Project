import { NextResponse } from "next/server";
import User from "../../../../../backend/models/User.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

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

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log(`LOGIN FAILED: User not found for email: ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Clerk users might not have a password
    if (!user.password) {
      console.log(`LOGIN FAILED: User ${email} has no password (Clerk user)`);
      return NextResponse.json({ message: "Please use Social Login (Google/GitHub) for this account." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`LOGIN FAILED: Incorrect password for email: ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isVerified) {
      console.log(`LOGIN FAILED: User ${email} is not verified`);
      return NextResponse.json({ message: "Account is not verified. Please check your email." }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Login successful",
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
    console.error("Login error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
