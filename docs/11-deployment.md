# 11 — Deployment: PWA, env vars, Vercel + Supabase

## Zmienne środowiskowe

### `.env.local.example` (commit'uj)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Google SMTP)
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-16-char-app-password

# Cron
CRON_SECRET=generate-with-openssl-rand-hex-32
```

### `.env.local` (NIE commit'uj — .gitignore)

Skopiuj `.env.local.example` i wypełnij rzeczywistymi wartościami.

### Na Vercel

Dodaj wszystkie powyższe zmienne w **Settings → Environment Variables** (dla Production + Preview + Development jeśli chcesz):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (dla produkcji — twoja produkcyjna domena Vercel)
- `SMTP_USER`
- `SMTP_APP_PASSWORD`
- `CRON_SECRET`

## Setup Supabase

### 1. Utwórz projekt
- https://supabase.com/dashboard → New project
- Region: `eu-central-1` (Frankfurt)
- Password: zapisz w password managerze
- Czekaj ~2 min na provisioning

### 2. Wykonaj migracje

Opcja A — Supabase CLI (preferowana):
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

Opcja B — SQL Editor w dashboard:
- Idź do SQL Editor
- Wykonaj migracje w kolejności:
  1. `20250101000000_initial_schema.sql`
  2. `20250101000002_functions_triggers.sql`
  3. `20250101000003_seed_default_checklist.sql`
  4. `20250101000004_seed_templates.sql`
  5. `20250101000001_rls_policies.sql` (ostatnia — po wszystkich tabelach)

### 3. Skonfiguruj Auth
- Authentication → URL Configuration:
  - Site URL: `http://localhost:3000` (potem zmień na produkcyjny URL)
  - Redirect URLs: `http://localhost:3000/**`, potem dodaj produkcyjny `https://your-app.vercel.app/**`
- Authentication → Providers → Email: enabled
- (Opcjonalnie) Confirm email: OFF w dev, ON w prod

### 4. Wygeneruj typy
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/database.types.ts
```

Uruchom to po każdej zmianie schema (lub setup CI job).

## Google App Password (dla SMTP)

1. Idź do https://myaccount.google.com/security
2. Włącz 2-Step Verification (wymagane)
3. Po włączeniu, pojawi się „App passwords" https://myaccount.google.com/apppasswords
4. Stwórz app password:
   - App: „Mail"
   - Device: „Travel Planner"
5. Skopiuj 16-znakowy token → do `.env.local` jako `SMTP_APP_PASSWORD`
6. Jako `SMTP_USER` użyj swojego Gmail (np. `bartosz@gmail.com`)

**Uwaga:** Jeśli masz Google Workspace, admin musi pozwolić na app passwords. Dla zwykłego Gmail — działa od razu.

**Alternatywa na przyszłość**: Jeśli limity Gmail (500 maili/dzień) będą problemem — przesiądź się na Resend (dedykowany do maili transakcyjnych, 100 dziennie free, dużo więcej w pro). Na MVP Gmail wystarczy.

## PWA setup

### `app/manifest.ts`

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Travel Planner',
    short_name: 'TravelPlanner',
    description: 'Plan your European road trips',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

### Ikony

Wygeneruj:
- `public/icons/icon-192.png` — 192x192 px
- `public/icons/icon-512.png` — 512x512 px
- `public/icons/icon-maskable-512.png` — 512x512 px, z 20% safe zone wokół (tło wypełnione, logo w centrum)
- `public/icons/apple-touch-icon.png` — 180x180 px

Można użyć https://realfavicongenerator.net albo https://maskable.app.

### Service worker przez `@serwist/next`

```bash
npm install @serwist/next serwist
```

### `serwist.config.ts` (w root repo)

Brak — serwist konfiguruje się przez `next.config.ts` i `app/sw.ts`.

### `app/sw.ts`

```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

### `next.config.ts`

```typescript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

const config = {
  // ...
}

export default withSerwist(withNextIntl(config))
```

### Metadata w layoutcie

`app/[locale]/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: 'Plan your European road trips',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Travel Planner',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
```

### Install prompt

`components/pwa/InstallPWAButton.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function InstallPWAButton() {
  const [prompt, setPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible) return null

  return (
    <Button variant="outline" size="sm" onClick={async () => {
      if (!prompt) return
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setVisible(false)
    }}>
      <Download className="h-4 w-4 mr-2" />
      Zainstaluj aplikację
    </Button>
  )
}
```

Umieść w `/settings` i na dashboardzie (dyskretnie).

## Deploy Vercel

### 1. Push do GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:you/travel-planner.git
git push -u origin main
```

### 2. Importuj do Vercel
- https://vercel.com/new
- Import Git repository
- Framework: Next.js (auto-detected)
- Environment Variables: wklej wszystkie z `.env.local` (patrz sekcja „Na Vercel" wyżej)
- Deploy

### 3. Po deployu
- Skopiuj produkcyjny URL Vercel (np. `https://travel-planner-xyz.vercel.app`)
- Zaktualizuj `NEXT_PUBLIC_APP_URL` w Vercel env vars (Production)
- W Supabase:
  - Site URL: `https://travel-planner-xyz.vercel.app`
  - Redirect URLs: `https://travel-planner-xyz.vercel.app/**`
- Redeploy w Vercel (Settings → Deployments → Redeploy z najnowszym commit'em)

### 4. Custom domain (opcjonalnie)
- Vercel Project → Settings → Domains → Add
- Skonfiguruj DNS u rejestratora
- Zaktualizuj wszędzie gdzie masz URL (Supabase, env var `NEXT_PUBLIC_APP_URL`)

## Vercel Cron setup

Cron jest już skonfigurowany w `vercel.json` w repo. Po pierwszym deployu:

1. Vercel wykryje `vercel.json` i automatycznie aktywuje crons
2. Sprawdź w Vercel Dashboard → Settings → Cron Jobs — powinieneś widzieć 2 zadania
3. Możesz ręcznie wyzwolić test cron przez dashboard lub CLI

## PWA testing

### Desktop (Chrome/Edge):
- Otwórz devtools → Application → Manifest → sprawdź czy załadowany
- Application → Service Workers → sprawdź czy zarejestrowany
- URL bar → ikona „install"

### Mobile (iOS Safari):
- Share → Add to Home Screen
- iOS NIE obsługuje `beforeinstallprompt` — wyświetl ręcznie instrukcję dla iOS userów

### Mobile (Android Chrome):
- Prompt pojawi się automatycznie po spełnieniu kryteriów (HTTPS, manifest, SW, kilku wizyt)
- Lub menu → „Install app"

### Lighthouse PWA audit
W Chrome DevTools → Lighthouse → PWA checkbox → Generate report. Celuj w 90+.

## Checklist przed pierwszym deploy

- [ ] Wszystkie migracje wykonane w Supabase
- [ ] RLS enabled i przetestowane manualnie (user A nie widzi danych usera B)
- [ ] Typy wygenerowane (`lib/supabase/database.types.ts` istnieje)
- [ ] Wszystkie env vars ustawione w `.env.local` i na Vercel
- [ ] Ikony PWA wygenerowane (`public/icons/*.png`)
- [ ] `manifest.webmanifest` renderuje się (sprawdź `/manifest.webmanifest` lokalnie)
- [ ] Service worker rejestruje się (DevTools → Application → Service Workers)
- [ ] `npm run build` przechodzi bez błędów
- [ ] `npm run lint` przechodzi
- [ ] Typy: `npx tsc --noEmit` przechodzi
- [ ] Test logowania i tworzenia podróży na localhost
- [ ] Test wysyłki maila (trigger invitation, sprawdź skrzynkę)
- [ ] Test cron lokalnie (curl z secret'em)

## Monitoring (opcjonalnie, na później)

- **Vercel Analytics** — built-in, free tier
- **Supabase Logs** — wbudowane w dashboard
- **Sentry** — error tracking (opcjonalnie, na post-MVP)
