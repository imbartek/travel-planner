# 07 — Features: Trip detail (waypoints, vignettes, fuel, checklist, expenses)

## Waypoints (Trasa)

Ścieżka: `/trips/{id}/route`

### UI

- Header z przyciskiem „+ Dodaj punkt"
- Lista waypointów z drag handle (ikona `GripVertical` z lucide)
- Każda pozycja: miasto (bold) + kraj + notatka (muted)
- Hover / swipe: ikony edycji i usunięcia
- Numerowanie (1, 2, 3...) jako counter, nie stored — reflektuje `order_index`
- Empty state: „Dodaj pierwszy punkt trasy"

### Dodawanie / edycja

`AddWaypointDialog` — shadcn Dialog z formem:
- `city` — Input (required, min 1)
- `country` — CountrySelect (opcjonalnie)
- `note` — Textarea (opcjonalnie)

Po submit: insert + invalidate query.

Edycja: klik na pozycję lub ikonę → ten sam dialog w trybie edit.

### Drag & drop

`@dnd-kit` — `DndContext` + `SortableContext` + `useSortable` w `SortableWaypointItem`.

Po drop:
1. Zaktualizuj lokalny stan (optimistic)
2. Oblicz nowe `order_index` dla wszystkich dotkniętych pozycji
3. Batch update do Supabase — wszystkie pozycje z nowymi indexami w jednym `upsert`

```typescript
const reorder = async (newOrder: Waypoint[]) => {
  const updates = newOrder.map((w, i) => ({ id: w.id, order_index: i }))
  // Supabase upsert z onConflict id
  const { error } = await supabase
    .from('waypoints')
    .upsert(updates, { onConflict: 'id' })
  if (error) toast.error(...)
}
```

### Hook `useWaypoints`

```typescript
export function useWaypoints(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['waypoints', tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from('waypoints')
        .select('*')
        .eq('trip_id', tripId)
        .order('order_index')
      return data ?? []
    },
  })
}
```

Mutacje: `useAddWaypoint`, `useUpdateWaypoint`, `useDeleteWaypoint`, `useReorderWaypoints` — wszystkie z optimistic updates.

---

## Vignettes (Winiety)

Ścieżka: `/trips/{id}/vignettes`

### UI

- Tabela shadcn `Table` (na desktop) / karty (na mobile)
- Kolumny: Kraj | Okres | Koszt | Waluta | Link | Akcje
- Inline editing — klik na komórkę otwiera input
- Footer: „Suma: XX EUR" (sumowanie w preferowanej walucie usera, przelicznik przez `useCurrencyRates`)
- Przycisk „+ Dodaj winietę"

### Form

```typescript
const vignetteSchema = z.object({
  country: z.string().min(2),
  duration: z.string().optional(),
  cost: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  purchase_url: z.string().url().optional().or(z.literal('')),
  note: z.string().optional(),
})
```

- Input cena z `CurrencyInput` (liczba + select waluty obok)
- `CountrySelect` dla country
- Duration — text input (dev wpisuje „10 dni", „roczna"; na MVP nie parsujemy)

### Calculation

```typescript
// W komponencie VignetteTable, używamy useCurrencyRates()
const { rates } = useCurrencyRates()
const profile = useProfile()
const total = vignettes.reduce((sum, v) => {
  return sum + convert(v.cost, v.currency, profile.preferred_currency, rates)
}, 0)
```

### Hook `useVignettes`

Standardowy wzorzec CRUD z optimistic updates.

---

## Fuel calculator (Kalkulator paliwa)

Ścieżka: `/trips/{id}/fuel`

### UI

Trzy sekcje:

**1. Inputs (top card)**

- Model auta — Input (opcjonalnie)
- Spalanie — Slider 3-15 step 0.1 + display
- Pojemność baku — Slider 20-100 step 1 + display
- Dystans — Input number (km)
- Start with full tank — Checkbox

**2. Price segments (middle card)**

- Lista segmentów
- Każdy: Kraj (select) | Cena (number) | Waluta (select) | X (usuń)
- Przycisk „+ Dodaj kraj"
- Min 1 segment (nie pozwalamy usunąć ostatniego, disabled na nim)

**3. Results (bottom card)**

- Metric grid 2x2:
  - Całkowite paliwo
  - Do dotankowania
  - Koszt w walucie preferowanej
  - Dystans
- Rozbicie per kraj (tabela):
  - Kraj | Litrów | Koszt lokalny | Koszt w EUR
- Opcjonalny chart (bar lub pie) — shadcn `chart` lub recharts

### Kalkulacja

```typescript
// lib/utils/fuel.ts
export function calculateFuel(
  consumption: number,   // l/100km
  totalDistance: number, // km
  tankSize: number,
  startWithFullTank: boolean,
  segments: Array<{ country: string; pricePerLiter: number; currency: string }>,
  rates: Record<string, number> // to EUR
) {
  const totalLiters = (consumption / 100) * totalDistance
  const reserveLiters = startWithFullTank ? tankSize : 0
  const litersToRefuel = Math.max(0, totalLiters - reserveLiters)

  // Podział paliwa między segmenty — proporcjonalnie (MVP)
  // Założenie: pierwszy segment pokrywa pełny bak, dalsze równo dzielą resztę
  // Prostsze: dystans dzielony równo → litry dzielone równo (MVP)
  const litersPerSegment = totalLiters / segments.length

  const breakdown = segments.map((s) => {
    const liters = litersPerSegment
    const localCost = liters * s.pricePerLiter
    const eurCost = convert(localCost, s.currency, 'EUR', rates)
    return { country: s.country, liters, localCost, currency: s.currency, eurCost }
  })

  const totalCostEur = breakdown.reduce((sum, b) => sum + b.eurCost, 0)

  return {
    totalLiters,
    litersToRefuel,
    reserveLiters,
    breakdown,
    totalCostEur,
  }
}
```

**Uwaga:** powyższy model (równy podział litrów między segmenty) jest uproszczeniem MVP. Na późniejszy iterację można dodać: „pełny bak pokrywa X km, reszta tankowana w kraju Y", ale na MVP wystarczy równy podział. User widzi to explicit w UI („Podział uproszczony, dostosuj segmenty wg planu").

### Autosave

Wszystkie inputy z debounce 500ms. Hook `useFuelCalculation(tripId)`:

```typescript
export function useFuelCalculation(tripId: string) {
  // useQuery do fetchu
  // useMutation do update (z optimistic)
  // debounce w komponencie: useDebounce helper wrapujący wartości
}
```

Zapis do `fuel_calculations` (upsert by trip_id) + batch upsert do `fuel_price_segments`.

---

## Checklist (Lista rzeczy)

Ścieżka: `/trips/{id}/checklist`

### UI

- Header z globalnym progressem (np. „42/67 spakowane")
- Sekcje per kategoria (shadcn `Accordion` — otwarte domyślnie)
- Każda sekcja: nazwa kategorii + progress per kategoria + lista pozycji
- Każda pozycja: Checkbox | Item text | drag handle | X (usuń)
- Pod sekcją: input „Dodaj pozycję" (inline, enter submits)
- Na końcu: przycisk „Dodaj kategorię" (dialog z input text + pierwsza pozycja)

### Interactions

- **Toggle checkbox**: optimistic update `is_done`
- **Drag & drop**: wewnątrz kategorii (cross-category na later), `@dnd-kit`
- **Rename item**: double-click / long-press → inline editable
- **Delete**: ikona X + confirm dialog (shadcn AlertDialog lub toast z undo)
- **Add category**: dialog z polami (nazwa, pierwsza pozycja)
- **Delete category**: usuwa wszystkie pozycje w kategorii — require confirm

### Hook `useChecklist`

```typescript
export function useChecklist(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['checklist', tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('category')
        .order('order_index')
      return data ?? []
    },
  })
}
```

Derived state (grupowanie po kategorii) liczone w komponencie przez `useMemo`.

### Progress calculation

```typescript
const stats = useMemo(() => {
  const total = items.length
  const done = items.filter((i) => i.is_done).length
  const byCategory = items.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = { total: 0, done: 0 }
    acc[i.category].total++
    if (i.is_done) acc[i.category].done++
    return acc
  }, {} as Record<string, { total: number; done: number }>)
  return { total, done, byCategory }
}, [items])
```

---

## Expenses + Trip summary

Ścieżka: `/trips/{id}/expenses`

### UI

Dwie sekcje:

**1. Summary (top)**

- `TripSummary` — karty z totalami:
  - Koszt winiet (auto z `vignettes`)
  - Koszt paliwa (auto z `fuel_calculations` + segments)
  - Inne koszty (suma z `expenses`)
  - **Razem** (w walucie preferowanej, bold big)
- Mini chart z podziałem per kategoria

**2. Expenses list (bottom)**

- Tabela/karty z expenses
- Przycisk „+ Dodaj koszt"
- Każda pozycja: kategoria (badge) | label | amount + currency | usuń/edytuj

### Form

```typescript
const expenseSchema = z.object({
  category: z.enum(['transport','accommodation','food','activities','vignettes','fuel','other']),
  label: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
})
```

### TripSummary calculation

```typescript
const useTripSummary = (tripId: string) => {
  const { data: vignettes } = useVignettes(tripId)
  const { data: fuel } = useFuelCalculation(tripId)
  const { data: expenses } = useExpenses(tripId)
  const { rates } = useCurrencyRates()
  const profile = useProfile()
  const targetCurrency = profile.data?.preferred_currency ?? 'EUR'

  return useMemo(() => {
    const vignettesTotal = (vignettes ?? []).reduce(
      (s, v) => s + convert(v.cost, v.currency, targetCurrency, rates ?? {}),
      0
    )
    const fuelTotal = calculateFuel(...) // totalCost z fuel calc, przekonwertowany
    const expensesTotal = (expenses ?? []).reduce(
      (s, e) => s + convert(e.amount, e.currency, targetCurrency, rates ?? {}),
      0
    )
    const byCategory = {
      vignettes: vignettesTotal,
      fuel: fuelTotal,
      transport: sumByCategory('transport'),
      accommodation: sumByCategory('accommodation'),
      food: sumByCategory('food'),
      activities: sumByCategory('activities'),
      other: sumByCategory('other'),
    }
    const total = Object.values(byCategory).reduce((a, b) => a + b, 0)
    return { total, byCategory, currency: targetCurrency }
  }, [vignettes, fuel, expenses, rates, targetCurrency])
}
```

Expenses w kategoriach `vignettes` i `fuel` — pokazujemy je osobno, ale nie liczymy podwójnie (są alternatywne do auto-kalkulowanych). Na MVP: jeśli user manualnie dodaje expense z tymi kategoriami, **sumujemy je dodatkowo** (w założeniu że to np. dodatkowe opłaty drogowe nieujęte w tabeli winiet). To zachowanie należy doprecyzować — mogę je zmienić, ale na MVP zakładamy że user rozumie różnicę.

---

## Wspólne wzorce mutacji

Dla wszystkich CRUD operacji używaj tego wzorca:

```typescript
export function useAddItem<T>(key: QueryKey, table: string, transform?: (d: any) => T) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(input).select().single()
      if (error) throw error
      return transform ? transform(data) : data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as T[] | undefined
      queryClient.setQueryData(key, [...(prev ?? []), { ...input, id: `temp-${Date.now()}` }])
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się dodać')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
```

## Debounce helper

```typescript
// lib/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
```

Użycie w komponencie z autosave:

```typescript
const [consumption, setConsumption] = useState(6)
const debounced = useDebounce(consumption, 500)
const updateMutation = useUpdateFuelCalculation(tripId)

useEffect(() => {
  if (debounced !== savedValue) {
    updateMutation.mutate({ consumption: debounced })
  }
}, [debounced])
```
