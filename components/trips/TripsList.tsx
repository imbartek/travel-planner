/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useTrips } from '@/lib/hooks/useTrips'
import { TripCard } from './TripCard'
import { useTranslations } from 'next-intl'
import { Map, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/routing'

export function TripsList() {
  const { data: trips, isLoading } = useTrips()
  const t = useTranslations('trips')

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />)}
    </div>
  }

  if (!trips?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed py-12">
        <Map className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t('empty.title')}</h2>
        <p className="mb-6 mt-2 text-muted-foreground">{t('empty.description')}</p>
        <Link href="/trips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('empty.action')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {trips.map((trip: any) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  )
}
