/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Plus, ListChecks } from 'lucide-react'
import { useChecklist } from '@/lib/hooks/useChecklist'
import { ChecklistCategory } from './ChecklistCategory'
import { AddCategoryDialog } from './AddCategoryDialog'
import { Skeleton } from '@/components/ui/skeleton'

export function ChecklistView({ tripId }: { tripId: string }) {
  const { data: items, isLoading } = useChecklist(tripId)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const stats = useMemo(() => {
    if (!items) return { total: 0, done: 0, byCategory: {} }
    
    const total = items.length
    const done = items.filter((i: any) => i.is_done).length
    
    const byCategory = items.reduce((acc: any, i: any) => {
      if (!acc[i.category]) {
        acc[i.category] = []
      }
      acc[i.category].push(i)
      return acc
    }, {} as Record<string, any[]>)
    
    return { total, done, byCategory }
  }, [items])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const globalProgress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0
  const categories = Object.keys(stats.byCategory)

  return (
    <div className="space-y-6 pb-12">
      {/* Global Progress Card */}
      <Card className="bg-primary/5 border-primary/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ListChecks className="w-6 h-6 text-primary" />
                Stan przygotowań
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats.done} z {stats.total} rzeczy spakowane
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-primary tabular-nums">
                {Math.round(globalProgress)}%
              </span>
            </div>
          </div>
          <Progress value={globalProgress} className="h-3 bg-primary/10" />
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-2">
        <Accordion type="multiple" defaultValue={categories} className="w-full">
          {categories.map((category) => (
            <ChecklistCategory 
              key={category}
              tripId={tripId}
              category={category}
              items={stats.byCategory[category]}
            />
          ))}
        </Accordion>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">Twoja lista jest pusta.</p>
          <Button onClick={() => setIsDialogOpen(true)}>Stwórz pierwszą kategorię</Button>
        </div>
      )}

      {categories.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full border-dashed py-8 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all rounded-xl"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Dodaj nową kategorię
        </Button>
      )}

      <AddCategoryDialog 
        tripId={tripId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
