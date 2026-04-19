/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useFuelCalculation(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['fuel_calculation', tripId],
    queryFn: async () => {
      // 1. Sprawdź czy jest rekord kalkulacji
      const { data, error } = await supabase
        .from('fuel_calculations')
        .select('*')
        .eq('trip_id', tripId)
        .maybeSingle()
      
      if (error) throw error
      
      // 2. Jeśli nie ma, stwórz domyślny
      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from('fuel_calculations')
          .insert({ trip_id: tripId } as never)
          .select()
          .single()
        
        if (createError) throw createError
        return newData
      }
      
      return data
    },
    enabled: !!tripId,
  })
}

export function useUpdateFuelCalculation(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['fuel_calculation', tripId]

  return useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('fuel_calculations')
        .update(updates as never)
        .eq('trip_id', tripId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => ({ ...old, ...updates }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Błąd podczas zapisu ustawień paliwa')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    }
  })
}

export function useFuelPriceSegments(tripId: string) {
  const supabase = createClient()
  
  // Najpierw pobierz id kalkulacji
  const { data: calculation } = useFuelCalculation(tripId)
  
  return useQuery({
    queryKey: ['fuel_segments', (calculation as any)?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_price_segments')
        .select('*')
        .eq('fuel_calculation_id', (calculation as any)!.id)
        .order('order_index')
      
      if (error) throw error
      
      // Jeśli brak segmentów, stwórz domyślny
      if (data?.length === 0) {
        const { data: trip } = await supabase.from('trips').select('country_to').eq('id', tripId).single()
        const { data: newSegment, error: segError } = await supabase
          .from('fuel_price_segments')
          .insert({
            fuel_calculation_id: (calculation as any)!.id,
            country: (trip as any)?.country_to || 'PL',
            price_per_liter: 6.50,
            currency: 'PLN',
            order_index: 0
          } as never)
          .select()
        
        if (segError) throw segError
        return newSegment
      }
      
      return data ?? []
    },
    enabled: !!(calculation as any)?.id,
  })
}

export function useFuelSegmentsMutations(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: calculation } = useFuelCalculation(tripId)
  const key = ['fuel_segments', (calculation as any)?.id]

  const addSegment = useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('fuel_price_segments')
        .insert({ ...input, fuel_calculation_id: (calculation as any)!.id } as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })

  const updateSegment = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('fuel_price_segments')
        .update(updates as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_price_segments')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })

  return { addSegment, updateSegment, deleteSegment }
}

export function useCurrencyRates() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['currency_rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
      
      if (error) throw error
      
      // Zwróć jako mapę: { PLN: 4.3, USD: 1.08, ... }
      return data.reduce((acc: Record<string, number>, r: any) => {
        acc[r.code] = Number(r.rate_to_eur)
        return acc
      }, {})
    }
  })
}
