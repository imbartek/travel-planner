# 13 — UI / UX guidelines

## Filozofia designu

**Minimalizm funkcjonalny.** Aplikacja ma być czytelna, szybka, i przejrzysta. Zero ozdobników, zero gradientów, zero niepotrzebnych animacji. Jak Linear, jak Notion, jak Vercel dashboard.

**Mobile-first.** Wszystko projektujemy na 375px wide, potem skalujemy na większe.

**Content-first.** UI znika w tle, dane są na pierwszym planie.

## Design tokens

Używamy tokenów shadcn (CSS variables w `globals.css`). Nie hardcoduj kolorów — zawsze `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground` itd.

### Kolory semantyczne (shadcn defaults)

- `background` — tło aplikacji
- `foreground` — główny tekst
- `card` — tło kart (subtelnie różne od bg)
- `muted` — wyciszone tło (inputy disabled, subtelne sekcje)
- `muted-foreground` — tekst pomocniczy
- `primary` — akcenty, przyciski główne
- `destructive` — usuwanie, błędy
- `border` — obramowania
- `accent` — hover states

### Accent color

Domyślny `primary` to Slate. Dla akcentów używaj `sky-500` (#0ea5e9) jako theme_color w PWA — to daje spójność brand z manifestu.

Jeśli chcesz zmienić primary na sky, zmień w `globals.css` wartość `--primary` — shadcn init daje predefiniowane palety.

## Typografia

- System font stack (shadcn default, nie importuj custom fonts — szybszy load)
- Headings: `font-medium` (500), nie bold (700)
- Body: regular (400)
- Small/caption: `text-sm text-muted-foreground`
- Rozmiary:
  - h1: `text-2xl md:text-3xl`
  - h2: `text-xl md:text-2xl`
  - h3: `text-lg`
  - body: `text-base`
  - caption: `text-sm`
  - micro: `text-xs`

## Spacing

- Używaj tailwindowych `p-4`, `p-6`, `p-8` — nie custom px
- Sekcje: `space-y-6` lub `space-y-8`
- Form fields: `space-y-4`
- Inline elements: `gap-2`, `gap-3`

Generous whitespace — wole mieć za dużo niż za mało.

## Radius

shadcn `--radius: 0.5rem` (8px) to default. Nie zmieniaj — spójność z komponentami.

## Shadows

Unikaj. `border` + `bg-card` daje wystarczającą separację. Jedyny wyjątek: `shadow-sm` na elevated dialogs (shadcn Dialog już to ma).

## Komponenty — jak używać shadcn

### Button

Warianty (nie kombinuj zbyt wielu w jednym widoku):
- `default` — główna akcja (jeden per ekran, np. „+ Nowa podróż")
- `outline` — secondary (Anuluj, Edytuj)
- `ghost` — tertiary (ikony w tabelach, subtelne akcje)
- `destructive` — Usuń
- `link` — tylko dla naprawdę-link'owych akcji

Sizes: `sm`, `default`, `lg`, `icon` (kwadratowy dla pojedynczej ikony).

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

Używaj CardHeader/Footer tylko jeśli ma to sens — często wystarczy sam Card + padding.

### Dialog vs Sheet vs Drawer

- **Dialog** — na desktop do CRUD (Dodaj winietę, Edytuj waypoint) — modal w centrum
- **Sheet** — slide-in z boku, dla dłuższych formularzy na desktop
- **Drawer** — slide-up z dołu, mobile-only, dla krótszych formularzy

Reguła: CRUD na mobile → Drawer, na desktop → Dialog. Użyj helper hook'a do rozróżnienia (media query) lub shadcn ma oficjalny `ResponsiveDialog` pattern.

### Input / Form

Zawsze z `Label` nad inputem. Błąd pod inputem w `text-sm text-destructive`. shadcn `Form` obsługuje to automatycznie z react-hook-form.

### Tabs

Mobile: dodaj `ScrollArea` jeśli tabów jest dużo (trip detail ma 8 tabów — na mobile scrollable horizontal).

### Table

Desktop: pełna tabela. Mobile: rozważ zamianę na listę kart (bo tabele z 5+ kolumnami są nieczytelne na 375px). Wzorzec:

```tsx
<div className="hidden md:block"><VignetteTable /></div>
<div className="md:hidden"><VignetteCardList /></div>
```

### Badge

Do statusów i ról:
- `default` — neutral
- `secondary` — wyciszony
- `destructive` — error/urgent
- `outline` — minimalistyczny

Nie nadużywaj — 1-2 badge'y per karta max.

## States

### Loading

**Nie używaj spinnerów dla list.** Używaj `Skeleton` komponenty w kształcie tego, co się ładuje:

```tsx
{isPending ? (
  <div className="space-y-3">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
) : (
  <TripsList trips={data} />
)}
```

Spinner OK dla:
- Submit button (`disabled + <Loader2 className="animate-spin" />`)
- Inline loading (np. fetching currency rates w tle)

### Empty

Kompozycja: ikona (lucide) + heading + description + CTA. Użyj shared `EmptyState`:

```tsx
<EmptyState
  icon={Map}
  title={t('empty.title')}
  description={t('empty.description')}
  action={<Button onClick={...}>{t('empty.action')}</Button>}
/>
```

Ikona 48px, centered, padding `py-12`.

### Error

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Błąd</AlertTitle>
  <AlertDescription>
    {error.message}
    <Button variant="outline" size="sm" onClick={refetch}>Spróbuj ponownie</Button>
  </AlertDescription>
</Alert>
```

Lub shared `ErrorState` z retry button.

### Success feedback

Toast (sonner) dla ważnych akcji:
- Utworzono podróż
- Wysłano zaproszenie
- Zaimportowano podróż
- Usunięto (z undo jeśli da się łatwo cofnąć)

**Cichy save** (bez toastu) dla:
- Autosave inputów
- Toggle checklistы
- Reorder drag&drop

## Animacje

shadcn domyślnie ma `transitions` na hover, focus, open/close. Nie dodawaj więcej bez potrzeby.

Jeśli już dodajesz — `transition-all duration-150 ease-out`. Framer Motion niepotrzebny na MVP.

## Iconografia

Tylko `lucide-react`. Nie mieszaj z innymi zestawami ikon.

Standardowe ikony:
- Dodaj: `Plus`
- Usuń: `Trash2` lub `X`
- Edytuj: `Pencil`
- Zapisz: `Check`
- Zamknij: `X`
- Menu: `MoreVertical` (desktop), `MoreHorizontal` (mobile)
- Drag: `GripVertical`
- Podróż: `Map` lub `Plane`
- Pojazd: `Car`
- Paliwo: `Fuel`
- Koszty: `Wallet` lub `Receipt`
- Członkowie: `Users`
- Ustawienia: `Settings`
- Import: `Upload`
- Eksport: `Download`
- Ładowanie: `Loader2` (z `animate-spin`)
- Błąd: `AlertCircle`
- Sukces: `CheckCircle2`

Rozmiary: `h-4 w-4` (inline), `h-5 w-5` (nav), `h-6 w-6` (duże akcenty), `h-10 w-10` (empty state).

## Mobile patterns

### Bottom navigation

Fixed na dole, 4 pozycje: Podróże / Szablony / Ustawienia / Profil. Aktywna — filled icon + primary color. Pokazuj tylko na `< md`.

### Safe areas

Dla iOS (notch/home indicator) — dodaj `pb-safe` (custom util) lub `pb-[env(safe-area-inset-bottom)]`. Szczególnie przy bottom nav.

### Pull-to-refresh

NIE na MVP. TanStack Query `refetchOnWindowFocus` + manual refresh wystarczą.

### Swipe gestures

NIE na MVP. Drag&drop przez grab handle.

## Accessibility

### Semantic HTML

- `<button>` dla akcji, `<a>` dla nawigacji
- `<nav>`, `<main>`, `<aside>`, `<header>` — używaj
- Heading hierarchy — `h1` na stronie, `h2` dla sekcji, nie skacz poziomów

### Keyboard

- Tab order musi być sensowny
- `focus-visible:ring-2 ring-ring` — shadcn ma to domyślnie
- Escape zamyka dialog (shadcn ma)
- Enter submit'uje form (natywne)
- `@dnd-kit` — wbudowana obsługa klawiatury (spacja do grab, strzałki do ruchu, spacja do drop)

### ARIA

- shadcn komponenty mają ARIA domyślnie
- Ikony-tylko-buttony muszą mieć `aria-label` lub `<span className="sr-only">{label}</span>`
- Loading state: `aria-busy="true"`
- Dynamiczne komunikaty: `role="alert"` lub `role="status"` (shadcn Toast ma to)

### Kontrast

shadcn Slate palette ma dobry kontrast w obu motywach. Jeśli customizujesz — test na https://webaim.org/resources/contrastchecker/, cel AA (4.5:1 dla normal text).

### Focus trap

Dialog, Drawer, Sheet — shadcn ma automatycznie (Radix UI under the hood).

## Dark mode

- Używaj zawsze tokenów semantycznych (`bg-background` nie `bg-white`)
- Testuj OBIE motywy zawsze
- `next-themes` z `ThemeProvider` w root
- Respektuj system preference (default `system` mode)
- ThemeToggle: 3 opcje — jasny / ciemny / systemowy

## Performance

### Images

Na MVP niewielka ilość obrazów (tylko ikony PWA i favicon). Jeśli w przyszłości dodasz user-uploaded zdjęcia — `next/image` z Supabase Storage.

### Code splitting

- App Router dzieli per-route automatycznie
- Client components tylko gdzie trzeba — reszta Server Components
- Duże biblioteki (recharts, dnd-kit) — lazy load jeśli nie-critical

### Fonts

System fonts = zero FOIT/FOUT.

### Bundle size

Celuj w < 200KB JS na pierwsze wejście (main route). Sprawdź `next build` output.

## Dobre praktyki UX specyficzne dla tej aplikacji

### Autosave visualizacja

Przy autosave nie rozpraszaj usera. Opcjonalnie: dyskretny indicator „Zapisano" w rogu statusbar (mały tekst, fade after 2s).

### Potwierdzenia destrukcyjne

- **Usuń waypoint / checklist item** — toast z undo (zamiast dialog)
- **Usuń winietę / expense** — toast z undo
- **Usuń członka** — AlertDialog
- **Usuń podróż** — AlertDialog z soft-confirm (wpisz tytuł)
- **Opuść podróż** — AlertDialog

### Puste dane — zawsze coś pokaż

- Brak waypointów → „Dodaj pierwszy punkt trasy" z CTA
- Brak winiet → „Dodaj winiety potrzebne na trasie"
- Brak expenses → „Dodaj pierwszy koszt"
- Brak dat → „Brak daty" (wyszarzony tekst)

### Waluta — zawsze jasna

- Każda kwota ma walutę
- Jeśli różna od preferred → pokaż konwersję pod spodem (subtelny tekst)
- Tooltip z datą kursu (opcjonalne, jak czas będzie)

### Mobile touch targets

Min 44x44 px dla każdego interaktywnego elementu (Apple HIG). shadcn Button `size="default"` ma ~40px — dla mobile-only CTA używaj `size="lg"`.

### Checkbox label clickable

Etykieta checkboxa musi togglować checkbox. Używaj shadcn `Label htmlFor="..."` lub opakuj w `<label>`.

### Form validation

- Inline, pod inputem (nie alert na górze)
- Po submit — scroll do pierwszego błędu
- Nie waliduj onChange (irytuje), waliduj onBlur lub onSubmit
- zod messages spolszczone (ew. własne messages w schema)

### Numbers input

- `inputMode="decimal"` dla liczb na mobile (wysuwa numeric keyboard)
- `pattern="[0-9]*"` dla integer
- Formatowanie w blur (np. „6" → „6.00")

## Komponenty reużywalne do zbudowania

Lista shared components do budowy na początku:

1. `EmptyState` — ikona + heading + desc + action
2. `LoadingState` — skeleton grid
3. `ErrorState` — alert + retry
4. `CurrencyInput` — number + currency select
5. `CurrencyDisplay` — amount + converted
6. `CountrySelect` — dropdown z flagami i kodami
7. `DatePicker` — shadcn Calendar + Popover
8. `ConfirmDialog` — AlertDialog wrapper
9. `PageHeader` — title + description + actions slot

Każdy z tych komponentów → dobrze nazwane propsy, TypeScript types, 1 plik = 1 komponent (+ ew. subkomponenty w tym samym pliku).

## Checklist UX przed każdym release

- [ ] Wszystkie strony testowane w mobile viewport (375px)
- [ ] Dark mode na wszystkich stronach
- [ ] Loading states (Skeleton) dla każdego query
- [ ] Empty states dla każdej listy
- [ ] Error states dla każdego query (z retry)
- [ ] Keyboard navigation — Tab przez wszystkie akcje
- [ ] Screen reader — label'e na ikonach-buttonach
- [ ] Toast dla każdego mutacyjnego sukcesu
- [ ] Form — inline error messages
- [ ] Brak layoutowych overflow'ów
- [ ] Brak hardcoded'owanych kolorów (wszystko przez tokeny)
- [ ] Brak hardcoded'owanych tekstów (wszystko przez i18n)
