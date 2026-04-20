import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)
const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/invitations/accept']

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options)
  })
}

export default async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session — supabaseResponse carries updated cookies
  const { supabaseResponse, user } = await updateSession(request)

  // 2. Process i18n routing
  const intlResponse = intlMiddleware(request)

  // 3. Auth guard
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(pl|en)/, '') || '/'
  const isPublic = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p))

  if (!user && !isPublic) {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    if (pathnameWithoutLocale !== '/') {
      url.searchParams.set('redirect', pathname)
    }
    const redirectResponse = NextResponse.redirect(url)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  if (user && isPublic && pathnameWithoutLocale !== '/invitations/accept') {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/trips`
    const redirectResponse = NextResponse.redirect(url)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  // Forward refreshed Supabase cookies onto the intl response
  copyCookies(supabaseResponse, intlResponse)
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
