import { NextRequest, NextResponse } from 'next/server'

// Helper to parse cookie expiration (js-cookie sets expires as a date string)
function isTokenExpired(token: string | undefined): boolean {
  if (!token) return true
  // We can't directly get the expiry from the cookie value, so we check by decoding the JWT
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8')
    )
    // exp is in seconds
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  } catch {
    // If token is malformed, treat as expired
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Proteksi akses ke /
  if (pathname === '/') {
    // Jika tidak ada token atau token expired, redirect ke /login
    if (!token || isTokenExpired(token)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Jika token valid, redirect ke /dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is on /login and already has a valid token, redirect to /dashboard
  if (pathname === '/login') {
    if (token && !isTokenExpired(token)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // else, allow to proceed to /login
    return NextResponse.next()
  }

  // For all other protected routes (except static files, etc)
  // You can adjust the path check as needed
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/some-protected-route') // add more as needed
  ) {
    if (!token) {
      // No token, redirect to /login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (isTokenExpired(token)) {
      // Token expired, remove cookie and redirect to /login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const response = NextResponse.redirect(url)
      response.cookies.set('token', '', { maxAge: 0, path: '/' })
      return response
    }
    // Token valid, allow to proceed
    return NextResponse.next()
  }

  // For all other routes, just continue
  return NextResponse.next()
}

// Specify the paths where the middleware should run
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    // add more protected routes here if needed
  ],
}
