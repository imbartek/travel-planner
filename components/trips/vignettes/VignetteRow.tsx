/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { ExternalLink, Check, X, Pencil, Trash2 } from 'lucide-react'

import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { COUNTRIES, CountrySelect } from '@/components/shared/CountrySelect'

interface VignetteRowProps {
  item: any
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

export function VignetteRow({ item, onUpdate, onDelete }: VignetteRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  const handleSave = () => {
    onUpdate(item.id, draft)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setDraft(item)
    setIsEditing(false)
  }

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur }).format(val)
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <CountrySelect 
            value={draft.country} 
            onChange={(val) => setDraft({ ...draft, country: val })} 
          />
        </TableCell>
        <TableCell>
          <Input 
            value={draft.duration || ''} 
            onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
            placeholder="10 dni"
          />
        </TableCell>
        <TableCell colSpan={2}>
          <CurrencyInput
            value={draft.cost}
            currency={draft.currency}
            onChange={(val) => setDraft({ ...draft, cost: val })}
            onCurrencyChange={(val) => setDraft({ ...draft, currency: val })}
          />
        </TableCell>
        <TableCell>
          <Input 
            value={draft.purchase_url || ''} 
            onChange={(e) => setDraft({ ...draft, purchase_url: e.target.value })}
            placeholder="https://..."
          />
        </TableCell>
        <TableCell>
          <Input 
            value={draft.note || ''} 
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Notatka"
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={cancelEdit}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const countryName = COUNTRIES.find((c) => c.code === item.country)?.name || item.country

  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{countryName}</span>
          {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
        </div>
      </TableCell>
      <TableCell>{item.duration || 'Brak'}</TableCell>
      <TableCell className="font-semibold">{formatCurrency(item.cost, item.currency)}</TableCell>
      <TableCell>
        {item.purchase_url ? (
          <a href={item.purchase_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
            Kup
            <ExternalLink className="ml-1 w-3 h-3" />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">Brak linku</span>
        )}
      </TableCell>
      <TableCell className="text-right hidden sm:table-cell">
        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            if(confirm('Usunąć winietę?')) onDelete(item.id)
          }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
