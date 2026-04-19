/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
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
import { useAddWaypoint, useUpdateWaypoint } from '@/lib/hooks/useWaypoints'

const waypointSchema = z.object({
  city: z.string().min(1, 'Pole jest wymagane'),
  country: z.string().optional(),
  note: z.string().optional(),
})

type WaypointFormValues = z.infer<typeof waypointSchema>

interface AddWaypointDialogProps {
  tripId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: any | null
}

export function AddWaypointDialog({ tripId, open, onOpenChange, editItem }: AddWaypointDialogProps) {
  const t = useTranslations('trips.waypoints')
  const { mutate: addWaypoint, isPending: isAdding } = useAddWaypoint(tripId)
  const { mutate: updateWaypoint, isPending: isUpdating } = useUpdateWaypoint(tripId)
  
  const isEditing = !!editItem

  const form = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointSchema),
    defaultValues: {
      city: '',
      country: '',
      note: '',
    },
  })

  // Zaktualizuj form gdy zmienia się `editItem`
  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          city: editItem.city || '',
          country: editItem.country || '',
          note: editItem.note || '',
        })
      } else {
        form.reset({ city: '', country: '', note: '' })
      }
    }
  }, [open, editItem, form])

  const onSubmit = (values: WaypointFormValues) => {
    if (isEditing) {
      updateWaypoint({ id: editItem.id, ...values }, {
        onSuccess: () => onOpenChange(false)
      })
    } else {
      addWaypoint(values, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  const isPending = isAdding || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('edit') : t('add')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('city')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('country')}</FormLabel>
                  <FormControl>
                    <CountrySelect value={field.value} onChange={field.onChange} />
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
                  <FormLabel>{t('note')}</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={3} {...field} />
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
