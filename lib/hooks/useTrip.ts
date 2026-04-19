/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { copyTemplateChecklistToTrip, copyTemplateVignettesToTrip } from '@/lib/utils/template'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

export function useTrip(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          members:trip_members(user_id, role, profiles(display_name, email)),
          checklist_stats:checklist_items(count)
        `)
        .eq('id', tripId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!tripId,
  })
}

export function useCreateTrip() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const locale = useLocale()
  const router = useRouter()

  return useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthenticated')

      // 1. Insert trip
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({ 
          title: values.title,
          country_from: values.country_from,
          country_to: values.country_to,
          date_start: values.date_start,
          date_end: values.date_end,
          notes: values.notes,
          template_id: values.template_id || null,
          owner_id: user.id 
        } as never)
        .select()
        .single()
        
      if (error) throw error

      const tripId = (trip as any).id;

      // 2. Seed checklist
      if (values.template_id) {
        await copyTemplateChecklistToTrip(supabase, values.template_id, tripId, locale as 'pl' | 'en')
        await copyTemplateVignettesToTrip(supabase, values.template_id, tripId)
      } else {
        await (supabase.rpc as any)('seed_default_checklist', { p_trip_id: tripId, p_locale: locale })
      }

      return trip
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      router.push(`/${locale}/trips/${(trip as any).id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useUpdateTrip(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('trips')
        .update(updates as never)
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
      if (ctx?.prev) {
        queryClient.setQueryData(['trip', tripId], ctx.prev)
      }
      toast.error('Nie udało się zapisać')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteTrip() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const locale = useLocale()
  const router = useRouter()

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
      if (error) throw error
      return tripId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Podróż została usunięta')
      router.push(`/${locale}/trips`)
    },
    onError: () => {
      toast.error('Wystąpił błąd podczas usuwania podróży')
    }
  })
}
