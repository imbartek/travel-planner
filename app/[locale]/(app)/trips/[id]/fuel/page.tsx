'use client'

import { use } from 'react'
import { FuelInputsCard } from '@/components/trips/fuel/FuelInputsCard'
import { PriceSegmentsCard } from '@/components/trips/fuel/PriceSegmentsCard'
import { FuelResultsCard } from '@/components/trips/fuel/FuelResultsCard'
import { useFuelCalculation, useFuelPriceSegments } from '@/lib/hooks/useFuel'
import { Skeleton } from '@/components/ui/skeleton'

export default function TripFuelPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  
  const { data: calculation, isLoading: isCalcLoading } = useFuelCalculation(id)
  const { data: segments, isLoading: isSegLoading } = useFuelPriceSegments(id)

  if (isCalcLoading || isSegLoading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <FuelInputsCard tripId={id} data={calculation} />
      
      <PriceSegmentsCard tripId={id} segments={segments || []} />
      
      <FuelResultsCard 
        tripId={id} 
        calculation={calculation} 
        segments={segments || []} 
      />
    </div>
  )
}
