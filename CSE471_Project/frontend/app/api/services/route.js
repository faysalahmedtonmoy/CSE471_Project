import connectDB from "../../../../backend/lib/mongodb.js";
import HospitalEmergency from "../../../../backend/models/HospitalEmergency.js";
import { NextResponse } from "next/server";

const toRadians = (degrees) => degrees * (Math.PI / 180);
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const type = searchParams.get('type');
    const radius = parseFloat(searchParams.get('radius') || '5');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { message: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }

    const query = {};
    if (type && type !== 'All' && type !== '') {
      query.type = type;
    }

    const services = await HospitalEmergency.find(query).lean();

    const nearby = services
      .map((item) => ({
        ...item,
        distance: getDistanceKm(lat, lng, item.latitude, item.longitude),
      }))
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearby);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Error searching services" },
      { status: 500 }
    );
  }
}
