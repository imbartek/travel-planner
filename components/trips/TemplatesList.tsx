'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/routing'

export function TemplatesList() {
  const { data: templates, isLoading } = useTemplates()
  const t = useTranslations('templates')
  const locale = useLocale()

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />)}
    </div>
  }

  if (!templates?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed py-12">
        <LayoutTemplate className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Brak szablonów</h2>
        <p className="mb-6 mt-2 text-muted-foreground">Nie ma jeszcze dostępnych szablonów w systemie.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((template: any) => (
        <Card key={template.id} className="flex flex-col h-full hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="text-xl line-clamp-1">
              {locale === 'pl' ? template.name_pl : template.name_en}
            </CardTitle>
            <CardDescription className="line-clamp-3 mt-2 h-[60px]">
              {locale === 'pl' ? template.description_pl : template.description_en}
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto pt-4 border-t">
            <Link href={`/trips/new?template=${template.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                {t('useTemplate')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
