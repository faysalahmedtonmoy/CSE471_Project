import { NextResponse } from 'next/server';

export function middleware(request) {
  // For now, we just let every request pass through
  return NextResponse.next();
}

// This tells Next.js which routes to run the middleware on
export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};