# 06 — Features: Trips (dashboard, CRUD, templates)

## Dashboard — lista podróży

Ścieżka: `/trips`

### Layout

- `PageHeader` z tytułem „Podróże" i przyciskiem „+ Nowa podróż" (→ `/trips/new`)
- Filtry (opcjonalne na MVP): wszystkie / nadchodzące / archiwalne
- Grid kart 1 kolumna na mobile, 2-3 na desktop

### `TripCard`

Pokazuje:
- Tytuł
- `{countryFrom} → {countryTo}` jeśli są
- Daty (lub „Brak daty")
- Badge z rolą (Owner / Editor)
- Avatar stack członków (ikony inicjałów)
- Progress checklisty (opcjonalnie, np. small progress bar)

Klik → `/trips/{id}`

### Empty state

Gdy `trips.length === 0`:
- Ikona (np. `Map` z lucide)
- Tekst "Nie masz jeszcze żadnych podróży"
- Przycisk „Stwórz podróż"

### Hook `useTrips`

```typescript
// lib/hooks/useTrips.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useTrips() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          members:trip_members(user_id, role, profiles(display_name, email)),
          checklist_stats:checklist_items(count)
        `)
        .order('date_start', { ascending: false, nullsLast: true })
      if (error) throw error
      return data
    },
  })
}
```

Hook `useTripsStats` (opcjonalnie) — liczenie `done/total` per trip.

## Tworzenie nowej podróży

Ścieżka: `/trips/new`

### Flow

1. User wybiera: template (domyślnie: „Pusta podróż") lub jeden z systemowych
2. Wypełnia formularz: tytuł (required), country from/to, daty, notatki
3. Submit:
   - Insert do `trips`
   - Trigger `handle_new_trip` automatycznie dodaje do `trip_members` jako owner
   - Jeśli wybrano template:
     - Skopiuj `template_checklist_items` do `checklist_items` tej podróży (w poprawionym locale)
     - Skopiuj `template_vignettes` jako wpisy w `vignettes` z kosztem 0 (user wypełni)
     - Ustaw `trips.template_id`
   - Jeśli nie wybrano templatu:
     - Wywołaj RPC `seed_default_checklist(trip_id, locale)`
   - Redirect do `/trips/{id}` (overview)

### `TemplatePicker` component

- Grid kart templates z DB (`useTemplates` hook)
- Pierwsza karta: „Pusta podróż"
- Wybrany template podświetlony (border info color)
- Pod pickerem: `TripForm` z polami

### `TripForm` component

```typescript
const tripFormSchema = z.object({
  title: z.string().min(1).max(100),
  country_from: z.string().optional(),
  country_to: z.string().optional(),
  date_start: z.string().optional(),  // ISO date
  date_end: z.string().optional(),
  notes: z.string().optional(),
})
```

- react-hook-form + zodResolver
- Pola: shadcn `Input`, `Textarea`, `DatePicker`, `CountrySelect` (z `shared/`)
- Przycisk „Utwórz" (submit) + „Anuluj"

### Mutacja

```typescript
const createTrip = useMutation({
  mutationFn: async (values: TripFormInput & { template_id?: string }) => {
    const supabase = createClient()

    // 1. Insert trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({ ...values, owner_id: user.id })
      .select()
      .single()
    if (error) throw error

    // 2. Seed checklist
    if (values.template_id) {
      await copyTemplateChecklistToTrip(supabase, values.template_id, trip.id, locale)
      await copyTemplateVignettesToTrip(supabase, values.template_id, trip.id)
    } else {
      await supabase.rpc('seed_default_checklist', { p_trip_id: trip.id, p_locale: locale })
    }

    return trip
  },
  onSuccess: (trip) => {
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    router.push(`/trips/${trip.id}`)
  },
})
```

## Trip overview

Ścieżka: `/trips/{id}`

### Layout

- `TripHeader`: tytuł (inline editable), daty, kraje, badge roli
- `TripTabs`: Przegląd | Trasa | Winiety | Paliwo | Lista rzeczy | Koszty | Członkowie | Ustawienia
- Content: overview — szybki podgląd wszystkich sekcji:
  - Trasa: liczba waypointów + pierwszych 3
  - Winiety: liczba + total cost
  - Paliwo: total cost jeśli jest
  - Checklist: progress bar + „X do zrobienia"
  - Koszty: łączny budżet
  - Członkowie: avatar stack

Każda sekcja ma link „Zobacz więcej" → przenosi do odpowiedniej zakładki.

### Tabs nav

Mobile: horizontal scrollable (shadcn `ScrollArea`)
Desktop: normal tabs

Aktywna zakładka podświetlona, klik → `router.push`.

### Inline editing tytułu

`TripHeader` — klik na tytuł → zmienia w input, blur → zapisuje via mutation z optimistic update.

## Trip settings

Ścieżka: `/trips/{id}/settings`

- Pełny form (jak w `new`) z update
- Autosave z debounce 500ms
- Przycisk „Eksportuj JSON" → `/api/trips/export/{id}`
- Przycisk „Usuń podróż" (tylko dla ownera) → `DeleteTripDialog`
- Przycisk „Opuść podróż" (tylko dla editora) → usuwa wpis z `trip_members`

### Delete dialog

shadcn `AlertDialog`:
- Tytuł: „Usuń podróż"
- Opis z ostrzeżeniem
- Input „Wpisz tytuł podróży aby potwierdzić" (soft-confirm)
- Przyciski: Anuluj / Usuń (destructive variant)

## Hook `useTrip`

```typescript
export function useTrip(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateTrip(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<TripUpdate>) => {
      const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
      if (error) throw error
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['trip', tripId] })
      const prev = queryClient.getQueryData(['trip', tripId])
      queryClient.setQueryData(['trip', tripId], (old: any) => ({ ...old, ...updates }))
      return { prev }
    },
    onError: (_err, _upd, ctx) => {
      queryClient.setQueryData(['trip', tripId], ctx?.prev)
      toast.error('Nie udało się zapisać')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
```

## Templates — strona przeglądu

Ścieżka: `/templates`

- Lista kart systemowych templates
- Klik na kartę → `/trips/new?template={slug}`
- Na MVP tylko preview i use-as-template — nie edytujemy.

### `useTemplates`

```typescript
export function useTemplates() {
  const supabase = createClient()
  const locale = useLocale()
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          *,
          checklist_items:template_checklist_items(*),
          vignettes:template_vignettes(*)
        `)
      if (error) throw error
      return data
    },
  })
}
```

## Helper: copy template to trip

```typescript
// lib/utils/template.ts
export async function copyTemplateChecklistToTrip(
  supabase: SupabaseClient,
  templateId: string,
  tripId: string,
  locale: 'pl' | 'en'
) {
  const { data: items } = await supabase
    .from('template_checklist_items')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index')

  if (!items?.length) return

  const rows = items.map((it) => ({
    trip_id: tripId,
    category: locale === 'en' ? it.category_en : it.category_pl,
    item: locale === 'en' ? it.item_en : it.item_pl,
    order_index: it.order_index,
  }))

  await supabase.from('checklist_items').insert(rows)
}

export async function copyTemplateVignettesToTrip(
  supabase: SupabaseClient,
  templateId: string,
  tripId: string
) {
  const { data: items } = await supabase
    .from('template_vignettes')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index')

  if (!items?.length) return

  const rows = items.map((it) => ({
    trip_id: tripId,
    country: it.country,
    duration: it.suggested_duration,
    cost: 0,
    currency: 'EUR',
  }))

  await supabase.from('vignettes').insert(rows)
}
```
