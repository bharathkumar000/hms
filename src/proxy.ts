import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Validate Supabase URL before initializing to prevent crashes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

  if (!isValidUrl || !supabaseKey) {
    // If credentials are missing or invalid, bypass proxy auth logic
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // DEMO AUTHENTICATION LAYER
  const demoAuthCookie = request.cookies.get('demo_auth')?.value;
  let user = null;
  
  if (demoAuthCookie) {
    user = { id: 'demo-user-id', role: demoAuthCookie };
  } else {
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Protect /patient/* routes (except /patient/login)
  const isPatientRoute = request.nextUrl.pathname.startsWith('/patient') && !request.nextUrl.pathname.startsWith('/patient/login')
  
  if (isPatientRoute && !user) {
    // Redirect unauthenticated users to the patient login page
    return NextResponse.redirect(new URL('/patient/login', request.url))
  }

  // Redirect logged in users away from the login page
  if (user && request.nextUrl.pathname === '/patient/login') {
    return NextResponse.redirect(new URL('/patient/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
