import { useTranslations } from 'next-intl'
import { TripForm } from '@/components/trips/TripForm'

export default function NewTripPage() {
  const t = useTranslations('trips')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('new')}</h1>
      </div>
      <TripForm />
    </div>
  )
}
