import connectDB from "../../../../backend/lib/mongodb.js";
import User from "../../../../backend/models/User.js";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill');
    const serviceType = searchParams.get('serviceType');
    const location = searchParams.get('location');

    const query = { role: 'PROVIDER' };

    if (skill) {
      query.skills = { $in: [skill] };
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const providers = await User.find(query)
      .select('name email location skills serviceType workType shopAddress phone ratings reviewCount')
      .lean();

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Provider search error:", error);
    return NextResponse.json(
      { message: "Error searching providers" },
      { status: 500 }
    );
  }
}