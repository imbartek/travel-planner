'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/routing'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (newLocale: 'pl' | 'en') => {
    router.replace(pathname, { locale: newLocale })
    // Update profile preference async (for later: Krok 5/6 user profile sync)
  }

  return (
    <Select value={locale} onValueChange={(v) => switchTo(v as 'pl' | 'en')}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Język / Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pl">Polski</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  )
}
