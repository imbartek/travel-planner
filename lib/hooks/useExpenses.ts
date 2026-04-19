/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useExpenses(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useAddExpense(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['expenses', tripId]

  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...input, trip_id: tripId } as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: ['trip_summary', tripId] })
      toast.success('Wydatek dodany')
    }
  })
}

export function useUpdateExpense(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['expenses', tripId]

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: ['trip_summary', tripId] })
      toast.success('Wydatek zaktualizowany')
    }
  })
}

export function useDeleteExpense(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['expenses', tripId]

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: ['trip_summary', tripId] })
      toast.success('Wydatek usunięty')
    }
  })
}
