# 02 — Struktura projektu

## Pełna struktura folderów

```
travel-planner/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx              # auth guard + app shell
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx            # dashboard
│   │   │   │   ├── new/page.tsx        # create (z template picker)
│   │   │   │   └── [id]/
│   │   │   │       ├── layout.tsx      # tabs navigation
│   │   │   │       ├── page.tsx        # overview
│   │   │   │       ├── route/page.tsx
│   │   │   │       ├── vignettes/page.tsx
│   │   │   │       ├── fuel/page.tsx
│   │   │   │       ├── checklist/page.tsx
│   │   │   │       ├── expenses/page.tsx
│   │   │   │       ├── members/page.tsx
│   │   │   │       └── settings/page.tsx
│   │   │   ├── templates/
│   │   │   │   └── page.tsx            # lista systemowych templates
│   │   │   ├── settings/
│   │   │   │   └── page.tsx            # profil, język, theme, notyfikacje
│   │   │   └── invitations/
│   │   │       └── accept/page.tsx     # strona akceptacji zaproszenia
│   │   ├── layout.tsx                  # root dla locale (providers)
│   │   └── not-found.tsx
│   ├── api/
│   │   ├── invitations/
│   │   │   ├── accept/route.ts
│   │   │   └── send/route.ts           # nodemailer (server-only)
│   │   ├── cron/
│   │   │   ├── refresh-currency-rates/route.ts
│   │   │   └── send-trip-reminders/route.ts
│   │   └── trips/
│   │       └── export/[id]/route.ts    # export JSON
│   ├── manifest.ts                     # Next.js native manifest
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── ui/                             # shadcn — NIE EDYTUJ RĘCZNIE, generuj przez CLI
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── LocaleSwitcher.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── UserMenu.tsx
│   │   └── PageHeader.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── trips/
│   │   ├── TripCard.tsx
│   │   ├── TripForm.tsx
│   │   ├── TripHeader.tsx
│   │   ├── TripTabs.tsx
│   │   ├── TripsList.tsx
│   │   └── DeleteTripDialog.tsx
│   ├── waypoints/
│   │   ├── WaypointList.tsx
│   │   ├── SortableWaypointItem.tsx
│   │   └── AddWaypointDialog.tsx
│   ├── vignettes/
│   │   ├── VignetteTable.tsx
│   │   ├── VignetteRow.tsx
│   │   └── VignetteForm.tsx
│   ├── fuel/
│   │   ├── FuelCalculator.tsx          # główny komponent
│   │   ├── FuelInputs.tsx
│   │   ├── FuelPriceSegments.tsx
│   │   ├── FuelResults.tsx
│   │   └── FuelBreakdownChart.tsx
│   ├── checklist/
│   │   ├── ChecklistView.tsx
│   │   ├── ChecklistCategory.tsx
│   │   ├── SortableChecklistItem.tsx
│   │   ├── AddChecklistItemForm.tsx
│   │   └── ChecklistProgress.tsx
│   ├── expenses/
│   │   ├── ExpenseList.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseCategoryBadge.tsx
│   │   └── TripSummary.tsx
│   ├── members/
│   │   ├── MemberList.tsx
│   │   ├── MemberRow.tsx
│   │   ├── InviteMemberDialog.tsx
│   │   └── PendingInvitations.tsx
│   ├── templates/
│   │   ├── TemplateCard.tsx
│   │   └── TemplatePicker.tsx
│   ├── import-export/
│   │   ├── ExportButton.tsx
│   │   └── ImportDialog.tsx
│   ├── pwa/
│   │   └── InstallPWAButton.tsx
│   └── shared/
│       ├── CurrencyInput.tsx
│       ├── CurrencyDisplay.tsx
│       ├── CountrySelect.tsx
│       ├── DatePicker.tsx
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # browser client
│   │   ├── server.ts                   # server component client
│   │   ├── middleware.ts               # session refresh
│   │   ├── service-role.ts             # admin client (tylko API routes)
│   │   └── database.types.ts           # generated via CLI
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useTrips.ts
│   │   ├── useTrip.ts
│   │   ├── useWaypoints.ts
│   │   ├── useVignettes.ts
│   │   ├── useFuelCalculation.ts
│   │   ├── useChecklist.ts
│   │   ├── useExpenses.ts
│   │   ├── useMembers.ts
│   │   ├── useInvitations.ts
│   │   ├── useTemplates.ts
│   │   ├── useCurrencyRates.ts
│   │   └── useDebounce.ts
│   ├── utils/
│   │   ├── currency.ts                 # przeliczanie walut
│   │   ├── format.ts                   # daty, liczby, waluty
│   │   ├── countries.ts                # lista krajów EU
│   │   ├── slugify.ts
│   │   ├── cn.ts                       # shadcn classnames helper
│   │   └── email.ts                    # nodemailer transporter
│   ├── i18n/
│   │   ├── config.ts                   # locales, defaultLocale
│   │   ├── request.ts                  # next-intl getRequestConfig
│   │   ├── routing.ts                  # next-intl routing
│   │   └── messages/
│   │       ├── pl.json
│   │       └── en.json
│   ├── validation/
│   │   ├── trip.ts
│   │   ├── waypoint.ts
│   │   ├── vignette.ts
│   │   ├── fuel.ts
│   │   ├── checklist.ts
│   │   ├── expense.ts
│   │   ├── auth.ts
│   │   ├── invitation.ts
│   │   └── import.ts
│   ├── email/
│   │   ├── templates/
│   │   │   ├── invitation.tsx          # React Email (lub HTML string)
│   │   │   ├── trip-reminder.tsx
│   │   │   └── shared.tsx
│   │   └── send.ts                     # wrapper nad nodemailer
│   └── constants/
│       ├── currencies.ts
│       ├── expense-categories.ts
│       └── trip-tabs.ts
├── public/
│   ├── manifest.json                   # OPCJONALNIE, jeśli używasz app/manifest.ts — pomiń
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon-maskable-512.png
│   │   └── apple-touch-icon.png
│   ├── robots.txt
│   └── favicon.ico
├── supabase/
│   ├── migrations/
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_rls_policies.sql
│   │   ├── 20250101000002_functions_triggers.sql
│   │   ├── 20250101000003_seed_default_checklist.sql
│   │   └── 20250101000004_seed_templates.sql
│   └── config.toml                     # supabase CLI config
├── middleware.ts                       # i18n + auth refresh
├── next.config.ts
├── serwist.config.ts                   # PWA SW config
├── tailwind.config.ts
├── tsconfig.json
├── components.json                     # shadcn
├── package.json
├── .env.local.example
├── .env.local                          # NIE COMMITOWAĆ
├── .gitignore
├── .eslintrc.json
└── README.md
```

## Konwencje nazewnictwa

- **Komponenty**: `PascalCase` (`TripCard.tsx`)
- **Hooki**: `useCamelCase.ts` (`useWaypoints.ts`)
- **Utilsy**: `camelCase.ts` (`formatCurrency.ts`)
- **Konstanty**: `SCREAMING_SNAKE_CASE` jako wartość, `camelCase` jako nazwa pliku
- **Typy / interfejsy**: `PascalCase`, bez prefiksu `I` (używaj `Trip` nie `ITrip`)
- **Pliki API routes**: `route.ts` (konwencja Next.js)
- **Pliki pages**: `page.tsx` (konwencja Next.js)

## Konwencje importów

- Alias `@/*` → `./` (konfiguracja w `tsconfig.json`)
- Kolejność:
  1. Zewnętrzne pakiety
  2. Puste linie
  3. Wewnętrzne `@/...`
  4. Puste linia
  5. Relatywne `./...`
  6. Pusta linia
  7. Typy (`import type`)

## Gdzie co trzymać — quick guide

- **Schema DB** → `supabase/migrations/`
- **Logika biznesowa** → `lib/utils/` lub `lib/hooks/`
- **UI atomowe** → `components/ui/` (shadcn)
- **UI specyficzne dla feature** → `components/{feature}/`
- **UI współdzielone między feature'ami** → `components/shared/`
- **Komponenty layoutu** → `components/layout/`
- **Walidacje** → `lib/validation/` (jeden plik per entity)
- **Stałe** → `lib/constants/`
- **Supabase clients** → `lib/supabase/`
