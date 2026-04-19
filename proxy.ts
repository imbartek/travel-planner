import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)
const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/invitations/accept']

export async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session
  const { user } = await updateSession(request)

  // 2. Process i18n routing
  const intlResponse = intlMiddleware(request)

  // 3. Auth guard
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(pl|en)/, '') || '/'
  const isPublic = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p))

  if (!user && !isPublic && pathnameWithoutLocale !== '/') {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

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
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.png$).*)',
  ],
}
