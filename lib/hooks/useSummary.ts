/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useVignettes } from './useVignettes'
import { useFuelCalculation, useFuelPriceSegments, useCurrencyRates } from './useFuel'
import { useExpenses } from './useExpenses'
import { useProfile } from './useProfile'
import { convert, calculateFuel } from '@/lib/utils/fuel'

export function useTripSummary(tripId: string) {
  const { data: vignettes, isLoading: vLoading } = useVignettes(tripId)
  const { data: fuelCalc, isLoading: fCalcLoading } = useFuelCalculation(tripId)
  const { data: fuelSegments, isLoading: fSegLoading } = useFuelPriceSegments(tripId)
  const { data: manualExpenses, isLoading: eLoading } = useExpenses(tripId)
  const { data: rates, isLoading: rLoading } = useCurrencyRates()
  const { data: profile, isLoading: pLoading } = useProfile()

  const isLoading = vLoading || fCalcLoading || fSegLoading || eLoading || rLoading || pLoading
  const targetCurrency = (profile as any)?.preferred_currency || 'EUR'

  const summary = useMemo(() => {
    if (isLoading || !rates) return null

    // 1. Vignettes Total
    const vignettesTotal = (vignettes ?? []).reduce((sum, v: any) => {
      return sum + convert(v.cost, v.currency, targetCurrency, rates)
    }, 0)

    // 2. Fuel Total
    const fuelResults = calculateFuel(
      Number((fuelCalc as any)?.consumption || 7.5),
      Number((fuelCalc as any)?.total_distance || 0),
      Number((fuelCalc as any)?.tank_size || 55),
      (fuelCalc as any)?.start_with_full_tank ?? true,
      fuelSegments ?? [],
      rates,
      targetCurrency
    )
    const fuelTotal = fuelResults.totalCostInTarget

    // 3. Manual Expenses (excluding fuel/vignette to avoid double counting if user uses tools)
    // ALE: Jeśli user dodał manualnie vignettes/fuel, to one też powinny być wliczone?
    // Decyzja z planu: Summary liczy Vignettes Table + Fuel Table + Expenses Table (where category not fuel/vignette)
    const otherExpenses = (manualExpenses ?? []).filter((e: any) => 
      e.category !== 'fuel' && e.category !== 'vignettes'
    )
    
    // Agregacja po kategoriach dla wykresu/listy
    const categoryTotals: Record<string, number> = {
      vignettes: vignettesTotal,
      fuel: fuelTotal,
    }

    otherExpenses.forEach((e: any) => {
      const cost = convert(Number(e.amount), e.currency, targetCurrency, rates)
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + cost
    })

    const totalCost = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

    return {
      totalCost,
      targetCurrency,
      categoryTotals,
      vignettesTotal,
      fuelTotal,
      expensesTotal: totalCost - vignettesTotal - fuelTotal,
    }
  }, [isLoading, vignettes, fuelCalc, fuelSegments, manualExpenses, rates, targetCurrency])

  return { data: summary, isLoading }
}
