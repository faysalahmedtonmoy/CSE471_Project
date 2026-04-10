import { NextResponse } from "next/server";
<<<<<<< HEAD
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const UserModel = User as any;

// Helper to connect DB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, location, role, skills, workType, shopAddress, phone, serviceType } = body;

    // 1. Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user object
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      location,
      role: role || 'USER',
      isVerified: false
    };

    // 4. Add provider-specific fields if role is PROVIDER
    if (role === 'PROVIDER') {
      userData.skills = skills || [];
      userData.workType = workType || 'shop';
      userData.shopAddress = shopAddress || null;
      userData.phone = phone || null;
      userData.serviceType = serviceType || null;
    }

    // 5. Create user in database
    const newUser = new UserModel(userData);
    await newUser.save();

    // 6. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 7. Log OTP (for testing purposes)
=======

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // 1. GENERATE OTP IMMEDIATELY
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. LOG IT BEFORE ANYTHING ELSE
>>>>>>> origin/asha-module1
    console.log("*****************************************");
    console.log(`NEW REGISTRATION ATTEMPT FOR: ${email}`);
    console.log(`YOUR OTP IS: ${otp}`);
    console.log("*****************************************");

<<<<<<< HEAD
    return NextResponse.json({ 
      message: "User registered. OTP sent to your email", 
      otp: otp,
      userId: newUser._id
=======
    // 3. DATABASE CALL (This is what's failing right now)
    // await connectDB(); 

    return NextResponse.json({ 
      message: "OTP sent to terminal", 
      otp: otp 
>>>>>>> origin/asha-module1
    }, { status: 200 });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}