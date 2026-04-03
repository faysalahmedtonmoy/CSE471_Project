import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // 1. GENERATE OTP IMMEDIATELY
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. LOG IT BEFORE ANYTHING ELSE
    console.log("*****************************************");
    console.log(`NEW REGISTRATION ATTEMPT FOR: ${email}`);
    console.log(`YOUR OTP IS: ${otp}`);
    console.log("*****************************************");

    // 3. DATABASE CALL (This is what's failing right now)
    // await connectDB(); 

    return NextResponse.json({ 
      message: "OTP sent to terminal", 
      otp: otp 
    }, { status: 200 });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}