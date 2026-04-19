# 01 — Stack technologiczny

## Framework i język
- **Next.js 15** — App Router, React Server Components gdzie sensowne
- **TypeScript** — strict mode, `noUncheckedIndexedAccess: true`
- **React 19**

## Styling i UI
- **Tailwind CSS** (v4 lub v3 — użyj tego co obecnie rekomenduje shadcn)
- **shadcn/ui** — biblioteka komponentów (CLI: `npx shadcn@latest add ...`)
- **lucide-react** — ikony
- **next-themes** — dark mode
- **sonner** — toast notifications (shadcn oficjalnie używa sonner)

## Backend i dane
- **Supabase**:
  - PostgreSQL
  - Supabase Auth (email/password)
  - Row Level Security
  - Supabase Storage (opcjonalnie, na MVP niepotrzebne)
- **@supabase/ssr** — oficjalny SSR helper dla Next.js App Router

## State management
- **TanStack Query** (React Query v5) — server state, mutacje, optimistic updates
- **react-hook-form** — formularze
- **zod** — schema validation (razem z react-hook-form via `@hookform/resolvers/zod`)
- React Context tylko dla: theme, locale, auth user (cienki wrapper nad Supabase session)

## Formularze i walidacja
- **react-hook-form** v7+
- **zod** v3+
- **@hookform/resolvers/zod**

## Drag & drop
- **@dnd-kit/core** + **@dnd-kit/sortable** — dla waypointów i checklisty

## i18n
- **next-intl** — routing z prefiksem locale (`/pl/...`, `/en/...`)
- Pliki tłumaczeń: `lib/i18n/messages/pl.json`, `lib/i18n/messages/en.json`

## Email
- **nodemailer** — przez Google SMTP (app password z konta Google)
- Wysyłka z Next.js API routes (nie z Edge Functions Supabase — prostsze w debugu)
- Skonfigurowane z `smtp.gmail.com`, port 465 (SSL) lub 587 (STARTTLS)

## PWA
- **@serwist/next** — nowoczesny service worker (zamiast starego `next-pwa`)
- `public/manifest.json`
- Ikony: 192, 512, maskable

## Dates & formatting
- **date-fns** — formatowanie dat, operacje (nie używaj moment.js)
- **date-fns/locale** — pl, enUS
- `Intl.NumberFormat` natywny — dla liczb i walut

## Charts (opcjonalnie, dla TripSummary)
- **recharts** lub wbudowany shadcn `chart` component (oparty o recharts)

## Deployment
- **Vercel** — hosting Next.js
- **Vercel Cron Jobs** — scheduled tasks (kursy walut, reminders)
- **Supabase Cloud** — bazka (free tier na start)

## Dev tools
- **ESLint** — konfiguracja Next.js + `@typescript-eslint`
- **Prettier** — formatowanie (opcjonalnie, jeśli nie przeszkadza konflikt z ESLint)
- **TypeScript** — `tsc --noEmit` jako check

## Wersje (preferowane, ale weź najświeższe stabilne w momencie setupu)

```
next: ^15.0.0
react: ^19.0.0
typescript: ^5.6.0
@supabase/supabase-js: ^2.45.0
@supabase/ssr: ^0.5.0
@tanstack/react-query: ^5.50.0
react-hook-form: ^7.53.0
zod: ^3.23.0
@hookform/resolvers: ^3.9.0
@dnd-kit/core: ^6.1.0
@dnd-kit/sortable: ^8.0.0
next-intl: ^3.20.0
next-themes: ^0.4.0
nodemailer: ^6.9.0
@types/nodemailer: ^6.4.0
@serwist/next: ^9.0.0
serwist: ^9.0.0
date-fns: ^4.0.0
sonner: ^1.5.0
lucide-react: ^0.450.0
tailwindcss: ^3.4.0 (lub v4 jeśli shadcn już wspiera)
```

## Komponenty shadcn do zainstalowania

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label textarea select dialog drawer form table tabs checkbox slider badge separator dropdown-menu alert alert-dialog sonner skeleton sheet scroll-area popover command avatar progress accordion tooltip
```

## Nie używaj

- **next-pwa** — stary, problemy z Next 15, użyj serwist
- **moment.js** — deprecated, użyj date-fns
- **redux/zustand** — niepotrzebne, TanStack Query + Context wystarczą
- **axios** — fetch natywny wystarczy (Supabase client ma swoje)
- **server actions dla mutacji krytycznych** — klient pisze wprost do Supabase dzięki RLS
