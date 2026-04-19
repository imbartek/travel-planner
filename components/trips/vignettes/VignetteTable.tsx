/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useVignettes, useUpdateVignette, useDeleteVignette } from '@/lib/hooks/useVignettes'
import { VignetteRow } from './VignetteRow'
import { VignetteCard } from './VignetteCard'
import { VignetteForm } from './VignetteForm'

export function VignetteTable({ tripId }: { tripId: string }) {
  const { data: vignettes, isLoading } = useVignettes(tripId)
  const { mutate: updateVignette } = useUpdateVignette(tripId)
  const { mutate: deleteVignette } = useDeleteVignette(tripId)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)

  const handleCreateNew = () => {
    setEditItem(null)
    setIsFormOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
  }

  // Obliczenia (MVP: proste sumowanie w bazowej walucie po kursie 1:1, docelowo tu wejdzie useCurrencyRates)
  const totalByCurrency = (vignettes ?? []).reduce((acc: any, v: any) => {
    acc[v.currency] = (acc[v.currency] || 0) + v.cost
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Winiety i Opłaty Transportowe
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj opłatami za autostrady
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </div>

      <div className="hidden sm:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kraj</TableHead>
              <TableHead>Ważność</TableHead>
              <TableHead>Koszt</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(vignettes as any[])?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nie dodałeś jeszcze żadnych winiet.
                </TableCell>
              </TableRow>
            ) : (
              (vignettes as any[])?.map((v) => (
                <VignetteRow 
                  key={v.id} 
                  item={v} 
                  onUpdate={(id, updates) => updateVignette({ id, ...updates })}
                  onDelete={(id) => deleteVignette(id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="sm:hidden space-y-4">
        {(vignettes as any[])?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl bg-card">
            Nie dodałeś jeszcze żadnych winiet.
          </div>
        ) : (
          (vignettes as any[])?.map((v) => (
            <VignetteCard 
              key={v.id}
              item={v}
              onEdit={() => handleEdit(v)}
              onDelete={() => deleteVignette(v.id)}
            />
          ))
        )}
      </div>

      {vignettes && vignettes.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Podsumowanie opłat</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(totalByCurrency).map(([currency, total]) => (
                <div key={currency} className="bg-muted px-4 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground mr-2">{currency}</span>
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency }).format(total as number)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Przeliczenie na jedną preferowaną walutę zostanie dodane wkrótce.
            </p>
          </CardContent>
        </Card>
      )}

      <VignetteForm 
        tripId={tripId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editItem={editItem}
      />
    </div>
  )
}
