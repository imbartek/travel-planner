// lib/hooks/useTrips.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useTrips() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          members:trip_members(user_id, role, profiles(display_name, email))
        `)
        .order('date_start', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}
