import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Get messages for a conversation
export async function GET(req) {
  try {
    const token = req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    const queryString = new URLSearchParams({
      conversationId,
      page,
      limit
    }).toString();

    const response = await fetch(`${BACKEND_URL}/api/conversations?${queryString}`, {
      headers: { 'Authorization': token }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Conversation messages GET error:', error);
    return NextResponse.json({ message: 'Unable to load messages' }, { status: 500 });
  }
}

// Mark messages as read
export async function PUT(req) {
  try {
    const token = req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ message: 'Unable to mark messages as read' }, { status: 500 });
  }
}