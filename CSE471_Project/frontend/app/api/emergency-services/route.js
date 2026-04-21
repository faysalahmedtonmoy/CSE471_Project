import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import HospitalEmergency from '../../../../backend/models/HospitalEmergency.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = {};

    if (searchParams.get('type')) {
      query.type = { $regex: searchParams.get('type'), $options: 'i' };
    }
    if (searchParams.get('location')) {
      query.location = { $regex: searchParams.get('location'), $options: 'i' };
    }

    const emergencyServices = await HospitalEmergency.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ emergencyServices });
  } catch (error) {
    console.error('Emergency Services GET error:', error);
    return NextResponse.json({ message: 'Unable to load emergency services' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const serviceData = {
      type: body.type, // 'ambulance', 'hospital', 'fire-rescue'
      name: body.name,
      location: body.location,
      phone: body.phone,
      address: body.address || '',
      availability: body.availability || '24/7',
    };

    const newService = await HospitalEmergency.create(serviceData);
    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error) {
    console.error('Emergency Services POST error:', error);
    return NextResponse.json({ message: 'Unable to create emergency service' }, { status: 500 });
  }
}