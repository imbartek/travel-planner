# Travel Planner PWA — specyfikacja projektu

Kompletna specyfikacja mini-aplikacji do planowania podróży samochodowych po Europie.

## Jak używać tej specyfikacji z Claude Code

1. Wrzuć cały folder `docs/` do świeżego repo (lub zachowaj tę strukturę folderów).
2. Zainicjalizuj projekt: `npx create-next-app@latest .` z flagami dla TS + Tailwind + App Router.
3. Przygotuj `.env.local` (patrz `11-deployment.md`).
4. Otwórz Claude Code w repo i wklej prompt:

```
Przeczytaj docs/00-overview.md i docs/12-work-order.md. Zacznij od kroku 1 z work order. Po każdym ukończonym kroku zrób commit (feat(scope): description) i pokaż mi co zostało zrobione, nie idź dalej bez mojego potwierdzenia.
```

5. Pojedyncze pliki specki otwieraj na żądanie Claude Code (będzie prosił o konkretne dokumenty przy kolejnych krokach).

## Struktura dokumentacji

| Plik | Zawartość |
|------|-----------|
| `00-overview.md` | Cel aplikacji, kluczowe feature'y, zasady ogólne |
| `01-stack.md` | Wszystkie technologie i biblioteki |
| `02-project-structure.md` | Struktura folderów i plików |
| `03-database-schema.md` | Pełna schema Supabase + RLS + triggery |
| `04-auth.md` | Flow autentykacji i middleware |
| `05-i18n.md` | Internacjonalizacja (PL/EN) |
| `06-features-trips.md` | Dashboard, CRUD podróży, templates |
| `07-features-trip-detail.md` | Waypointy, winiety, kalkulator paliwa, checklist, expenses |
| `08-features-collaboration.md` | Members, invitations, email flow |
| `09-currency-and-notifications.md` | Currency API, Vercel Cron, notyfikacje email |
| `10-import-export.md` | JSON import/export |
| `11-deployment.md` | PWA config, env vars, deploy Vercel + Supabase |
| `12-work-order.md` | Kolejność implementacji (krok po kroku) |
| `13-ui-ux-guidelines.md` | Design, komponenty, accessibility |

## Stack w skrócie

- Next.js 15 + TypeScript (strict)
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- TanStack Query + react-hook-form + zod
- next-intl (PL/EN)
- @serwist/next (PWA)
- Nodemailer + Google SMTP
- Vercel (hosting + Cron Jobs)
