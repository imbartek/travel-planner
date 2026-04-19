/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Przelicza koszt waluty na inną (placeholder na razie lub proste przeliczenie)
 */
function convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount
  // Baza to EUR (rates[code] = rate_to_eur)
  const rateFrom = rates[from] || 1
  const rateTo = rates[to] || 1
  
  // amount (from) -> amountInEur -> amount (to)
  // formula: (amount / rateFrom) * rateTo
  // ALE w bazie mamy rate_to_eur (np PLN: 4.30), więc 1 EUR = 4.30 PLN
  // Więc: amountInEur = amount / rateFrom
  // amountTo = amountInEur * rateTo
  
  return (amount / rateFrom) * rateTo
}

export function calculateFuel(
  consumption: number,   // l/100km
  totalDistance: number, // km
  tankSize: number,      // l
  startWithFullTank: boolean,
  segments: Array<{ country: string; price_per_liter: number; currency: string }>,
  rates: Record<string, number>,
  targetCurrency: string = 'EUR'
) {
  const totalLitersNeeded = (consumption / 100) * totalDistance
  const reserveLiters = startWithFullTank ? tankSize : 0
  
  // Ile litrów musimy dokupić na trasie
  const litersToRefuel = Math.max(0, totalLitersNeeded - reserveLiters)

  // Uproszczony podział (MVP): dystans/litry dzielone równo na wszystkie segmenty
  const litersPerSegment = totalLitersNeeded / (segments.length || 1)

  const breakdown = segments.map((s) => {
    const liters = litersPerSegment
    const localCost = liters * (s.price_per_liter || 0)
    const costInTarget = convert(localCost, s.currency || 'EUR', targetCurrency, rates)
    
    return {
      country: s.country,
      liters,
      localCost,
      currency: s.currency,
      costInTarget
    }
  })

  const totalCostInTarget = breakdown.reduce((sum, b) => sum + b.costInTarget, 0)

  return {
    totalLitersNeeded,
    litersToRefuel,
    reserveLiters,
    breakdown,
    totalCostInTarget,
    targetCurrency
  }
}
