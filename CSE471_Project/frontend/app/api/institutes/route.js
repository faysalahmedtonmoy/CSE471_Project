import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Institute from '../../../../backend/models/Institute.js';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');
    const location = searchParams.get('location');
    const instituteType = searchParams.get('type');

    const query = {};
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { courses: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (instituteType) query.instituteType = instituteType;

    const institutes = await Institute.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ institutes });
  } catch (error) {
    console.error('Institutes GET error:', error);
    return NextResponse.json({ message: 'Unable to load institutes' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newInstitute = await Institute.create(body);
    return NextResponse.json({ institute: newInstitute }, { status: 201 });
  } catch (error) {
    console.error('Institutes POST error:', error);
    return NextResponse.json({ message: 'Unable to create institute' }, { status: 500 });
  }
}
