/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExpenses, useDeleteExpense } from '@/lib/hooks/useExpenses'
import { ExpenseForm } from './ExpenseForm'

const categoryColors: Record<string, string> = {
  transport: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  accommodation: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  food: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  activities: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
  vignettes: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20',
  fuel: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  other: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
}

const categoryNames: Record<string, string> = {
  transport: 'Transport',
  accommodation: 'Nocleg',
  food: 'Jedzenie',
  activities: 'Atrakcje',
  vignettes: 'Winiety',
  fuel: 'Paliwo',
  other: 'Inne',
}

export function ExpenseList({ tripId }: { tripId: string }) {
  const { data: expenses, isLoading } = useExpenses(tripId)
  const { mutate: deleteExpense } = useDeleteExpense(tripId)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)

  const handleEdit = (item: any) => {
    setEditItem(item)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setEditItem(null)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return <div className="h-40 bg-muted/50 animate-pulse rounded-xl" />
  }

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur }).format(val)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Wykaz wydatków
        </CardTitle>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj koszt
        </Button>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategoria</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Brak dodanych wydatków.
                  </TableCell>
                </TableRow>
              ) : (
                expenses?.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Badge className={categoryColors[e.category] || categoryColors.other} variant="secondary">
                        {categoryNames[e.category] || e.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{e.label}</TableCell>
                    <TableCell>{formatCurrency(Number(e.amount), e.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Usunąć ten wydatek?')) deleteExpense(e.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {expenses?.map((e: any) => (
            <div key={e.id} className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex justify-between items-start">
                <Badge className={categoryColors[e.category] || categoryColors.other} variant="secondary">
                  {categoryNames[e.category] || e.category}
                </Badge>
                <span className="font-bold">{formatCurrency(Number(e.amount), e.currency)}</span>
              </div>
              <p className="font-medium">{e.label}</p>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8" onClick={() => handleEdit(e)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edytuj
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm('Usunąć ten wydatek?')) deleteExpense(e.id)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {expenses?.length === 0 && (
             <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                Brak dodanych wydatków.
             </div>
          )}
        </div>
      </CardContent>

      <ExpenseForm
        tripId={tripId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editItem={editItem}
      />
    </Card>
  )
}
