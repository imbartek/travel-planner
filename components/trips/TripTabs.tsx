/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useTranslations } from 'next-intl'
import { usePathname, Link } from '@/lib/i18n/routing'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const TABS = [
  { value: '', labelKey: 'overview' },
  { value: 'route', labelKey: 'route' },
  { value: 'vignettes', labelKey: 'vignettes' },
  { value: 'fuel', labelKey: 'fuel' },
  { value: 'checklist', labelKey: 'checklist' },
  { value: 'expenses', labelKey: 'expenses' },
  { value: 'members', labelKey: 'members' },
  { value: 'settings', labelKey: 'settings' },
]

export function TripTabs({ tripId }: { tripId: string }) {
  const t = useTranslations('trips.tabs')
  const pathname = usePathname()
  
  // Example pathname: /trips/xxx/route -> active tab is 'route'
  // When inside overview, pathname is exactly `/trips/xxx`
  const activeTab = TABS.find(tab => {
    if (tab.value === '') return pathname === `/trips/${tripId}`
    return pathname.startsWith(`/trips/${tripId}/${tab.value}`)
  })?.value || ''

  return (
    <div className="mb-8 border-b">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-full items-center">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <Link
                key={tab.labelKey}
                href={`/trips/${tripId}${tab.value ? `/${tab.value}` : ''}`}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors hover:text-primary",
                  isActive 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground border-b-2 border-transparent"
                )}
              >
                {t(tab.labelKey as any)}
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
