# 04 — Autentykacja

## Supabase Auth setup

W Supabase dashboard:

1. **Authentication → Providers → Email**:
   - Enable email provider
   - Confirm email: ON (produkcja) / OFF (dev może być wygodniej OFF)
   - Secure password change: ON
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev), zmienisz na produkcyjny URL po deployu
   - Redirect URLs: dodaj `http://localhost:3000/**` i produkcyjny URL po deployu
3. **Authentication → Email Templates**:
   - Confirmation: zostaw default, edytuj po MVP
   - Reset password: zostaw default

## Supabase clients

### `lib/supabase/client.ts` (browser)

```typescript
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` (server components, route handlers)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — można zignorować, middleware odświeży
          }
        },
      },
    }
  )
}
```

### `lib/supabase/middleware.ts` (session refresh)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

### `lib/supabase/service-role.ts` (admin, tylko server-side)

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// UWAGA: używaj TYLKO w API routes (server), NIGDY w komponencie.
// Pomija RLS. Wymaga SUPABASE_SERVICE_ROLE_KEY w env.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

## Główny `middleware.ts`

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

import { routing } from '@/lib/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/invitations/accept']

export async function middleware(request: NextRequest) {
  // 1. Odśwież sesję Supabase
  const { user } = await updateSession(request)

  // 2. Przetwórz i18n routing (zwraca response z przepisanym path)
  const intlResponse = intlMiddleware(request)

  // 3. Auth guard: jeśli niezalogowany i trasa nie jest public → redirect do /login
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

  // 4. Zalogowany na stronie auth → redirect do /trips
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
```

## Auth hook

### `lib/hooks/useAuth.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

## Validation schemas

### `lib/validation/auth.ts`

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
    displayName: z.string().min(1).max(100).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
```

## Strony auth

### `app/[locale]/(auth)/login/page.tsx`

- Form: email, password
- Submit: `supabase.auth.signInWithPassword({ email, password })`
- Po sukcesie: redirect do `searchParams.redirect ?? '/trips'`
- Link do signup + reset password
- Użyj `react-hook-form` + `zodResolver(loginSchema)`

### `app/[locale]/(auth)/signup/page.tsx`

- Form: email, password, confirmPassword, displayName (opcjonalne)
- Obsłuż query param `?invitation=TOKEN` — po signup auto-accept invitation
- Submit: `supabase.auth.signUp(...)`
- Jeśli confirm email włączone → pokaż info „Sprawdź mailbox"
- Jeśli wyłączone → redirect do `/trips`

### `app/[locale]/(auth)/reset-password/page.tsx`

- Form: email
- Submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`
- Info o wysłaniu linku

### `app/[locale]/invitations/accept/page.tsx`

- Query param: `?token=...`
- Server component sprawdza token (SELECT z `trip_invitations`)
- Jeśli user nie zalogowany → redirect do `/signup?invitation=token` (zapisz w query, żeby po rejestracji doczytać)
- Jeśli zalogowany i email zgodny → wywołaj RPC `accept_invitation(token)`, redirect do `/trips/{trip_id}`
- Jeśli email niezgodny → info błędu z propozycją logowania na inne konto

## Logout

Komponent `UserMenu` w sidebarze z przyciskiem „Wyloguj":
```typescript
await supabase.auth.signOut()
router.push('/login')
router.refresh()
```
