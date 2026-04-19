/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useWaypoints(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['waypoints', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waypoints')
        .select('*')
        .eq('trip_id', tripId)
        .order('order_index')
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useAddWaypoint(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['waypoints', tripId]

  return useMutation({
    mutationFn: async (input: any) => {
      // Pobierz aktualne waypoints żeby ustalić order_index
      const { data: current } = await supabase
        .from('waypoints')
        .select('order_index')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: false })
        .limit(1)
      
      const newIndex = (current as any)?.[0]?.order_index !== undefined ? (current as any)[0].order_index + 1 : 0

      const { data, error } = await supabase
        .from('waypoints')
        .insert({ ...input, trip_id: tripId, order_index: newIndex } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as any[] | undefined
      
      const newIndex = prev?.length ? Math.max(...prev.map(p => p.order_index ?? 0)) + 1 : 0
      const optimistic = { ...input, trip_id: tripId, id: `temp-${Date.now()}`, order_index: newIndex }
      
      queryClient.setQueryData(key, [...(prev ?? []), optimistic])
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się dodać punktu tras')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useUpdateWaypoint(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['waypoints', tripId]

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('waypoints')
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
      toast.error('Nie udało się zapisać punktu')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useDeleteWaypoint(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['waypoints', tripId]

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waypoints')
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
      toast.error('Nie udało się usunąć punktu')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useReorderWaypoints(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['waypoints', tripId]

  return useMutation({
    mutationFn: async (newOrder: any[]) => {
      const updates = newOrder.map((w, i) => ({ id: w.id, order_index: i, trip_id: tripId }))
      
      const { error } = await supabase
        .from('waypoints')
        .upsert(updates as never, { onConflict: 'id' })

      if (error) throw error
      return updates
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key) as any[] | undefined
      
      // Optymistycznie zapisujemy nową kolejność z zaktualizowanymi order_index
      const optimistic = newOrder.map((w, i) => ({ ...w, order_index: i }))
      queryClient.setQueryData(key, optimistic)
      
      return { prev }
    },
    onError: (_err, _input, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
      toast.error('Nie udało się zapisać kolejności')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
