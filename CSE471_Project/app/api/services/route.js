import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const type = searchParams.get('type');
    const radius = searchParams.get('radius') || '5';

    // Validate inputs
    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate parsed values
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { message: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }

    const radiusInKm = parseFloat(radius) || 5;

    const query = {
      role: 'PROVIDER',
      // For now, we'll return all providers since we don't have location coordinates
      // In a real app, you'd filter by location proximity
    };

    if (type && type !== "All" && type !== "") {
      query.serviceType = type;
    }

    const providers = await User.find(query).select('-password');

    // Format providers for response
    const providersWithInfo = providers.map((provider) => ({
      _id: provider._id,
      name: provider.name,
      type: provider.serviceType || 'General Service',
      address: provider.shopAddress || provider.location,
      phone: provider.phone,
      skills: provider.skills,
      workType: provider.workType,
      isProviderVerified: provider.isProviderVerified,
      ratings: provider.ratings,
      reviewCount: provider.reviewCount,
      distance: 'N/A', // Since we don't have coordinates yet
    }));

    return NextResponse.json(providersWithInfo);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Error searching services" },
      { status: 500 }
    );
  }
}
