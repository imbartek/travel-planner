import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// UWAGA: używaj TYLKO w API routes (server), NIGDY w komponencie.
// Pomija RLS. Wymaga SUPABASE_SERVICE_ROLE_KEY w env.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
