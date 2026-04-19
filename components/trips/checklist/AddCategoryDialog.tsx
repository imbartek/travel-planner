/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddChecklistItem } from '@/lib/hooks/useChecklist'

interface AddCategoryDialogProps {
  tripId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCategoryDialog({ tripId, open, onOpenChange }: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('')
  const [firstItem, setFirstItem] = useState('')
  const { mutate: addItem, isPending } = useAddChecklistItem(tripId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (categoryName.trim() && firstItem.trim()) {
      addItem({ category: categoryName, item: firstItem, is_done: false }, {
        onSuccess: () => {
          onOpenChange(false)
          setCategoryName('')
          setFirstItem('')
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj nową kategorię</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Nazwa kategorii</Label>
            <Input 
              id="category" 
              placeholder="np. Ubrania, Dokumenty" 
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="first-item">Pierwsza pozycja</Label>
            <Input 
              id="first-item" 
              placeholder="np. Majtki, Paszport" 
              value={firstItem}
              onChange={(e) => setFirstItem(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending || !categoryName.trim() || !firstItem.trim()}>
              {isPending ? 'Dodawanie...' : 'Dodaj kategorię'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
