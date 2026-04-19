/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart, Landmark, Fuel, CreditCard } from 'lucide-react'
import { useTripSummary } from '@/lib/hooks/useSummary'
import { Skeleton } from '@/components/ui/skeleton'

export function TripSummary({ tripId }: { tripId: string }) {
  const { data: summary, isLoading } = useTripSummary(tripId)

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-xl" />
  }

  if (!summary) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: summary.targetCurrency,
      maximumFractionDigits: 0
    }).format(val)
  }

  // Sort categories by cost
  const sortedCategories = Object.entries(summary.categoryTotals)
    .sort(([, a], [, b]) => b - a)

  const categoryLabels: Record<string, string> = {
    transport: 'Transport',
    accommodation: 'Noclegi',
    food: 'Wyżywienie',
    activities: 'Atrakcje',
    vignettes: 'Winiety',
    fuel: 'Paliwo',
    other: 'Inne',
  }

  return (
    <div className="space-y-6">
      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-primary text-primary-foreground border-none overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">Całkowity koszt wyprawy</p>
                <h2 className="text-4xl font-black">{formatCurrency(summary.totalCost)}</h2>
              </div>
              <PieChart className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Winiety</p>
                <p className="font-bold">{formatCurrency(summary.vignettesTotal)}</p>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Paliwo</p>
                <p className="font-bold">{formatCurrency(summary.fuelTotal)}</p>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Inne</p>
                <p className="font-bold">{formatCurrency(summary.expensesTotal)}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Waluta rozliczeń
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-lg">{summary.targetCurrency}</p>
                <p className="text-xs text-muted-foreground italic">Zdefiniowana w Twoim profilu</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              * Wszystkie koszty zostały przeliczone wg aktualnych kursów rynkowych względem Twojej waluty bazowej.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Struktura wydatków
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {sortedCategories.map(([cat, amount]) => {
              const percentage = (amount / summary.totalCost) * 100
              if (amount <= 0) return null

              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">
                      {categoryLabels[cat] || cat}
                    </span>
                    <span className="font-bold">{formatCurrency(amount)} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
