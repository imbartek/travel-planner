# 09 — Currency conversion & Notifications (Vercel Cron)

## Currency conversion

### Frankfurter API

- Free, bez klucza, baza danych ECB
- Endpoint: `https://api.frankfurter.app/latest?from=EUR`
- Zwraca: `{ amount: 1, base: 'EUR', date: '2025-...', rates: { PLN: 4.3, USD: 1.08, ... } }`

### Lista walut do cache'owania

Pobierać kursy dla: `EUR, PLN, HUF, CZK, CHF, GBP, USD, SEK, NOK, DKK, RON, BGN, HRK` — te są pre-seedowane w migracji, cron je aktualizuje.

### Cron: refresh currency rates

Plik: `app/api/cron/refresh-currency-rates/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const CURRENCIES = ['PLN','HUF','CZK','CHF','GBP','USD','SEK','NOK','DKK','RON','BGN','HRK']

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = `https://api.frankfurter.app/latest?from=EUR&to=${CURRENCIES.join(',')}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Frankfurter API ${res.status}`)
    const data = await res.json()

    const supabase = createServiceRoleClient()

    const rows = [
      { code: 'EUR', rate_to_eur: 1 },
      ...Object.entries(data.rates).map(([code, rate]) => ({
        code,
        rate_to_eur: rate as number,
      })),
    ]

    const { error } = await supabase
      .from('currency_rates')
      .upsert(rows, { onConflict: 'code' })

    if (error) throw error

    return NextResponse.json({ updated: rows.length, rates: data.rates })
  } catch (err) {
    console.error('Currency refresh failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

### `vercel.json` — cron config

Plik: `vercel.json` (root repo)

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-currency-rates",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/send-trip-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Harmonogram: kursy codziennie 06:00 UTC, reminders codziennie 08:00 UTC. Cron na Vercel Hobby: limit 2/dzień (cron-job jest okrojony na free, ale 2 dzienne zadania mieszczą się w limicie — Pro plan daje więcej).

### `CRON_SECRET` env

Wygeneruj silny secret (`openssl rand -hex 32`), dodaj do `.env.local` i do Vercel project env. Vercel automatycznie wysyła go w header `Authorization: Bearer ...` dla swoich cronów.

### Hook `useCurrencyRates`

```typescript
// lib/hooks/useCurrencyRates.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCurrencyRates() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['currency-rates'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates').select('code, rate_to_eur')
      const map: Record<string, number> = {}
      for (const row of data ?? []) {
        map[row.code] = Number(row.rate_to_eur)
      }
      return map
    },
    staleTime: 60 * 60 * 1000, // 1h — dane z cache, aktualizowane raz dziennie przez cron
  })
}
```

### Currency utils

Plik: `lib/utils/currency.ts`

```typescript
/**
 * Converts amount from one currency to another using rates relative to EUR.
 * rates[code] = ile jednostek tej waluty kosztuje 1 EUR (np. rates.PLN = 4.3).
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) return amount // brak kursu — zwróć surową wartość
  const inEur = amount / fromRate
  return inEur * toRate
}

export function formatCurrency(amount: number, currency: string, locale: 'pl' | 'en' = 'pl'): string {
  return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
```

### `CurrencyDisplay` component

Plik: `components/shared/CurrencyDisplay.tsx`

```typescript
'use client'

import { useLocale } from 'next-intl'
import { useProfile } from '@/lib/hooks/useProfile'
import { useCurrencyRates } from '@/lib/hooks/useCurrencyRates'
import { convert, formatCurrency } from '@/lib/utils/currency'

export function CurrencyDisplay({
  amount,
  currency,
  showConverted = true,
}: {
  amount: number
  currency: string
  showConverted?: boolean
}) {
  const locale = useLocale() as 'pl' | 'en'
  const { data: profile } = useProfile()
  const { data: rates } = useCurrencyRates()
  const preferred = profile?.preferred_currency ?? 'EUR'

  const original = formatCurrency(amount, currency, locale)
  const shouldShowConverted = showConverted && currency !== preferred && rates

  return (
    <span>
      <span>{original}</span>
      {shouldShowConverted && (
        <span className="text-xs text-muted-foreground ml-2">
          ≈ {formatCurrency(convert(amount, currency, preferred, rates), preferred, locale)}
        </span>
      )}
    </span>
  )
}
```

## Trip reminders

### Cron: send trip reminders

Plik: `app/api/cron/send-trip-reminders/route.ts`

Logika:
1. Dla każdego user'a z `email_notifications_enabled = true`:
2. Znajdź trips gdzie `date_start = today + reminder_days_before` i user jest członkiem
3. Dla każdej trip: policz stats checklisty (`done/total`)
4. Wyślij email

```typescript
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendTripReminderEmail } from '@/lib/email/send'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Fetch profiles z aktywnymi notyfikacjami
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, preferred_language, reminder_days_before')
    .eq('email_notifications_enabled', true)

  if (!profiles) return NextResponse.json({ sent: 0 })

  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + profile.reminder_days_before)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Trips użytkownika startujące w target dacie
    const { data: trips } = await supabase
      .from('trips')
      .select('id, title, date_start, trip_members!inner(user_id)')
      .eq('date_start', targetDateStr)
      .eq('trip_members.user_id', profile.id)

    for (const trip of trips ?? []) {
      // Policz checklist stats
      const { count: total } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
      const { count: done } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
        .eq('is_done', true)

      try {
        await sendTripReminderEmail({
          to: profile.email,
          tripTitle: trip.title,
          tripId: trip.id,
          daysBefore: profile.reminder_days_before,
          checklistDone: done ?? 0,
          checklistTotal: total ?? 0,
          locale: profile.preferred_language as 'pl' | 'en',
        })
        sent++
      } catch (err) {
        console.error(`Reminder failed for ${profile.email}/${trip.id}:`, err)
        failed++
      }
    }
  }

  return NextResponse.json({ sent, failed })
}
```

### Email template: trip reminder

Plik: `lib/email/templates/trip-reminder.ts`

```typescript
const templates = {
  pl: {
    subject: (title: string, days: number) =>
      days === 0
        ? `Twoja podróż "${title}" zaczyna się dzisiaj!`
        : `Twoja podróż "${title}" startuje za ${days} ${days === 1 ? 'dzień' : 'dni'}`,
    greeting: 'Cześć!',
    body: (title: string, days: number) =>
      days === 0
        ? `Twoja podróż <strong>${title}</strong> zaczyna się dzisiaj. Gotowy?`
        : `Twoja podróż <strong>${title}</strong> startuje za ${days} ${days === 1 ? 'dzień' : 'dni'}.`,
    progress: (done: number, total: number) =>
      total > 0
        ? `Checklist: ${done}/${total} spakowane.`
        : 'Nie masz jeszcze listy rzeczy do spakowania.',
    cta: 'Sprawdź listę',
    footer: 'Możesz wyłączyć powiadomienia w ustawieniach.',
  },
  en: {
    subject: (title: string, days: number) =>
      days === 0
        ? `Your trip "${title}" starts today!`
        : `Your trip "${title}" starts in ${days} ${days === 1 ? 'day' : 'days'}`,
    greeting: 'Hi!',
    body: (title: string, days: number) =>
      days === 0
        ? `Your trip <strong>${title}</strong> starts today. Ready?`
        : `Your trip <strong>${title}</strong> starts in ${days} ${days === 1 ? 'day' : 'days'}.`,
    progress: (done: number, total: number) =>
      total > 0
        ? `Checklist: ${done}/${total} packed.`
        : 'You don\'t have a packing list yet.',
    cta: 'Check your list',
    footer: 'You can disable notifications in settings.',
  },
}

export function renderTripReminderEmail(p: {
  tripTitle: string
  tripUrl: string
  daysBefore: number
  checklistDone: number
  checklistTotal: number
  locale: 'pl' | 'en'
}) {
  const t = templates[p.locale]
  const subject = t.subject(p.tripTitle, p.daysBefore)

  const html = `
<!doctype html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <p style="margin: 0 0 16px; font-size: 16px;">${t.greeting}</p>
    <p style="margin: 0 0 16px; font-size: 16px;">${t.body(p.tripTitle, p.daysBefore)}</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #475569;">${t.progress(p.checklistDone, p.checklistTotal)}</p>
    <a href="${p.tripUrl}" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; margin-bottom: 24px;">${t.cta}</a>
    <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8;">${t.footer}</p>
  </div>
</body>
</html>`

  const text = `${t.greeting}\n\n${t.body(p.tripTitle, p.daysBefore).replace(/<[^>]+>/g, '')}\n${t.progress(p.checklistDone, p.checklistTotal)}\n\n${p.tripUrl}\n\n${t.footer}`

  return { subject, html, text }
}
```

### User preferences (ustawienia notyfikacji)

Na stronie `/settings`:
- Checkbox „Powiadomienia email" (`email_notifications_enabled`)
- Select „Dni przed wyjazdem" (wartości 0, 1, 2, 3, 5, 7, 14, 30)
- Zmiany zapisywane do `profiles` z optimistic update

## Testowanie cronów lokalnie

Vercel Cron nie odpali lokalnie. Masz 3 opcje testowania:

1. **Ręcznie hit'owany endpoint** (preferowane w dev):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/refresh-currency-rates
   ```

2. **Node script w `scripts/test-cron.ts`** wywołujący logikę bez HTTP

3. **Vercel CLI**: `vercel dev` + wywołanie URL cron-a

## Edge cases

- **Email wysyłanie fail**: cron nie failuje całego joba, loguje error i kontynuuje (per-user isolation)
- **Kurs waluty brak w cache**: `convert()` zwraca surową wartość, UI pokazuje tylko oryginalną walutę
- **User zmienia datę trip po wysłaniu reminder'a**: na MVP nie martwimy się o to, email już wysłany
- **Cron niewykonany (błąd infra)**: Vercel ma retry mechanism, ale i tak warto mieć monitoring na failed kursy — jeśli `updated_at` w `currency_rates` > 48h wstecz, można pokazać banner w UI
