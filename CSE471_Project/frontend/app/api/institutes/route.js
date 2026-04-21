import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Institute from '../../../../backend/models/Institute.js';
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

    if (searchParams.get('name')) {
      query.name = { $regex: searchParams.get('name'), $options: 'i' };
    }
    if (searchParams.get('type')) {
      query.type = searchParams.get('type');
    }
    if (searchParams.get('location')) {
      query.location = { $regex: searchParams.get('location'), $options: 'i' };
    }

    const institutes = await Institute.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ institutes });
  } catch (error) {
    console.error('Institutes GET error:', error);
    return NextResponse.json({ message: 'Unable to load institutes' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const instituteData = {
      userId: decoded.userId,
      name: body.name,
      type: body.type,
      description: body.description,
      location: body.location,
      address: body.address || '',
      phone: body.phone || '',
      email: body.email || '',
      website: body.website || '',
      programs: body.programs || [],
    };

    const newInstitute = await Institute.create(instituteData);
    return NextResponse.json({ institute: newInstitute }, { status: 201 });
  } catch (error) {
    console.error('Institutes POST error:', error);
    return NextResponse.json({ message: 'Unable to create institute' }, { status: 500 });
  }
}