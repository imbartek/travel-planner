/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calculator, Zap, Fuel, Coins, Map } from 'lucide-react'
import { calculateFuel } from '@/lib/utils/fuel'
import { useCurrencyRates } from '@/lib/hooks/useFuel'
import { useProfile } from '@/lib/hooks/useProfile'

export function FuelResultsCard({ tripId, calculation, segments }: { tripId: string, calculation: any, segments: any[] }) {
  const { data: rates } = useCurrencyRates()
  const { data: profile } = useProfile()
  
  const targetCurrency = (profile as any)?.preferred_currency || 'EUR'

  const results = useMemo(() => {
    if (!calculation || !segments || !rates) return null

    return calculateFuel(
      Number(calculation.consumption),
      Number(calculation.total_distance),
      Number(calculation.tank_size),
      calculation.start_with_full_tank,
      segments,
      rates,
      targetCurrency
    )
  }, [calculation, segments, rates, targetCurrency])

  if (!results) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-12 text-center text-muted-foreground">
          Wprowadź dane, aby zobaczyć kalkulację.
        </CardContent>
      </Card>
    )
  }

  const formatValue = (val: number, cur: string) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: cur }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Fuel className="w-5 h-5 text-primary mb-2" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Paliwo</span>
            <span className="text-xl font-bold">{results.totalLitersNeeded.toFixed(1)} L</span>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Zap className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Tankowanie</span>
            <span className="text-xl font-bold">{results.litersToRefuel.toFixed(1)} L</span>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Coins className="w-5 h-5 text-green-500 mb-2" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Koszt</span>
            <span className="text-xl font-bold">{formatValue(results.totalCostInTarget, targetCurrency)}</span>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Map className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Dystans</span>
            <span className="text-xl font-bold">{calculation.total_distance} km</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Rozbicie per kraj
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kraj</TableHead>
                <TableHead>Litrów</TableHead>
                <TableHead>Koszt (lokalnie)</TableHead>
                <TableHead className="text-right">Koszt ({targetCurrency})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.breakdown.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{b.country}</TableCell>
                  <TableCell>{b.liters.toFixed(1)} L</TableCell>
                  <TableCell>{formatValue(b.localCost, b.currency)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatValue(b.costInTarget, targetCurrency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
