# 00 — Overview

## Cel aplikacji

**Travel Planner** to PWA do planowania podróży samochodowych po Europie. Umożliwia:

- Tworzenie wielu podróży z bogatymi metadanymi
- Planowanie trasy (tekstowe waypointy z drag & drop)
- Zarządzanie winietami i opłatami drogowymi per kraj
- Kalkulator zużycia paliwa z segmentami cenowymi per kraj
- Checklistę rzeczy do zabrania (z domyślnym zestawem)
- Ręczne pozycje kosztowe + podsumowanie budżetu
- Współdzielenie podróży z innymi użytkownikami (np. partner)
- Zaproszenia przez email
- Notyfikacje email przed wyjazdem
- Templates podróży (Road trip, City break, Weekend w górach, Podróż z dzieckiem, Poza UE)
- Import/Export JSON

Aplikacja ma być używana głównie jako PWA na telefonie, ale z pełną funkcjonalnością na desktopie.

## Scope MVP

**Jest w MVP:**
- Wszystkie powyższe feature'y
- Auth email/password
- Dark mode
- PL/EN
- Przeliczanie walut przez frankfurter.app
- Collaborative trips (owner + editor)

**Nie jest w MVP (na później):**
- Prawdziwa mapa z trasą (Google Maps/Leaflet)
- Web push notifications (tylko email)
- Integracja z nawigacją
- OAuth (Google, Apple)
- Mobile native apps

## Kluczowe zasady produktowe

1. **Mobile-first** — wszystko musi działać na telefonie (testuj najpierw mobile viewport)
2. **Autosave wszędzie** — user nigdy nie klika „Zapisz", zmiany lecą w locie (debounce 500ms)
3. **Optimistic UI** — mutacje pokazują efekt natychmiast, rollback przy błędzie
4. **Offline-friendly** — odczyt podróży działa offline (cache SW), zapisy wymagają online
5. **Waluty zawsze explicit** — każda kwota ma walutę, UI pokazuje oryginał + preferowaną walutę usera

## Kluczowe zasady techniczne

1. **TypeScript strict** — żadnych `any`, pełna typizacja
2. **RLS jako główna linia obrony** — klient pisze bezpośrednio do Supabase, RLS pilnuje uprawnień
3. **Żadnych sekretów w kliencie** — service_role_key tylko w Edge Functions / API routes
4. **Wszystkie timestampy z timezone** — `timestamptz` w Postgres, `toLocaleString()` w UI
5. **Walidacja po obu stronach** — zod na kliencie, CHECK constraints + RLS na DB
6. **Emaile tylko z serwera** — przez API route z Nodemailer, nigdy z klienta

## Role użytkowników w podróży

- **Owner** — twórca podróży. Może wszystko: edytować dane, zapraszać/usuwać członków, usuwać podróż.
- **Editor** — zaproszony użytkownik. Może edytować wszystkie dane podróży (waypointy, winiety, paliwo, checklist, expenses). **Nie może** zarządzać członkami ani usuwać podróży.

Nie ma roli „viewer" na MVP — jeśli kogoś zapraszasz, zakładamy że ma współtworzyć.
