/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useVignettes(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['vignettes', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vignettes')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at')
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useAddVignette(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['vignettes', tripId]

  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('vignettes')
        .insert({ ...input, trip_id: tripId } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as any[] | undefined
      
      const optimistic = { ...input, trip_id: tripId, id: `temp-${Date.now()}` }
      
      queryClient.setQueryData(key, [...(prev ?? []), optimistic])
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się dodać winiety')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useUpdateVignette(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['vignettes', tripId]

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('vignettes')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as any[] | undefined
      
      if (prev) {
        queryClient.setQueryData(key, prev.map(p => p.id === id ? { ...p, ...updates } : p))
      }
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się zapisać winiety')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useDeleteVignette(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['vignettes', tripId]

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vignettes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as any[] | undefined
      
      if (prev) {
        queryClient.setQueryData(key, prev.filter(p => p.id !== id))
      }
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się usunąć winiety')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
