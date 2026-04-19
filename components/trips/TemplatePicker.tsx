'use client'

import { useTemplates } from '@/lib/hooks/useTemplates'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, LayoutTemplate } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface TemplatePickerProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  const { data: templates } = useTemplates()
  const t = useTranslations()
  const locale = useLocale()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary",
          !value ? "border-primary ring-1 ring-primary" : "border-border"
        )}
        onClick={() => onChange(undefined)}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              {t('trips.form.noTemplate')}
            </CardTitle>
            {!value && <Check className="w-4 h-4 text-primary" />}
          </div>
          <CardDescription>
            Pusta lista rzeczy do spakowania i winiet
          </CardDescription>
        </CardHeader>
      </Card>

      {templates?.map((template: any) => (
        <Card 
          key={template.id}
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            value === template.id ? "border-primary ring-1 ring-primary" : "border-border"
          )}
          onClick={() => onChange(template.id)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{locale === 'pl' ? template.name_pl : template.name_en}</CardTitle>
              {value === template.id && <Check className="w-4 h-4 text-primary" />}
            </div>
            <CardDescription className="line-clamp-2">
              {locale === 'pl' ? template.description_pl : template.description_en}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
