import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/routing'
import { TripsList } from '@/components/trips/TripsList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TripsPage() {
  const t = useTranslations('trips')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Link href="/trips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('new')}
          </Button>
        </Link>
      </div>
      <TripsList />
    </div>
  )
}
