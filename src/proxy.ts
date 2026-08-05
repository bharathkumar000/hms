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

  // Protect /doctor/* routes (except /doctor/login)
  const isDoctorRoute = request.nextUrl.pathname.startsWith('/doctor') && !request.nextUrl.pathname.startsWith('/doctor/login')
  
  if (isDoctorRoute && !user) {
    // Redirect unauthenticated users to the doctor login page
    return NextResponse.redirect(new URL('/doctor/login', request.url))
  }

  // Redirect logged in users away from the login page
  if (user && request.nextUrl.pathname === '/doctor/login') {
    return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
  }

  // Protect /reception/* routes (except /reception/login)
  const isReceptionRoute = request.nextUrl.pathname.startsWith('/reception') && !request.nextUrl.pathname.startsWith('/reception/login')
  
  if (isReceptionRoute && !user) {
    // Redirect unauthenticated users to the reception login page
    return NextResponse.redirect(new URL('/reception/login', request.url))
  }

  // Redirect logged in users away from the login page
  if (user && request.nextUrl.pathname === '/reception/login') {
    return NextResponse.redirect(new URL('/reception/dashboard', request.url))
  }

  // Protect /laboratory/* routes (except /laboratory/login)
  const isLaboratoryRoute = request.nextUrl.pathname.startsWith('/laboratory') && !request.nextUrl.pathname.startsWith('/laboratory/login')
  
  if (isLaboratoryRoute && !user) {
    return NextResponse.redirect(new URL('/laboratory/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/laboratory/login') {
    return NextResponse.redirect(new URL('/laboratory/dashboard', request.url))
  }

  // Protect /pharmacy/* routes (except /pharmacy/login)
  const isPharmacyRoute = request.nextUrl.pathname.startsWith('/pharmacy') && !request.nextUrl.pathname.startsWith('/pharmacy/login')
  
  if (isPharmacyRoute && !user) {
    return NextResponse.redirect(new URL('/pharmacy/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/pharmacy/login') {
    return NextResponse.redirect(new URL('/pharmacy/dashboard', request.url))
  }

  // Protect /admin/* routes (except /admin/login)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')
  
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
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
