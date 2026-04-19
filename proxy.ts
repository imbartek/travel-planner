import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)
const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/invitations/accept']

export default async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session
  const { user } = await updateSession(request)

  // 2. Process i18n routing
  const intlResponse = intlMiddleware(request)

  // 3. Auth guard
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(pl|en)/, '') || '/'
  const isPublic = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p))

  // If not logged in and not on a public path, redirect to login
  if (!user && !isPublic) {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    
    // Don't set redirect param for the root page to keep URLs clean
    if (pathnameWithoutLocale !== '/') {
      url.searchParams.set('redirect', pathname)
    }
    
    return NextResponse.redirect(url)
  }

  // If logged in and on a public path (except invitations), redirect to trips
  if (user && isPublic && pathnameWithoutLocale !== '/invitations/accept') {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/trips`
    return NextResponse.redirect(url)
  }

  return intlResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest files)
     * - icons (PWA icons)
     * - *.png, *.jpg, *.svg (images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:png|jpg|svg)$).*)',
  ],
}
