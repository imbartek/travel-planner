'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CountrySelect } from '@/components/shared/CountrySelect'
import { DatePicker } from '@/components/shared/DatePicker'
import { TemplatePicker } from '@/components/trips/TemplatePicker'
import { useCreateTrip } from '@/lib/hooks/useTrip'

const tripFormSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany').max(100),
  country_from: z.string().optional(),
  country_to: z.string().optional(),
  date_start: z.date().optional(),
  date_end: z.date().optional(),
  notes: z.string().optional(),
  template_id: z.string().optional(),
})

type TripFormInput = z.infer<typeof tripFormSchema>

export function TripForm() {
  const t = useTranslations('trips.form')
  const { mutate: createTrip, isPending } = useCreateTrip()
  const router = useRouter()

  const form = useForm<TripFormInput>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: '',
      notes: '',
    },
  })

  function onSubmit(values: TripFormInput) {
    createTrip({
      ...values,
      date_start: values.date_start?.toISOString(),
      date_end: values.date_end?.toISOString(),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">{t('template')}</h3>
          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TemplatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('titlePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('countryFrom')}</FormLabel>
                <FormControl>
                  <CountrySelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('countryTo')}</FormLabel>
                <FormControl>
                  <CountrySelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dateStart')}</FormLabel>
                <FormControl>
                  <DatePicker date={field.value} setDate={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dateEnd')}</FormLabel>
                <FormControl>
                  <DatePicker date={field.value} setDate={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('notes')}</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Tworzenie...' : 'Utwórz podróż'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
