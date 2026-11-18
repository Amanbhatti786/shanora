import { NextResponse } from 'next/server';

export function middleware(req) {
  // Supabase auth cookies ko check karna
  const token = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token');
  const { pathname } = req.nextUrl;

  // Agar user /feed ya kisi protected route par bina login ke ja raha hai
  const isProtectedPath = pathname.startsWith('/feed');

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Config matcher taake middleware sirf specific pages par chale aur static files block na hon
export const config = {
  matcher: ['/feed/:path*'],
};
