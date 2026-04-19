/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CountrySelect } from '@/components/shared/CountrySelect'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { useAddVignette, useUpdateVignette } from '@/lib/hooks/useVignettes'

const vignetteSchema = z.object({
  country: z.string().min(2, 'Pole jest wymagane'),
  duration: z.string().optional(),
  cost: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  purchase_url: z.string().url('Wpisz poprawny link').optional().or(z.literal('')),
  note: z.string().optional(),
})

type VignetteFormValues = z.infer<typeof vignetteSchema>

interface VignetteFormProps {
  tripId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: any | null
}

export function VignetteForm({ tripId, open, onOpenChange, editItem }: VignetteFormProps) {
  const t = useTranslations('trips.vignettes')
  const { mutate: addVignette, isPending: isAdding } = useAddVignette(tripId)
  const { mutate: updateVignette, isPending: isUpdating } = useUpdateVignette(tripId)
  
  const isEditing = !!editItem

  const form = useForm<VignetteFormValues>({
    resolver: zodResolver(vignetteSchema),
    defaultValues: {
      country: '',
      duration: '',
      cost: 0,
      currency: 'EUR',
      purchase_url: '',
      note: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          country: editItem.country || '',
          duration: editItem.duration || '',
          cost: editItem.cost || 0,
          currency: editItem.currency || 'EUR',
          purchase_url: editItem.purchase_url || '',
          note: editItem.note || '',
        })
      } else {
        form.reset({
          country: '',
          duration: '',
          cost: 0,
          currency: 'EUR',
          purchase_url: '',
          note: '',
        })
      }
    }
  }, [open, editItem, form])

  const onSubmit = (values: VignetteFormValues) => {
    if (isEditing) {
      updateVignette({ id: editItem.id, ...values }, {
        onSuccess: () => onOpenChange(false)
      })
    } else {
      addVignette(values, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  const isPending = isAdding || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj winietę' : 'Dodaj nową winietę'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kraj</FormLabel>
                  <FormControl>
                    <CountrySelect value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okres ważności</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 10 dni, roczna" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Koszt</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormControl className="flex-1">
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          currency={form.watch('currency')}
                          onCurrencyChange={(c) => form.setValue('currency', c)}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="purchase_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do zakupu (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notatka (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
