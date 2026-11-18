import { NextResponse } from 'next/server';

export function middleware(req) {
  // Yahan aap Supabase session ya auth token check karte hain
  const token = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token');
  
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Agar user logged in nahi hai aur woh protected pages (/feed ya baqi tabs) par jana chahta hai
  const isProtectedPath = path.startsWith('/feed') || path.startsWith('/profile');

  if (isProtectedPath && !token) {
    url.pathname = '/login'; // Ya jo bhi aapka login page ka URL ho
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/feed/:path*', '/profile/:path*'],
};
