import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/invitations/accept']

export async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session
  const { supabaseResponse, user } = await updateSession(request)

  // 2. Placeholder for i18n routing response mapping (to be added in Krok 4)
  // For now, we will just use supabaseResponse which has the updated cookies
  
  // 3. Auth guard
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(pl|en)/, '') || '/'
  const isPublic = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p))

  if (!user && !isPublic && pathnameWithoutLocale !== '/') {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.searchParams.set('redirect', pathname)
    
    const redirectResponse = NextResponse.redirect(url)
    // Copy cookies from supabaseResponse to redirectResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  if (user && isPublic && pathnameWithoutLocale !== '/invitations/accept') {
    const locale = pathname.match(/^\/(pl|en)/)?.[1] ?? 'pl'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/trips`
    
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.png$).*)',
  ],
}
