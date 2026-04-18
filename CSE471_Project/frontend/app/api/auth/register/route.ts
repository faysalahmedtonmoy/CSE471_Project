import { NextResponse } from "next/server";
import User from "../../../../../backend/models/User.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const UserModel = User as any;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
    console.log('REGISTER REQUEST BODY:', body);
    const { name = '', email = '', password, location, role, skills, workType, shopAddress, phone, serviceType } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields: name, email, and password are required.' }, { status: 400 });
    }

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

    // 5. Generate OTP and save it on the user record
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    userData.verificationCode = otp;
    userData.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 6. Create user in database
    const newUser = new UserModel(userData);
    await newUser.save();

    // 7. Log OTP to terminal instead of sending email
    console.log(`AshePashe OTP for ${email}: ${otp}`);

    return NextResponse.json({ 
      message: "User registered. OTP logged to terminal.", 
      userId: newUser._id,
      otp // included for easy terminal verification during development
    }, { status: 200 });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}