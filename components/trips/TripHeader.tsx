/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslations, useFormatter } from 'next-intl'

import { useUpdateTrip } from '@/lib/hooks/useTrip'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export function TripHeader({ trip }: { trip: any }) {
  const t = useTranslations('trips.card')
  const formatter = useFormatter()
  const { mutate: updateTrip } = useUpdateTrip(trip.id)
  
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(trip.title)

  const isOwner = trip.members?.find((m: any) => m.role === 'owner')
  
  const formattedDate = trip.date_start 
    ? `${formatter.dateTime(new Date(trip.date_start), { dateStyle: 'short' })} ${trip.date_end ? `- ${formatter.dateTime(new Date(trip.date_end), { dateStyle: 'short' })}` : ''}`
    : t('noDate')

  const handleSave = () => {
    setIsEditing(false)
    if (title.trim() && title !== trip.title) {
      updateTrip({ title: title.trim() })
    } else {
      setTitle(trip.title)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setTitle(trip.title)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          {isEditing ? (
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-2xl font-bold h-10 w-full max-w-sm"
            />
          ) : (
            <h1 
              className="text-3xl font-bold tracking-tight truncate cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => setIsEditing(true)}
              title="Kliknij aby edytować"
            >
              {trip.title}
            </h1>
          )}
          <Badge variant={isOwner ? 'default' : 'secondary'} className="hidden sm:inline-flex shrink-0">
            {isOwner ? 'Właściciel' : 'Edytor'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {trip.country_from && trip.country_to 
              ? t('countries', { from: trip.country_from, to: trip.country_to })
              : 'Trasa nieokreślona'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/50">•</span>
            {formattedDate}
          </div>
          <Badge variant={isOwner ? 'default' : 'secondary'} className="sm:hidden mt-2 shrink-0">
            {isOwner ? 'Właściciel' : 'Edytor'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
