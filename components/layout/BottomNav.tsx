'use client'

import { useTranslations } from 'next-intl'
import { usePathname, Link } from '@/lib/i18n/routing'
import { Map, LayoutTemplate, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/trips', icon: Map, labelKey: 'trips' },
  { href: '/templates', icon: LayoutTemplate, labelKey: 'templates' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
]

export function BottomNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background md:hidden">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-4 hover:bg-muted/50 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-1", isActive && "fill-primary/20")} />
              <span className="text-[10px] uppercase tracking-wider">{t(item.labelKey as Parameters<typeof t>[0])}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
