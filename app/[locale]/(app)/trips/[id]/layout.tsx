/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripHeader } from '@/components/trips/TripHeader'
import { TripTabs } from '@/components/trips/TripTabs'

export default async function TripLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      members:trip_members(role)
    `)
    .eq('id', id)
    .single()

  if (error || !trip || !(trip as any).members?.length) {
    notFound()
  }

  // Hydration boundary could be used here but since components fetch via useTrip as well,
  // we just render headers using SSR data directly or pass trip.
  
  return (
    <div className="max-w-5xl mx-auto">
      <TripHeader trip={trip} />
      <TripTabs tripId={id} />
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
