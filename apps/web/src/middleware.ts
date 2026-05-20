import { NextRequest, NextResponse } from 'next/server'

/* ─── Route config ───────────────────────────────────────────────────────── */

const PUBLIC_ROUTES = new Set(['/', '/auth', '/login', '/register'])
const AUTH_ROUTES = new Set(['/auth', '/login', '/register'])

const isPublic = (pathname: string) =>
  PUBLIC_ROUTES.has(pathname) ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') ||
  pathname.includes('.') // static assets

const isAuthRoute = (pathname: string) => AUTH_ROUTES.has(pathname)

/* ─── Token helpers ──────────────────────────────────────────────────────── */

const TOKEN_KEY = 'omega_access_token'
const LEGACY_KEY = 'omega_token'

function getTokenFromRequest(req: NextRequest): string | null {
  // Check cookies (set by SSR / server actions if ever used)
  const cookieToken = req.cookies.get(TOKEN_KEY)?.value ?? req.cookies.get(LEGACY_KEY)?.value
  if (cookieToken) return cookieToken

  // Bearer header (for API route proxying)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

  return null
}

/* ─── Middleware ─────────────────────────────────────────────────────────── */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public/static routes
  if (isPublic(pathname)) {
    // If already authenticated and visiting auth pages → redirect to dashboard
    const token = getTokenFromRequest(req)
    if (token && isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protected route — require token
  const token = getTokenFromRequest(req)

  if (!token) {
    const loginUrl = new URL('/auth', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists — allow through (actual validation happens server-side / in stores)
  const res = NextResponse.next()

  // Forward token as header so server components can read it easily
  res.headers.set('x-access-token', token)

  return res
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images).*)'],
}
