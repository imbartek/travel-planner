/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { COUNTRIES } from '@/components/shared/CountrySelect'

interface VignetteCardProps {
  item: any
  onEdit: () => void
  onDelete: () => void
}

export function VignetteCard({ item, onEdit, onDelete }: VignetteCardProps) {
  const countryName = COUNTRIES.find((c) => c.code === item.country)?.name || item.country
  
  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur }).format(val)
  }

  return (
    <Card className="sm:hidden">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-lg">{countryName}</h4>
            <p className="text-sm text-muted-foreground">{item.duration || 'Brak okresu'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-primary">{formatCurrency(item.cost, item.currency)}</p>
          </div>
        </div>
        
        {item.note && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            "{item.note}"
          </p>
        )}
        
        {item.purchase_url && (
          <div className="mt-4">
            <a 
              href={item.purchase_url} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Link do zakupu
              <ExternalLink className="ml-1 w-3 h-3" />
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Edytuj
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            if (window.confirm('Usunąć winietę?')) {
              onDelete()
            }
          }} 
          className="text-destructive font-medium border-destructive/20 hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  )
}
