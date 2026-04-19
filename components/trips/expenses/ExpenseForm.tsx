/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { useAddExpense, useUpdateExpense } from '@/lib/hooks/useExpenses'

const expenseSchema = z.object({
  category: z.enum(['transport', 'accommodation', 'food', 'activities', 'vignettes', 'fuel', 'other']),
  label: z.string().min(2, 'Etykieta jest za krótka'),
  amount: z.number().positive('Kwota musi być dodatnia'),
  currency: z.string().min(3).max(3),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  tripId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: any | null
}

export function ExpenseForm({ tripId, open, onOpenChange, editItem }: ExpenseFormProps) {
  const { mutate: addExpense, isPending: isAdding } = useAddExpense(tripId)
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense(tripId)

  const isEditing = !!editItem

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'other',
      label: '',
      amount: 0,
      currency: 'EUR',
    },
  })

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          category: editItem.category,
          label: editItem.label,
          amount: Number(editItem.amount),
          currency: editItem.currency,
        })
      } else {
        form.reset({
          category: 'other',
          label: '',
          amount: 0,
          currency: 'EUR',
        })
      }
    }
  }, [open, editItem, form])

  const onSubmit = (values: ExpenseFormValues) => {
    if (isEditing) {
      updateExpense({ id: editItem.id, ...values }, {
        onSuccess: () => onOpenChange(false)
      })
    } else {
      addExpense(values, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  const isPending = isAdding || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj wydatek' : 'Dodaj nowy wydatek'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="accommodation">Nocleg</SelectItem>
                      <SelectItem value="food">Jedzenie</SelectItem>
                      <SelectItem value="activities">Atrakcje</SelectItem>
                      <SelectItem value="vignettes">Winiety</SelectItem>
                      <SelectItem value="fuel">Paliwo</SelectItem>
                      <SelectItem value="other">Inne</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis / Miejsce</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Hotel w Berlinie, Kolacja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kwota</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value}
                        currency={form.watch('currency')}
                        onChange={field.onChange}
                        onCurrencyChange={(curr) => form.setValue('currency', curr)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Zapisywanie...' : isEditing ? 'Zapisz zmiany' : 'Dodaj wydatek'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
