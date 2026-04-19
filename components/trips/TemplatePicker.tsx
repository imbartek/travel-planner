/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useTemplates } from '@/lib/hooks/useTemplates'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, LayoutTemplate } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TemplatePickerProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  const { data: templates } = useTemplates()
  const t = useTranslations()

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
              <CardTitle className="text-base">{template.name}</CardTitle>
              {value === template.id && <Check className="w-4 h-4 text-primary" />}
            </div>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
