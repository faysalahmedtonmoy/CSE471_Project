<<<<<<< HEAD
import { NextResponse } from "next/server";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";
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
=======
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
>>>>>>> origin/asha-module1

export async function POST(req: Request) {
  try {
    await connectDB();
<<<<<<< HEAD
    const { email } = await req.json();

    // 1. Find the user (already created during registration)
    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 2. Mark user as verified
    user.isVerified = true;
    await user.save();

    // 3. Generate JWT token
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
=======
    const { name, email, password, location, role } = await req.json();

    // 1. Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create the user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      role
    });

    return NextResponse.json({ message: "User created successfully!" }, { status: 201 });
  } catch (error: any) {
>>>>>>> origin/asha-module1
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}