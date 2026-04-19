/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Fuel } from 'lucide-react'
import { useUpdateFuelCalculation } from '@/lib/hooks/useFuel'
import { useDebounce } from '@/lib/hooks/useDebounce'

export function FuelInputsCard({ tripId, data }: { tripId: string, data: any }) {
  const { mutate: updateFuel } = useUpdateFuelCalculation(tripId)
  
  const [model, setModel] = useState(data?.car_model || '')
  const [consumption, setConsumption] = useState(data?.consumption ? Number(data.consumption) : 7.5)
  const [tankSize, setTankSize] = useState(data?.tank_size ? Number(data.tank_size) : 55)
  const [distance, setDistance] = useState(data?.total_distance ? Number(data.total_distance) : 1000)
  const [fullTank, setFullTank] = useState(data?.start_with_full_tank ?? true)

  const debouncedModel = useDebounce(model, 1000)
  const debouncedConsumption = useDebounce(consumption, 500)
  const debouncedTankSize = useDebounce(tankSize, 500)
  const debouncedDistance = useDebounce(distance, 500)

  useEffect(() => {
    if (debouncedModel !== (data?.car_model || '')) {
      updateFuel({ car_model: debouncedModel })
    }
  }, [debouncedModel])

  useEffect(() => {
    if (debouncedConsumption !== (data?.consumption ? Number(data.consumption) : 7.5)) {
      updateFuel({ consumption: debouncedConsumption })
    }
  }, [debouncedConsumption])

  useEffect(() => {
    if (debouncedTankSize !== (data?.tank_size ? Number(data.tank_size) : 55)) {
      updateFuel({ tank_size: debouncedTankSize })
    }
  }, [debouncedTankSize])

  useEffect(() => {
    if (debouncedDistance !== (data?.total_distance ? Number(data.total_distance) : 1000)) {
      updateFuel({ total_distance: debouncedDistance })
    }
  }, [debouncedDistance])

  const handleFullTankChange = (checked: boolean) => {
    setFullTank(checked)
    updateFuel({ start_with_full_tank: checked })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fuel className="w-5 h-5 text-primary" />
          Parametry pojazdu i trasy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">Model samochodu (opcjonalnie)</Label>
            <Input 
              id="model" 
              placeholder="np. Volvo V60" 
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distance">Całkowity dystans (km)</Label>
            <Input 
              id="distance" 
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Średnie spalanie (l/100km)</Label>
              <span className="font-bold text-primary">{consumption} l</span>
            </div>
            <Slider 
              min={3} 
              max={15} 
              step={0.1} 
              value={[consumption]} 
              onValueChange={(val) => {
                if (val[0] !== undefined) setConsumption(val[0])
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Pojemność baku (l)</Label>
              <span className="font-bold text-primary">{tankSize} l</span>
            </div>
            <Slider 
              min={20} 
              max={120} 
              step={1} 
              value={[tankSize]} 
              onValueChange={(val) => {
                if (val[0] !== undefined) setTankSize(val[0])
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="full-tank" 
            checked={fullTank}
            onCheckedChange={handleFullTankChange}
          />
          <Label 
            htmlFor="full-tank"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Startuję z pełnym bakiem
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
