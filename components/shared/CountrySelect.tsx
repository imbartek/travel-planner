'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const COUNTRIES = [
  { code: 'PL', name: 'Polska' },
  { code: 'DE', name: 'Niemcy' },
  { code: 'CZ', name: 'Czechy' },
  { code: 'SK', name: 'Słowacja' },
  { code: 'AT', name: 'Austria' },
  { code: 'HU', name: 'Węgry' },
  { code: 'SI', name: 'Słowenia' },
  { code: 'HR', name: 'Chorwacja' },
  { code: 'IT', name: 'Włochy' },
]

export function CountrySelect({
  value,
  onChange,
  placeholder = "Wybierz kraj"
}: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
