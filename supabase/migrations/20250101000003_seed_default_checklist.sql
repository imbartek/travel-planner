-- =========================================
-- Default checklist (używana gdy user tworzy trip bez templatu)
-- =========================================
create table public.default_checklist_items (
  id uuid primary key default gen_random_uuid(),
  category_pl text not null,
  category_en text not null,
  item_pl text not null,
  item_en text not null,
  order_index int not null default 0
);

insert into public.default_checklist_items (category_pl, category_en, item_pl, item_en, order_index) values
  -- Dokumenty
  ('Dokumenty','Documents','Dowód osobisty / paszport','ID card / passport',1),
  ('Dokumenty','Documents','Prawo jazdy','Driver license',2),
  ('Dokumenty','Documents','Dowód rejestracyjny','Vehicle registration',3),
  ('Dokumenty','Documents','OC (zielona karta poza UE)','Insurance (green card outside EU)',4),
  ('Dokumenty','Documents','Polisa Assistance','Assistance policy',5),
  ('Dokumenty','Documents','Rezerwacje hoteli','Hotel bookings',6),
  ('Dokumenty','Documents','Karty płatnicze','Payment cards',7),
  ('Dokumenty','Documents','Gotówka (EUR)','Cash (EUR)',8),
  -- Samochód
  ('Samochód','Car','Trójkąt ostrzegawczy','Warning triangle',1),
  ('Samochód','Car','Kamizelka odblaskowa','Reflective vest',2),
  ('Samochód','Car','Apteczka','First aid kit',3),
  ('Samochód','Car','Gaśnica','Fire extinguisher',4),
  ('Samochód','Car','Koło zapasowe / zestaw naprawczy','Spare tire / repair kit',5),
  ('Samochód','Car','Linka holownicza','Tow rope',6),
  ('Samochód','Car','Sprawdzony olej i płyny','Oil and fluids checked',7),
  ('Samochód','Car','Sprawdzone opony i ciśnienie','Tires and pressure checked',8),
  ('Samochód','Car','Winiety','Vignettes',9),
  -- Elektronika
  ('Elektronika','Electronics','Telefon + ładowarka','Phone + charger',1),
  ('Elektronika','Electronics','Ładowarka samochodowa','Car charger',2),
  ('Elektronika','Electronics','Power bank','Power bank',3),
  ('Elektronika','Electronics','Nawigacja / GPS','Navigation / GPS',4),
  ('Elektronika','Electronics','Adapter gniazdka','Plug adapter',5),
  ('Elektronika','Electronics','Kable USB-C / Lightning','USB-C / Lightning cables',6),
  -- Ubrania i osobiste
  ('Ubrania','Clothing','Ubrania na pogodę','Weather-appropriate clothes',1),
  ('Ubrania','Clothing','Kurtka przeciwdeszczowa','Rain jacket',2),
  ('Ubrania','Clothing','Buty wygodne','Comfortable shoes',3),
  ('Ubrania','Clothing','Okulary przeciwsłoneczne','Sunglasses',4),
  ('Ubrania','Clothing','Kosmetyczka','Toiletry bag',5),
  ('Ubrania','Clothing','Ręcznik','Towel',6),
  ('Ubrania','Clothing','Strój kąpielowy','Swimsuit',7),
  -- Apteczka
  ('Apteczka','First aid','Plastry','Plasters',1),
  ('Apteczka','First aid','Środki przeciwbólowe','Painkillers',2),
  ('Apteczka','First aid','Leki na alergię','Allergy meds',3),
  ('Apteczka','First aid','Leki na żołądek','Stomach meds',4),
  ('Apteczka','First aid','Krem z filtrem','Sunscreen',5),
  ('Apteczka','First aid','Środek odstraszający owady','Insect repellent',6),
  ('Apteczka','First aid','Leki stałe','Regular medications',7),
  -- Na drogę
  ('Na drogę','On the road','Woda','Water',1),
  ('Na drogę','On the road','Przekąski','Snacks',2),
  ('Na drogę','On the road','Muzyka / podcasty offline','Music / podcasts offline',3),
  ('Na drogę','On the road','Poduszka podróżna','Travel pillow',4),
  ('Na drogę','On the road','Worki na śmieci','Trash bags',5),
  ('Na drogę','On the road','Chusteczki','Tissues',6);
