/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useTranslations, useFormatter } from 'next-intl'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/lib/i18n/routing'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPin } from 'lucide-react'

export function TripCard({ trip }: { trip: any }) {
  const t = useTranslations('trips.card')
  const format = useFormatter()

  const isOwner = trip.members?.find((m: any) => m.role === 'owner')

  const formattedDate = trip.date_start 
    ? `${format.dateTime(new Date(trip.date_start), { dateStyle: 'short' })} ${trip.date_end ? `- ${format.dateTime(new Date(trip.date_end), { dateStyle: 'short' })}` : ''}`
    : t('noDate')
    
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full flex flex-col cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl line-clamp-1">{trip.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {isOwner ? 'Owner' : 'Editor'}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {trip.country_from && trip.country_to 
              ? t('countries', { from: trip.country_from, to: trip.country_to })
              : 'Trasa nieokreślona'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 text-sm text-muted-foreground pb-2">
          {formattedDate}
        </CardContent>
        <CardFooter className="pt-2 border-t mt-auto flex justify-between items-center">
          <div className="flex -space-x-2">
            {trip.members?.slice(0, 3).map((m: any) => (
              <Avatar key={m.user_id} className="w-6 h-6 border-2 border-background">
                <AvatarFallback className="text-[10px]">{m.profiles?.display_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            ))}
            {trip.members?.length > 3 && (
               <Avatar className="w-6 h-6 border-2 border-background">
                <AvatarFallback className="text-[10px]">+{trip.members.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
          {trip.checklist_stats?.[0] && (
            <div className="text-xs text-muted-foreground font-medium">
              Checklist: {trip.checklist_stats[0].count}
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
