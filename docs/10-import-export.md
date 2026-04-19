# 10 — Import / Export JSON

## Export

### Trigger

Przycisk „Eksportuj JSON" w `/trips/{id}/settings`.

### API route: `/api/trips/export/[id]`

Plik: `app/api/trips/export/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS upewni się, że user widzi tylko swoje
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      waypoints(*),
      vignettes(*),
      fuel_calculation:fuel_calculations(*, price_segments:fuel_price_segments(*)),
      checklist_items(*),
      expenses(*)
    `)
    .eq('id', tripId)
    .single()

  if (error || !trip) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    trip: {
      title: trip.title,
      country_from: trip.country_from,
      country_to: trip.country_to,
      date_start: trip.date_start,
      date_end: trip.date_end,
      notes: trip.notes,
    },
    waypoints: trip.waypoints
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((w: any) => ({ city: w.city, country: w.country, note: w.note, order_index: w.order_index })),
    vignettes: trip.vignettes.map((v: any) => ({
      country: v.country,
      duration: v.duration,
      cost: v.cost,
      currency: v.currency,
      purchase_url: v.purchase_url,
      note: v.note,
    })),
    fuel_calculation: trip.fuel_calculation
      ? {
          car_model: trip.fuel_calculation.car_model,
          consumption: trip.fuel_calculation.consumption,
          tank_size: trip.fuel_calculation.tank_size,
          total_distance: trip.fuel_calculation.total_distance,
          start_with_full_tank: trip.fuel_calculation.start_with_full_tank,
          price_segments: (trip.fuel_calculation.price_segments ?? [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((s: any) => ({
              country: s.country,
              price_per_liter: s.price_per_liter,
              currency: s.currency,
              order_index: s.order_index,
            })),
        }
      : null,
    checklist_items: trip.checklist_items
      .sort((a: any, b: any) => a.category.localeCompare(b.category) || a.order_index - b.order_index)
      .map((c: any) => ({
        category: c.category,
        item: c.item,
        is_done: c.is_done,
        order_index: c.order_index,
      })),
    expenses: trip.expenses.map((e: any) => ({
      category: e.category,
      label: e.label,
      amount: e.amount,
      currency: e.currency,
    })),
  }

  const filename = `trip-${slugify(trip.title)}-${new Date().toISOString().split('T')[0]}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
```

### `ExportButton` component

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function ExportButton({ tripId }: { tripId: string }) {
  const handleExport = () => {
    // Prosty link — przeglądarka sama pobierze plik
    window.location.href = `/api/trips/export/${tripId}`
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Eksportuj JSON
    </Button>
  )
}
```

## Import

### Trigger

Przycisk „Importuj JSON" na dashboardzie (`/trips`, obok „+ Nowa podróż").

### `ImportDialog` component

shadcn Dialog z:
- Input `type="file"` accept=".json,application/json"
- Po wybraniu pliku — preview (tytuł podróży, liczba waypointów, itd.)
- Przyciski: Anuluj | Importuj

### Walidacja

Plik: `lib/validation/import.ts`

```typescript
import { z } from 'zod'

export const importSchema = z.object({
  version: z.literal('1.0'),
  exported_at: z.string(),
  trip: z.object({
    title: z.string().min(1),
    country_from: z.string().nullable().optional(),
    country_to: z.string().nullable().optional(),
    date_start: z.string().nullable().optional(),
    date_end: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  waypoints: z.array(z.object({
    city: z.string(),
    country: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    order_index: z.number().int(),
  })).default([]),
  vignettes: z.array(z.object({
    country: z.string(),
    duration: z.string().nullable().optional(),
    cost: z.number(),
    currency: z.string(),
    purchase_url: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })).default([]),
  fuel_calculation: z.object({
    car_model: z.string().nullable().optional(),
    consumption: z.number().nullable().optional(),
    tank_size: z.number().nullable().optional(),
    total_distance: z.number().nullable().optional(),
    start_with_full_tank: z.boolean(),
    price_segments: z.array(z.object({
      country: z.string(),
      price_per_liter: z.number(),
      currency: z.string(),
      order_index: z.number().int(),
    })).default([]),
  }).nullable().optional(),
  checklist_items: z.array(z.object({
    category: z.string(),
    item: z.string(),
    is_done: z.boolean(),
    order_index: z.number().int(),
  })).default([]),
  expenses: z.array(z.object({
    category: z.enum(['transport','accommodation','food','activities','vignettes','fuel','other']),
    label: z.string(),
    amount: z.number(),
    currency: z.string(),
  })).default([]),
})

export type TripImport = z.infer<typeof importSchema>
```

### Mutacja import

```typescript
const importTrip = useMutation({
  mutationFn: async (payload: TripImport) => {
    const supabase = createClient()
    const { user } = useAuth()

    // 1. Utwórz trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        owner_id: user.id,
        ...payload.trip,
      })
      .select()
      .single()
    if (tripError) throw tripError

    // 2. Trigger tworzy trip_member (owner), ale NIE chcemy default checklisty
    // (importujemy własną). Usuń ją.
    // Problem: seed jest tylko na RPC, a trigger on_trip_created nie seeduje
    // checklisty — seeding jest explicit z klienta w createTrip.
    // Przy imporcie: nie wywołujemy seed_default_checklist.

    // 3. Insert waypoints
    if (payload.waypoints.length > 0) {
      await supabase.from('waypoints').insert(
        payload.waypoints.map((w) => ({ ...w, trip_id: trip.id }))
      )
    }

    // 4. Insert vignettes
    if (payload.vignettes.length > 0) {
      await supabase.from('vignettes').insert(
        payload.vignettes.map((v) => ({ ...v, trip_id: trip.id }))
      )
    }

    // 5. Insert fuel calculation + segments
    if (payload.fuel_calculation) {
      const { price_segments, ...fuelData } = payload.fuel_calculation
      const { data: fuel } = await supabase
        .from('fuel_calculations')
        .insert({ ...fuelData, trip_id: trip.id })
        .select()
        .single()
      if (fuel && price_segments.length > 0) {
        await supabase.from('fuel_price_segments').insert(
          price_segments.map((s) => ({ ...s, fuel_calculation_id: fuel.id }))
        )
      }
    }

    // 6. Insert checklist
    if (payload.checklist_items.length > 0) {
      await supabase.from('checklist_items').insert(
        payload.checklist_items.map((c) => ({ ...c, trip_id: trip.id }))
      )
    }

    // 7. Insert expenses
    if (payload.expenses.length > 0) {
      await supabase.from('expenses').insert(
        payload.expenses.map((e) => ({ ...e, trip_id: trip.id }))
      )
    }

    return trip
  },
  onSuccess: (trip) => {
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    toast.success('Podróż zaimportowana')
    router.push(`/trips/${trip.id}`)
  },
  onError: (err) => {
    toast.error(`Import nie powiódł się: ${err.message}`)
  },
})
```

### Flow importu

```typescript
'use client'

import { useState } from 'react'
import { importSchema } from '@/lib/validation/import'

export function ImportDialog() {
  const [preview, setPreview] = useState<TripImport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const importMutation = useImportTrip()

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const parsed = importSchema.parse(json)
      setPreview(parsed)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid file')
      setPreview(null)
    }
  }

  const handleImport = () => {
    if (preview) importMutation.mutate(preview)
  }

  return (
    <Dialog>
      ...
      <Input type="file" accept=".json,application/json" onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
      }} />
      {error && <Alert variant="destructive">{error}</Alert>}
      {preview && (
        <div>
          <h3>{preview.trip.title}</h3>
          <p>{preview.waypoints.length} waypointów, {preview.checklist_items.length} pozycji checklisty</p>
          <Button onClick={handleImport} disabled={importMutation.isPending}>Importuj</Button>
        </div>
      )}
    </Dialog>
  )
}
```

### Członkowie i eksport

- **Eksport NIE zawiera członków ani zaproszeń** — to dane relacyjne, specyficzne dla konkretnego konta.
- **Importowana podróż ma tylko ownera** (osobę importującą). Jeśli chce współdzielić, musi zaprosić ponownie.
- **template_id nie jest importowane** — importowana trip nie jest powiązana z templatem.

## Future: Export all trips

Na MVP eksportujemy pojedynczą trip. W przyszłości dodaj na `/settings` przycisk „Eksportuj wszystkie podróże" → zip z plikami JSON.
