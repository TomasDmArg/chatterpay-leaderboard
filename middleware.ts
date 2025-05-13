import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('Authorization');
    
    // If already authenticated, proceed
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === process.env.ADMIN_PASSWORD) {
        return NextResponse.next();
      }
    }

    // If no auth header or invalid password, redirect to the login form
    // Return the admin page, but client side code will show the login form
    // rather than the admin panel
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 