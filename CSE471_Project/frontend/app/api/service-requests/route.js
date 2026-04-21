import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import ServiceRequest from '../../../../backend/models/ServiceRequest.js';
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
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const requests = await ServiceRequest.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('ServiceRequests GET error:', error);
    return NextResponse.json({ message: 'Unable to load service requests' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const requestData = {
      userId: decoded.userId,
      providerId: body.providerId,
      serviceType: body.serviceType,
      description: body.description || '',
      appointmentDate: body.appointmentDate,
      status: 'pending',
    };

    const newRequest = await ServiceRequest.create(requestData);
    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('ServiceRequests POST error:', error);
    return NextResponse.json({ message: 'Unable to create service request' }, { status: 500 });
  }
}