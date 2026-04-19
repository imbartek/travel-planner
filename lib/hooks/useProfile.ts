/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useProfile() {
  const supabase = createClient()
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Unauthenticated')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (updates: any) => {
      if (!user) throw new Error('Unauthenticated')
      const { error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })
}
