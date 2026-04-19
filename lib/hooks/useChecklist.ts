/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useChecklist(tripId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['checklist', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('category')
        .order('order_index')
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!tripId,
  })
}

export function useAddChecklistItem(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['checklist', tripId]

  return useMutation({
    mutationFn: async (input: any) => {
      // Find max order_index in category
      const { data: current } = await supabase
        .from('checklist_items')
        .select('order_index')
        .eq('trip_id', tripId)
        .eq('category', input.category)
        .order('order_index', { ascending: false })
        .limit(1)
      
      const nextIndex = (current as any) && (current as any)[0] ? (current as any)[0].order_index + 1 : 0

      const { data, error } = await supabase
        .from('checklist_items')
        .insert({ ...input, trip_id: tripId, order_index: nextIndex } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
    }
  })
}

export function useUpdateChecklistItem(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['checklist', tripId]

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any[]) => 
        old.map(item => item.id === id ? { ...item, ...updates } : item)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    }
  })
}

export function useDeleteChecklistItem(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['checklist', tripId]

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any[]) => old.filter(item => item.id !== id))
      return { prev }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    }
  })
}

export function useReorderChecklistItems(tripId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const key = ['checklist', tripId]

  return useMutation({
    mutationFn: async (updates: any[]) => {
      const { error } = await supabase
        .from('checklist_items')
        .upsert(updates as never, { onConflict: 'id' })
      if (error) throw error
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any[]) => {
        const result = [...old]
        updates.forEach(u => {
          const idx = result.findIndex(i => i.id === u.id)
          if (idx !== -1) result[idx] = { ...result[idx], ...u }
        })
        return result
      })
      return { prev }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    }
  })
}
