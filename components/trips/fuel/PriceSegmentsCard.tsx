/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Plus, Trash2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CountrySelect } from '@/components/shared/CountrySelect'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { useFuelSegmentsMutations } from '@/lib/hooks/useFuel'

export function PriceSegmentsCard({ tripId, segments }: { tripId: string, segments: any[] }) {
  const { addSegment, updateSegment, deleteSegment } = useFuelSegmentsMutations(tripId)

  const handleAdd = () => {
    const lastSegment = segments[segments.length - 1]
    addSegment.mutate({
      country: lastSegment?.country || 'PL',
      price_per_liter: lastSegment?.price_per_liter || 6.50,
      currency: lastSegment?.currency || 'PLN',
      order_index: segments.length
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Ceny paliw per kraj
        </CardTitle>
        <Button size="sm" onClick={handleAdd} disabled={addSegment.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj kraj
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {segments.map((segment, index) => (
          <div key={segment.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-muted/30 p-3 rounded-lg border">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Kraj</label>
              <CountrySelect 
                value={segment.country} 
                onChange={(val) => updateSegment.mutate({ id: segment.id, country: val })} 
              />
            </div>
            <div className="flex-[1.5] w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Cena za litr</label>
              <CurrencyInput
                value={Number(segment.price_per_liter)}
                currency={segment.currency}
                onChange={(val) => updateSegment.mutate({ id: segment.id, price_per_liter: val })}
                onCurrencyChange={(val) => updateSegment.mutate({ id: segment.id, currency: val })}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteSegment.mutate(segment.id)}
              disabled={segments.length <= 1 || deleteSegment.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <p className="text-xs text-muted-foreground pt-2 italic">
          * Podział paliwa jest uproszczony (proporcjonalny do liczby krajów). 
          Pierwszy kraj na liście to zazwyczaj miejsce startu lub pierwsze tankowanie.
        </p>
      </CardContent>
    </Card>
  )
}
