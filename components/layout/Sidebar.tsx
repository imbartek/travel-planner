'use client'

import { useTranslations } from 'next-intl'
import { usePathname, Link } from '@/lib/i18n/routing'
import { Map, LayoutTemplate, Settings } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/trips', icon: Map, labelKey: 'trips' },
  { href: '/templates', icon: LayoutTemplate, labelKey: 'templates' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <aside className="hidden flex-col border-r bg-muted/20 md:flex md:w-64">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Map className="h-6 w-6 text-primary" />
          <span className="text-xl">Travel Planner</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey as Parameters<typeof t>[0])}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <UserMenu />
      </div>
    </aside>
  )
}
