import { SupabaseClient } from '@supabase/supabase-js'

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
