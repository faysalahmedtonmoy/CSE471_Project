import { NextResponse } from 'next/server';
import connectDB from '../../../../../backend/lib/mongodb.js';
import User from '../../../../../backend/models/User.js';
import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
};

// GET - Get user's saved listings
export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(decoded.userId)
      .populate('savedListings.toLet')
      .populate('savedListings.jobs')
      .populate('savedListings.institutes')
      .populate('savedListings.services');

    return NextResponse.json({ savedListings: user.savedListings });
  } catch (error) {
    console.error('Saved listings GET error:', error);
    return NextResponse.json({ message: 'Unable to load saved listings' }, { status: 500 });
  }
}

// POST - Save a listing
export async function POST(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { listingId, listingType } = await req.json();
    
    if (!listingId || !listingType) {
      return NextResponse.json({ message: 'Missing listingId or listingType' }, { status: 400 });
    }

    const validTypes = ['toLet', 'jobs', 'institutes', 'services'];
    if (!validTypes.includes(listingType)) {
      return NextResponse.json({ message: 'Invalid listing type' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Check if already saved
    if (user.savedListings[listingType].includes(listingId)) {
      return NextResponse.json({ message: 'Already saved', saved: true });
    }

    user.savedListings[listingType].push(listingId);
    await user.save();

    return NextResponse.json({ message: 'Listing saved', saved: true });
  } catch (error) {
    console.error('Saved listings POST error:', error);
    return NextResponse.json({ message: 'Unable to save listing' }, { status: 500 });
  }
}

// DELETE - Unsave a listing
export async function DELETE(req) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');
    const listingType = searchParams.get('type');

    if (!listingId || !listingType) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const validTypes = ['toLet', 'jobs', 'institutes', 'services'];
    if (!validTypes.includes(listingType)) {
      return NextResponse.json({ message: 'Invalid listing type' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    user.savedListings[listingType] = user.savedListings[listingType].filter(
      id => id.toString() !== listingId
    );
    await user.save();

    return NextResponse.json({ message: 'Listing removed', saved: false });
  } catch (error) {
    console.error('Saved listings DELETE error:', error);
    return NextResponse.json({ message: 'Unable to remove listing' }, { status: 500 });
  }
}