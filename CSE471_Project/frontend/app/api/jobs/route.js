import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Job from '../../../../backend/models/Job.js';
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
    const query = { status: 'active' };

    if (searchParams.get('title')) {
      query.title = { $regex: searchParams.get('title'), $options: 'i' };
    }
    if (searchParams.get('location')) {
      query.location = { $regex: searchParams.get('location'), $options: 'i' };
    }
    if (searchParams.get('jobType')) {
      query.jobType = searchParams.get('jobType');
    }

    const jobs = await Job.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ message: 'Unable to load jobs' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const jobData = {
      userId: decoded.userId,
      title: body.title,
      description: body.description,
      company: body.company,
      location: body.location,
      jobType: body.jobType,
      salary: body.salary || '',
      experience: body.experience || '',
      skills: body.skills || [],
    };

    const newJob = await Job.create(jobData);
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch (error) {
    console.error('Jobs POST error:', error);
    return NextResponse.json({ message: 'Unable to create job posting' }, { status: 500 });
  }
}