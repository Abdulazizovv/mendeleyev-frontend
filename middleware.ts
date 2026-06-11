import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root path: redirect based on auth cookie (set after login)
  if (pathname === "/") {
    const authPath = request.cookies.get("auth-role-path")?.value;
    if (authPath && authPath.startsWith("/")) {
      return NextResponse.redirect(new URL(authPath, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
