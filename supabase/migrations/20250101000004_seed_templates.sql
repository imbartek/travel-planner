-- =========================================
-- Templates (5 systemowych)
-- =========================================
insert into public.templates (slug, name_pl, name_en, description_pl, description_en, suggested_countries, is_system) values
  ('road-trip-europe',
   'Road trip po Europie',
   'European road trip',
   'Wielodniowa podróż przez kilka krajów Schengen. Zawiera sugestie winiet i rozbudowaną checklistę.',
   'Multi-day trip through several Schengen countries. Includes vignette suggestions and extensive checklist.',
   array['CZ','AT','SI','HU','SK'],
   true),
  ('city-break',
   'City break',
   'City break',
   'Krótka podróż 2-3 dniowa do jednego miasta. Lżejsza checklista.',
   'Short 2-3 day trip to a single city. Lighter checklist.',
   null,
   true),
  ('mountain-weekend',
   'Weekend w górach',
   'Mountain weekend',
   'Weekendowy wypad w góry z dodatkowymi pozycjami w checkliście (łańcuchy, ciepła odzież).',
   'Weekend mountain trip with additional checklist items (chains, warm clothing).',
   null,
   true),
  ('family-with-child',
   'Podróż z dzieckiem',
   'Family trip with child',
   'Rozbudowana checklista o pozycje dla rodzica z dzieckiem (foteliki, pampersy, zabawki).',
   'Extended checklist with items for parent and child (car seat, diapers, toys).',
   null,
   true),
  ('outside-eu',
   'Podróż poza UE',
   'Trip outside EU',
   'Paszport, zielona karta, dodatkowe ubezpieczenie — checklista dla wyjazdu poza Unię.',
   'Passport, green card, extra insurance — checklist for travel outside the EU.',
   null,
   true);

-- Dodaj template_vignettes dla road-trip-europe:
insert into public.template_vignettes (template_id, country, suggested_duration, order_index)
select id, 'AT', '10 dni', 1 from public.templates where slug = 'road-trip-europe'
union all select id, 'SK', '10 dni', 2 from public.templates where slug = 'road-trip-europe'
union all select id, 'SI', '7 dni', 3 from public.templates where slug = 'road-trip-europe'
union all select id, 'HU', '10 dni', 4 from public.templates where slug = 'road-trip-europe';
