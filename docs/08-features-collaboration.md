# 08 — Features: Collaboration (members, invitations)

## Członkowie podróży

Ścieżka: `/trips/{id}/members`

### Dostęp

- Każdy member (owner + editor) widzi listę członków i pending invitations
- Tylko owner może zapraszać, usuwać członków, anulować invitations

### UI

**Sekcja 1: Aktywni członkowie**

- Lista `MemberRow`:
  - Avatar z inicjałami (z `profiles.display_name` lub email)
  - `display_name ?? email`
  - Badge roli (Owner / Editor)
  - Przycisk X (tylko dla ownera, ukryty dla siebie samego)
  - Jeśli to current user i nie owner: przycisk „Opuść podróż"

**Sekcja 2: Pending invitations** (tylko dla ownera)

- Lista z: email | status | wysłano kiedy | X (anuluj)
- Przycisk „Wyślij ponownie" (generuje nowy token + wysyła email)

**Przycisk „Zaproś" (górny prawy)** — otwiera `InviteMemberDialog`

### InviteMemberDialog

shadcn Dialog z formem:
- Input email (z walidacją zod)
- Submit: wywołuje API route `/api/invitations/send`

```typescript
const inviteSchema = z.object({
  email: z.string().email(),
})
```

### API route: `/api/invitations/send`

Plik: `app/api/invitations/send/route.ts`

Logika:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/send'
import { z } from 'zod'

const schema = z.object({
  trip_id: z.string().uuid(),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Sprawdź że user jest ownerem (RLS też to złapie, ale wcześniej błąd = lepszy UX)
  const { data: isOwner } = await supabase.rpc('is_trip_owner', { p_trip_id: parsed.data.trip_id })
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Sprawdź czy user już nie jest członkiem (szukaj po email → profile → user_id)
  // Jeśli jest — nie wysyłaj zaproszenia, zwróć info
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle()

  if (existingProfile) {
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', parsed.data.trip_id)
      .eq('user_id', existingProfile.id)
      .maybeSingle()
    if (member) return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
  }

  // Sprawdź czy nie ma już pending invitation
  const { data: existingInvite } = await supabase
    .from('trip_invitations')
    .select('id')
    .eq('trip_id', parsed.data.trip_id)
    .eq('invited_email', parsed.data.email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite) return NextResponse.json({ error: 'Invitation already pending' }, { status: 400 })

  // Utwórz zaproszenie
  const { data: invitation, error } = await supabase
    .from('trip_invitations')
    .insert({
      trip_id: parsed.data.trip_id,
      invited_email: parsed.data.email,
      invited_by: user.id,
    })
    .select('*, trip:trips(title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Wyślij email
  try {
    await sendInvitationEmail({
      to: parsed.data.email,
      token: invitation.token,
      tripTitle: invitation.trip.title,
      invitedBy: user.email ?? 'Someone',
      locale: request.headers.get('accept-language')?.startsWith('en') ? 'en' : 'pl',
    })
  } catch (emailErr) {
    // Email failed — ale invitation już w DB. Owner może wysłać ponownie.
    console.error('Email send failed:', emailErr)
  }

  return NextResponse.json({ invitation })
}
```

### Nodemailer setup

Plik: `lib/utils/email.ts`

```typescript
import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,       // np. bartosz@gmail.com
      pass: process.env.SMTP_APP_PASSWORD, // Google App Password (16 znaków)
    },
  })
}
```

**Jak wygenerować App Password w Google:**
1. Włącz 2FA na koncie Google (wymagane)
2. Idź do https://myaccount.google.com/apppasswords
3. Wygeneruj app password dla „Mail"
4. Skopiuj 16-znakowy token do `.env.local` jako `SMTP_APP_PASSWORD`

### Email sender

Plik: `lib/email/send.ts`

```typescript
import { createTransporter } from '@/lib/utils/email'
import { renderInvitationEmail } from './templates/invitation'
import { renderTripReminderEmail } from './templates/trip-reminder'

const transporter = createTransporter()
const FROM = `"Travel Planner" <${process.env.SMTP_USER}>`

export async function sendInvitationEmail(params: {
  to: string
  token: string
  tripTitle: string
  invitedBy: string
  locale: 'pl' | 'en'
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const acceptUrl = `${appUrl}/${params.locale}/invitations/accept?token=${params.token}`
  const { subject, html, text } = renderInvitationEmail({
    tripTitle: params.tripTitle,
    invitedBy: params.invitedBy,
    acceptUrl,
    locale: params.locale,
  })

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject,
    text,
    html,
  })
}

export async function sendTripReminderEmail(params: {
  to: string
  tripTitle: string
  tripId: string
  daysBefore: number
  checklistDone: number
  checklistTotal: number
  locale: 'pl' | 'en'
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const tripUrl = `${appUrl}/${params.locale}/trips/${params.tripId}/checklist`
  const { subject, html, text } = renderTripReminderEmail({ ...params, tripUrl })

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject,
    text,
    html,
  })
}
```

### Email templates

Plik: `lib/email/templates/invitation.ts`

Na MVP — HTML inline string (bez React Email, żeby nie dodawać zależności). Prosty, dobrze zformatowany HTML + plaintext fallback.

```typescript
const templates = {
  pl: {
    subject: (tripTitle: string) => `Zaproszenie do podróży: ${tripTitle}`,
    heading: 'Zaproszenie do podróży',
    body: (invitedBy: string, tripTitle: string) =>
      `${invitedBy} zaprosił Cię do współtworzenia podróży <strong>${tripTitle}</strong>.`,
    cta: 'Zaakceptuj zaproszenie',
    note: 'Zaproszenie wygasa za 7 dni.',
    ignore: 'Jeśli nie chcesz dołączyć, po prostu zignoruj tego maila.',
  },
  en: {
    subject: (tripTitle: string) => `Invitation to trip: ${tripTitle}`,
    heading: 'Trip invitation',
    body: (invitedBy: string, tripTitle: string) =>
      `${invitedBy} invited you to collaborate on the trip <strong>${tripTitle}</strong>.`,
    cta: 'Accept invitation',
    note: 'This invitation expires in 7 days.',
    ignore: 'If you don\'t want to join, just ignore this email.',
  },
}

export function renderInvitationEmail(p: {
  tripTitle: string
  invitedBy: string
  acceptUrl: string
  locale: 'pl' | 'en'
}) {
  const t = templates[p.locale]
  const subject = t.subject(p.tripTitle)

  const html = `
<!doctype html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 500;">${t.heading}</h1>
    <p style="margin: 0 0 24px; font-size: 16px;">${t.body(p.invitedBy, p.tripTitle)}</p>
    <a href="${p.acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; margin-bottom: 24px;">${t.cta}</a>
    <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">${t.note}</p>
    <p style="margin: 0; font-size: 13px; color: #64748b;">${t.ignore}</p>
  </div>
</body>
</html>`

  const text = `${t.heading}\n\n${t.body(p.invitedBy, p.tripTitle).replace(/<[^>]+>/g, '')}\n\n${p.acceptUrl}\n\n${t.note}\n${t.ignore}`

  return { subject, html, text }
}
```

Analogicznie `templates/trip-reminder.ts` — z placeholderami dla `daysBefore`, progressu checklisty i linku do trip.

## Accept invitation flow

### Strona: `/invitations/accept`

```typescript
// app/[locale]/invitations/accept/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/lib/i18n/routing'
import { getTranslations } from 'next-intl/server'

export default async function AcceptInvitationPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ token?: string }>
  params: Promise<{ locale: 'pl' | 'en' }>
}) {
  const { token } = await searchParams
  const { locale } = await params
  const t = await getTranslations('invitations.accept')

  if (!token) return <p>{t('errors.notFound')}</p>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect do signup z tokenem
    redirect({ href: `/signup?invitation=${token}`, locale })
  }

  // Wywołaj RPC accept_invitation
  const { data: tripId, error } = await supabase.rpc('accept_invitation', { p_token: token })

  if (error) {
    // Sparsuj errcode i pokaż odpowiedni komunikat
    let errorKey: string
    if (error.message.includes('expired')) errorKey = 'expired'
    else if (error.message.includes('mismatch')) errorKey = 'emailMismatch'
    else if (error.message.includes('processed')) errorKey = 'alreadyProcessed'
    else errorKey = 'notFound'
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1>{t('title')}</h1>
        <p className="text-red-600">{t(`errors.${errorKey}`)}</p>
      </div>
    )
  }

  redirect({ href: `/trips/${tripId}`, locale })
}
```

### Auto-accept po signup

Na stronie `/signup`, jeśli query `?invitation=TOKEN`:
- Po udanym signup + auth
- Jeśli Supabase wymaga confirmation email — pokaż info „po potwierdzeniu emaila zaakceptuj zaproszenie tym linkiem"
- Jeśli nie — od razu wywołaj RPC `accept_invitation` i redirect do trip

## Leave trip

Na stronie `/trips/{id}/settings` (dla editora):

```typescript
const leaveTrip = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    router.push('/trips')
    toast.success('Opuściłeś podróż')
  },
})
```

## Members hook

```typescript
export function useMembers(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_members')
        .select(`
          id, role, created_at, user_id,
          profile:profiles(id, email, display_name)
        `)
        .eq('trip_id', tripId)
      return data ?? []
    },
  })
}

export function useInvitations(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['invitations', tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('trip_id', tripId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })
}
```
