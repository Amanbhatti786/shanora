import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check user session from Supabase server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Woh sare pages jo secure hain aur bina login ke nahi khul sakte
  const protectedRoutes = [
    '/feed',
    '/messages',
    '/notifications',
    '/settings',
    '/profile',
    '/admin',
    '/ats-checker',
    '/employer',
    '/create-page',
    '/monetization'
  ]

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Agar user logged in nahi hai aur protected page khol raha hai -> /auth par bhej do
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth' 
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Agar user already logged in hai aur /auth ya /login khol raha hai -> seedha /feed par bhej do
  if (
    user &&
    (request.nextUrl.pathname === '/auth' ||
     request.nextUrl.pathname === '/login')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
