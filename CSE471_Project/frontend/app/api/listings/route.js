import { NextResponse } from 'next/server';
import connectDB from '../../../../backend/lib/mongodb.js';
import Listing from '../../../../backend/models/Listing.js';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const listingType = searchParams.get('listingType');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0');
    const minSize = parseFloat(searchParams.get('minSize') || '0');
    const maxSize = parseFloat(searchParams.get('maxSize') || '0');
    const location = searchParams.get('location');

    const query = {};
    if (listingType) query.listingType = listingType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice) query.price = { ...(query.price || {}), $gte: minPrice };
    if (maxPrice) query.price = { ...(query.price || {}), $lte: maxPrice };
    if (minSize) query.size = { ...(query.size || {}), $gte: minSize };
    if (maxSize) query.size = { ...(query.size || {}), $lte: maxSize };

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Listings GET error:', error);
    return NextResponse.json({ message: 'Unable to load listings' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newListing = await Listing.create(body);
    return NextResponse.json({ listing: newListing }, { status: 201 });
  } catch (error) {
    console.error('Listings POST error:', error);
    return NextResponse.json({ message: 'Unable to create listing' }, { status: 500 });
  }
}
