import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Job from '../../../../backend/models/Job.js';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = {};
    const keyword = searchParams.get('keyword');
    const location = searchParams.get('location');
    const employmentType = searchParams.get('employmentType');

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { company: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (employmentType) query.employmentType = employmentType;

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ message: 'Unable to load jobs' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newJob = await Job.create(body);
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch (error) {
    console.error('Jobs POST error:', error);
    return NextResponse.json({ message: 'Unable to create job listing' }, { status: 500 });
  }
}
