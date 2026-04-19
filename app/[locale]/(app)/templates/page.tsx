import { useTranslations } from 'next-intl'
import { TemplatesList } from '@/components/trips/TemplatesList'

export default function TemplatesPage() {
  const t = useTranslations('templates')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      </div>
      <TemplatesList />
    </div>
  )
}
