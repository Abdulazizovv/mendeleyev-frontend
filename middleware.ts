import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard routes
  if (pathname.startsWith("/teacher") || 
      pathname.startsWith("/student") || 
      pathname.startsWith("/branch-admin") || 
      pathname.startsWith("/super-admin")) {
    
    // Check for access token in localStorage (handled by client-side)
    // Middleware can't access localStorage, so we rely on the layout to redirect
    // This middleware can handle other checks like CSRF, rate limiting, etc.
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/:path*",
    "/student/:path*",
    "/branch-admin/:path*",
    "/super-admin/:path*",
  ],
};
