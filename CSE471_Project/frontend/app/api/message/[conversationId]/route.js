import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Get messages for a specific conversation
export async function GET(req, { params }) {
  try {
    const token = req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    const response = await fetch(`${BACKEND_URL}/api/message/${conversationId}`, {
      headers: { 'Authorization': token }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ message: 'Unable to load messages' }, { status: 500 });
  }
}