# 12 — Work order (kolejność implementacji)

**To jest główny dokument dla Claude Code.** Wykonuj kroki w kolejności, testuj po każdym, commituj przed przejściem dalej. Nie przeskakuj kroków.

Konwencja commitów: `feat(scope): description`, `fix(scope): description`, `chore(scope): description`.

Po każdym kroku uruchom:
```bash
npm run build
npm run lint
npx tsc --noEmit
```

Przed kolejnym krokiem — pokaż użytkownikowi co zostało zrobione, poczekaj na potwierdzenie.

---

## Krok 1 — Setup projektu

**Cel:** działający Next.js z TS, Tailwind, shadcn, folder structure.

1. `npx create-next-app@latest travel-planner` z flagami: TypeScript, App Router, Tailwind, ESLint, `src/` **NIE**, alias `@/*`
2. W `tsconfig.json` włącz: `"strict": true`, `"noUncheckedIndexedAccess": true`
3. Zainicjalizuj shadcn: `npx shadcn@latest init` (Default style, Slate base color, CSS variables YES)
4. Zainstaluj komponenty shadcn (lista w `01-stack.md`)
5. Utwórz pustą strukturę folderów z `02-project-structure.md` (z plikami `.gitkeep` w pustych katalogach jeśli trzeba)
6. `.env.local.example` z `11-deployment.md`
7. `.gitignore` — dodaj `.env.local`, `public/sw.js`, `public/swe-worker-*.js`
8. `npm run build` musi przejść

**Commit:** `chore: initial project setup`

---

## Krok 2 — Supabase setup

**Cel:** baza z pełną schemą, RLS, typami TS.

1. Utwórz projekt Supabase (region Frankfurt)
2. `npm install -g supabase && supabase login && supabase init && supabase link --project-ref YOUR_ID`
3. Utwórz pliki migracji w `supabase/migrations/` wg `03-database-schema.md`
   - Przenieś `create table templates` przed `create table trips` (kolejność FK)
4. `supabase db push` (lub przez SQL Editor w dashboardzie)
5. Wygeneruj typy: `npx supabase gen types typescript --project-id YOUR_ID --schema public > lib/supabase/database.types.ts`
6. Utwórz klienty Supabase: `lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `service-role.ts` — kod z `04-auth.md`
7. Dodaj env vars do `.env.local`
8. **Manualny test RLS:**
   - Zarejestruj usera A przez Supabase dashboard (Authentication → Users → Add user)
   - W SQL editor: `insert into trips (owner_id, title) values ('USER_A_ID', 'Test')` — sprawdź że trigger stworzył trip_member
   - Zarejestruj usera B, spróbuj SELECT z perspektywy B (użyj impersonate w dashboardzie) — powinien dostać 0 wierszy

**Commit:** `feat(db): supabase schema with RLS and triggers`

---

## Krok 3 — Auth flow

**Cel:** działający login, signup, reset password, middleware.

1. `middleware.ts` (root) — kod z `04-auth.md`, łączy i18n + auth. **Uwaga:** i18n (routing.ts) zrobimy w kroku 4, tymczasowo pomiń `intlMiddleware` albo zrób placeholder.
2. Komponenty auth w `components/auth/`:
   - `LoginForm.tsx`, `SignupForm.tsx`, `ResetPasswordForm.tsx`
   - react-hook-form + zod (schema z `04-auth.md`)
   - Po submit: toast sukces/error, redirect
3. Strony: `app/[locale]/(auth)/login/page.tsx`, `signup/page.tsx`, `reset-password/page.tsx`
4. Layout auth: `app/[locale]/(auth)/layout.tsx` — wyśrodkowany container, logo
5. Hook `useAuth` w `lib/hooks/useAuth.ts`
6. **Test manualny:**
   - Signup nowego usera
   - Wyloguj
   - Login
   - Reset password — sprawdź email z linkiem (Supabase default templates)
   - Niezalogowany odwiedza `/trips` → redirect na `/login`
   - Zalogowany odwiedza `/login` → redirect na `/trips`

**Commit:** `feat(auth): email/password authentication flow`

---

## Krok 4 — i18n (PL/EN)

**Cel:** rutowanie z prefiksem locale, wszystkie teksty z messages.

1. `npm install next-intl`
2. `lib/i18n/routing.ts`, `request.ts` — kod z `05-i18n.md`
3. `next.config.ts` — wrapuj `withNextIntl`
4. Zaktualizuj `middleware.ts` — teraz podłącz prawdziwy `createIntlMiddleware`
5. Utwórz `lib/i18n/messages/pl.json` z pełnym contentem z `05-i18n.md`
6. Utwórz `lib/i18n/messages/en.json` — przetłumacz 1:1
7. `LocaleSwitcher` w `components/layout/`
8. `ThemeToggle` w `components/layout/` (next-themes setup w root layout)
9. Dodaj providers w `app/[locale]/layout.tsx`: `NextIntlClientProvider`, `ThemeProvider`, `QueryClientProvider`, `Toaster` (sonner)
10. Zrefaktoruj komponenty auth — używaj `useTranslations`
11. **Test:** `/pl/login` i `/en/login` — różne języki, przełącznik działa, URL się zmienia

**Commit:** `feat(i18n): next-intl with PL/EN locales`

---

## Krok 5 — App shell

**Cel:** layout aplikacji z nawigacją — sidebar (desktop) i bottom nav (mobile).

1. `AppShell.tsx` — root layout app z `app/[locale]/(app)/layout.tsx`:
   - Sidebar na desktop (md+)
   - Bottom nav na mobile
   - Main content area ze `<main>`
2. `Sidebar.tsx` — lista nav linków (trips, templates, settings) + `UserMenu` na dole
3. `BottomNav.tsx` — 3-4 główne ikony
4. `UserMenu.tsx` — avatar + dropdown z: imieniem, preferowanym językiem, theme toggle, logout
5. `PageHeader.tsx` — reużywalny header (title, description, actions)
6. **Test:** responsive — na mobile bottom nav widoczny, sidebar ukryty; na desktop odwrotnie

**Commit:** `feat(layout): app shell with responsive navigation`

---

## Krok 6 — Trips CRUD (bez detail page)

**Cel:** dashboard, create, edit, delete.

1. Hook `useProfile` — fetch z `profiles`
2. Hooki `useTrips`, `useTrip`, `useCreateTrip`, `useUpdateTrip`, `useDeleteTrip` wg `06-features-trips.md`
3. Helpery `copyTemplateChecklistToTrip`, `copyTemplateVignettesToTrip`
4. Hook `useTemplates`
5. Komponenty:
   - `TripCard` — karta z tytułem, krajami, datami, members avatars
   - `TripsList` — grid kart + empty state
   - `TripForm` — react-hook-form + zod + CountrySelect + DatePicker
   - `TemplatePicker` — grid templates + pusta podróż jako pierwsza opcja
   - `DeleteTripDialog` — AlertDialog z soft-confirm
6. `CountrySelect` — shared, lista z `lib/utils/countries.ts` (EU + sąsiedzi)
7. `DatePicker` — shadcn Calendar + Popover
8. Strony:
   - `/trips` — dashboard
   - `/trips/new` — template picker + form
9. **Test:** utwórz podróż z templatem, sprawdź że checklist został zseedowany. Utwórz bez templatu, sprawdź że default checklist jest załadowana.

**Commit:** `feat(trips): CRUD operations with templates`

---

## Krok 7 — Trip detail layout

**Cel:** strona szczegółów podróży z tabami.

1. `app/[locale]/(app)/trips/[id]/layout.tsx`:
   - Fetch trip data (server component)
   - Renderuje `TripHeader` + `TripTabs` + `{children}`
   - 404 jeśli trip nie istnieje lub user nie jest członkiem
2. `TripHeader` — tytuł (inline editable), daty, kraje, badge roli (owner/editor)
3. `TripTabs` — shadcn `Tabs` lub custom z scrollarea (mobile)
4. `app/[locale]/(app)/trips/[id]/page.tsx` — overview z placeholder'ami (summary każdej sekcji, na razie puste)
5. Strony pod route: `route/page.tsx`, `vignettes/page.tsx`, itd. — na razie placeholdery `<div>{name} — soon</div>`
6. **Test:** klik w TripCard → detail page otwarta, taby działają, URL się zmienia, nie-member nie ma dostępu

**Commit:** `feat(trips): detail page layout with tabs`

---

## Krok 8 — Waypoints (drag & drop)

**Cel:** zarządzanie punktami trasy z drag & drop.

1. `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Hooki: `useWaypoints`, `useAddWaypoint`, `useUpdateWaypoint`, `useDeleteWaypoint`, `useReorderWaypoints` (wg `07-features-trip-detail.md`)
3. `WaypointList` — DndContext + SortableContext
4. `SortableWaypointItem` — useSortable, drag handle, row z city/country/note, edit/delete icons
5. `AddWaypointDialog` — form (city, country, note)
6. Strona `route/page.tsx` — list + add button
7. **Test:** dodaj 3 waypointy, przestaw kolejność drag&drop, odśwież — kolejność zachowana

**Commit:** `feat(waypoints): drag and drop with crud`

---

## Krok 9 — Vignettes

**Cel:** tabela winiet z sumą w walucie usera.

1. Hooki `useVignettes`, CRUD mutations
2. `VignetteTable` — shadcn Table na desktop, karty na mobile
3. `VignetteRow` — inline editing (klik na pole → input)
4. `VignetteForm` (w dialogu dla „Dodaj winietę")
5. `CurrencyInput` — shared (number + select currency)
6. Suma na dole — **placeholder na razie** w oryginalnej walucie, prawidłowa konwersja w kroku 13
7. Strona `vignettes/page.tsx`
8. **Test:** dodaj winietę PL, AT, HU — suma się zgadza (nawet bez konwersji)

**Commit:** `feat(vignettes): crud table with totals`

---

## Krok 10 — Fuel calculator

**Cel:** pełny kalkulator paliwa z segmentami cenowymi.

1. Hooki `useFuelCalculation`, `useUpdateFuelCalculation`, `useFuelPriceSegments`
2. Utility `calculateFuel` w `lib/utils/fuel.ts`
3. Komponenty:
   - `FuelCalculator` — główny container
   - `FuelInputs` — model, consumption (slider), tank size (slider), distance, start full tank
   - `FuelPriceSegments` — lista, dodawanie, usuwanie
   - `FuelResults` — metric grid + breakdown table
   - `FuelBreakdownChart` — opcjonalnie, shadcn chart
4. `useDebounce` hook w `lib/hooks/`
5. Autosave: watch formów + debounce 500ms + mutation
6. Strona `fuel/page.tsx`
7. **Test:** wpisz wartości — kalkulacja live, zapisz (wait 500ms), odśwież — wartości zachowane

**Commit:** `feat(fuel): calculator with price segments`

---

## Krok 11 — Checklist

**Cel:** lista rzeczy z kategoriami, drag&drop, progress.

1. Hooki `useChecklist`, CRUD mutations
2. Komponenty:
   - `ChecklistView` — root, grupowanie po kategoriach w useMemo
   - `ChecklistCategory` — accordion + progress per kategoria + lista + add form
   - `SortableChecklistItem` — dnd-kit
   - `AddChecklistItemForm` — inline input (Enter submits)
   - `ChecklistProgress` — globalny progress bar
3. Strona `checklist/page.tsx`
4. **Test:** podróż ma seeded default checklist, togglowanie działa, drag&drop w ramach kategorii, dodawanie nowej kategorii

**Commit:** `feat(checklist): categorized with drag and drop`

---

## Krok 12 — Expenses + Trip summary

**Cel:** ręczne expenses + sumaryczne podsumowanie podróży.

1. Hooki `useExpenses`, CRUD mutations
2. `ExpenseList` + `ExpenseForm` (dialog)
3. `ExpenseCategoryBadge` — kolorowy badge per kategoria
4. `TripSummary` — agregacja winiet + paliwa + expenses (**nadal placeholder konwersji** w tym kroku)
5. Mini chart podziału kategorii (recharts lub shadcn chart)
6. Strona `expenses/page.tsx`
7. **Test:** dodaj expense, summary pokazuje sumę

**Commit:** `feat(expenses): list with trip summary`

---

## Krok 13 — Currency conversion

**Cel:** pełna konwersja walut wszędzie gdzie są kwoty.

1. `lib/utils/currency.ts` — `convert`, `formatCurrency`
2. Hook `useCurrencyRates`
3. `CurrencyDisplay` component (shared)
4. Zamień wszystkie surowe wyświetlenia kwot w vignettes, fuel, expenses, summary na `CurrencyDisplay`
5. `TripSummary` — poprawna konwersja do preferred currency
6. API route `/api/cron/refresh-currency-rates` — kod z `09-currency-and-notifications.md`
7. `vercel.json` z crons config
8. **Test lokalny cron:**
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/refresh-currency-rates
   ```
   Sprawdź w Supabase że `currency_rates.updated_at` się zaktualizował.

**Commit:** `feat(currency): conversion with frankfurter api cache`

---

## Krok 14 — Members + Invitations

**Cel:** zapraszanie współtwórców, accept flow.

1. Hooki `useMembers`, `useInvitations`, mutations
2. Komponenty `MemberList`, `MemberRow`, `InviteMemberDialog`, `PendingInvitations`
3. Strona `members/page.tsx`
4. API route `/api/invitations/send/route.ts` — logika z `08-features-collaboration.md`
5. `lib/utils/email.ts` — transporter nodemailer
6. `lib/email/send.ts` — `sendInvitationEmail`
7. `lib/email/templates/invitation.ts` — HTML template PL/EN
8. Strona `/invitations/accept` — server component z RPC call
9. `signup` page — obsługa query param `?invitation=TOKEN`, auto-accept po signup
10. **Test:** zaproś drugi email (inne konto test) — sprawdź skrzynkę, zaakceptuj, drugie konto widzi podróż i może edytować

**Commit:** `feat(members): invitations with email notifications`

---

## Krok 15 — Trip reminders (cron #2)

**Cel:** drugi cron — email 3 dni przed wyjazdem.

1. `lib/email/templates/trip-reminder.ts`
2. `lib/email/send.ts` — dodaj `sendTripReminderEmail`
3. API route `/api/cron/send-trip-reminders/route.ts`
4. Dodaj do `profiles`: `email_notifications_enabled` i `reminder_days_before` — już są w schemie
5. Strona `/settings` — opcje notyfikacji (checkbox + select days)
6. **Test:** utwórz podróż z `date_start = today + 3 days`, wywołaj cron ręcznie curl-em, sprawdź skrzynkę

**Commit:** `feat(notifications): trip reminder emails via cron`

---

## Krok 16 — Import / Export JSON

**Cel:** backup i odtwarzanie podróży.

1. `lib/validation/import.ts` — zod schema
2. API route `/api/trips/export/[id]/route.ts`
3. `ExportButton` component → w `/trips/[id]/settings`
4. `ImportDialog` component → na dashboardzie obok „+ Nowa podróż"
5. Hook `useImportTrip` — mutation tworząca trip + wszystkie relacje
6. **Test:** eksport podróży do JSON, import tego samego pliku jako nowa podróż, porównaj czy wszystko jest

**Commit:** `feat(io): json import and export`

---

## Krok 17 — PWA

**Cel:** instalowalna aplikacja z offline.

1. `npm install @serwist/next serwist`
2. `app/manifest.ts`
3. Wygeneruj ikony → `public/icons/`
4. `app/sw.ts` — service worker
5. `next.config.ts` — wrap `withSerwist`
6. Metadata + viewport w `app/[locale]/layout.tsx`
7. `InstallPWAButton` w `/settings`
8. **Test Lighthouse:** PWA score 90+. Test instalacji na telefonie.

**Commit:** `feat(pwa): installable with service worker`

---

## Krok 18 — Polish (loading, empty, error states)

**Cel:** dopracowanie UX wszędzie.

1. Loading states — shadcn Skeleton we wszystkich list views (trips, members, itd.)
2. Empty states — `EmptyState` component w shared, użyj wszędzie gdzie lista jest pusta
3. Error states — `ErrorState` z retry button, użyj w każdym query
4. Toast'y — sukces dla ważnych akcji, silent dla autosave
5. Spójne ikony (lucide-react)
6. Animacje — shadcn już ma transitions, ew. dodaj drobne fade-in dla list items
7. Dark mode — przetestuj wszystkie strony
8. Mobile — przetestuj wszystkie strony na viewport 375px (iPhone SE)

**Commit:** `chore(ux): polish loading empty error states`

---

## Krok 19 — Testing & debugging

**Cel:** E2E manualny test każdej ścieżki przed prod.

Checklist (wykonaj w tej kolejności):

- [ ] Signup nowy user (sprawdź email confirm jeśli włączony)
- [ ] Login, logout, reset password
- [ ] Utwórz trip z templatem
- [ ] Utwórz trip bez templatu → default checklist
- [ ] Edycja tytułu inline
- [ ] Dodaj 5 waypointów, przestaw kolejność
- [ ] Dodaj winiety z 3 różnymi walutami → suma OK
- [ ] Fuel calculator: wpisz wartości, wyjdź, wróć → zachowane
- [ ] Checklist: tog kilku pozycji, dodaj pozycję, dodaj kategorię, usuń pozycję
- [ ] Expenses: dodaj 3 różne kategorie → summary OK
- [ ] Zaproszenie drugiego usera → email → accept → drugi user widzi trip
- [ ] Drugi user edytuje trip → pierwszy user widzi zmiany po odświeżeniu
- [ ] Leave trip jako editor
- [ ] Delete trip jako owner (cascade OK)
- [ ] Export JSON
- [ ] Import JSON → wszystko jest
- [ ] Zmiana języka (PL ↔ EN) → preferencja zapisana w profilu
- [ ] Zmiana preferowanej waluty → kwoty się przeliczają
- [ ] Dark mode → wszystkie strony czytelne
- [ ] Mobile viewport → brak overflow, bottom nav widoczny
- [ ] PWA install prompt → instalacja → aplikacja otwiera się standalone
- [ ] Cron currency rates (curl) → kursy zaktualizowane
- [ ] Cron trip reminders (curl) → email otrzymany
- [ ] RLS: drugi user nie widzi cudzych tripów (SQL editor impersonate test)

**Commit:** `chore: manual e2e testing completed`

---

## Krok 20 — Deploy produkcyjny

**Cel:** aplikacja na Vercel, wszystko działa.

Kolejność (z `11-deployment.md`):

1. Push do GitHub
2. Import do Vercel
3. Dodaj env vars w Vercel (Production)
4. Deploy
5. Zaktualizuj `NEXT_PUBLIC_APP_URL` na produkcyjny URL
6. Zaktualizuj Supabase: Site URL + Redirect URLs
7. Redeploy
8. Sprawdź: `/`, login, signup, utwórz trip
9. Sprawdź cron: Vercel Dashboard → Cron Jobs → Run Now
10. Sprawdź instalację PWA na telefonie z prod URL

**Commit:** `chore: production deployment`

---

## Uwagi ogólne dla każdego kroku

- **Nigdy nie commituj** `.env.local`, `node_modules/`, `public/sw.js`
- **Po każdym kroku** — poczekaj na potwierdzenie użytkownika przed kolejnym
- **Jeśli coś jest niejasne** — zapytaj, nie zgaduj
- **Zawsze testuj manualnie** przed commitem
- **Używaj optimistic updates** wszędzie gdzie to sensowne (checkbox toggle, rename, reorder)
- **Debounce** dla inputów tekstowych (500ms) i sliderów (200ms)
- **Wszystkie kwoty** przez `CurrencyDisplay`, nigdy raw
- **RLS jest pierwszą linią obrony** — nie pisz dodatkowych checków na backendzie jeśli RLS to załatwia

Jeśli którykolwiek krok okaże się większy niż spodziewany — podziel go na podkroki i commituj częściej.
