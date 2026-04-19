'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  currency: string
  onChange: (value: number) => void
  onCurrencyChange: (currency: string) => void
  currencies?: string[]
}

const COMMON_CURRENCIES = ['EUR', 'PLN', 'CZK', 'HUF', 'CHF', 'RON', 'BGN']

export function CurrencyInput({
  value,
  currency,
  onChange,
  onCurrencyChange,
  currencies = COMMON_CURRENCIES,
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={0}
        step="0.01"
        className="flex-1"
        {...props}
      />
      <Select value={currency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="w-[90px] shrink-0">
          <SelectValue placeholder="Waluta" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
