import { NextResponse } from 'next/server';
import connectDB from '../../../../../backend/lib/mongodb.js';
import ServiceRequest from '../../../../../backend/models/ServiceRequest.js';
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

    const id = req.nextUrl.pathname.split('/').pop();
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 });
    }

    if (request.userId.toString() !== decoded.userId && request.providerId.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error('ServiceRequest GET error:', error);
    return NextResponse.json({ message: 'Unable to load service request' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.pathname.split('/').pop();
    const body = await req.json();
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 });
    }

    if (request.userId.toString() !== decoded.userId && request.providerId.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (body.status) request.status = body.status;
    if (typeof body.rating !== 'undefined') request.rating = body.rating;
    if (typeof body.review !== 'undefined') request.review = body.review;
    await request.save();

    return NextResponse.json({ request });
  } catch (error) {
    console.error('ServiceRequest PUT error:', error);
    return NextResponse.json({ message: 'Unable to update service request' }, { status: 500 });
  }
}