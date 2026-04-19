import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  preferred_language: string
  preferred_currency: string
  email_notifications_enabled: boolean
  reminder_days_before: number
  created_at: string
  updated_at: string
}

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
      return data as unknown as Profile
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
