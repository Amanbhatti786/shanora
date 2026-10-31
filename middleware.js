import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Supabase auth token check karein (cookies se)
  const token = request.cookies.get('sb-access-token')?.value || 
                request.cookies.get('supabase-auth-token')?.value;

  // Protected Routes jo bina login ke nahi khulne chahiye
  const protectedRoutes = ['/feed', '/profile', '/create-page'];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Agar user logged in nahi hai aur protected page access kare, to /auth bhej do
  if (isProtected && !token) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Agar already logged in hai aur /auth kholay, to /feed bhej do
  if (token && pathname === '/auth') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/feed/:path*',
    '/profile/:path*',
    '/create-page/:path*',
    '/auth'
  ],
};
