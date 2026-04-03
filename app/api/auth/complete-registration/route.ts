import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
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
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}