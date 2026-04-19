import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['pl', 'en'],
  defaultLocale: 'pl',
  localePrefix: 'always', // /pl/... and /en/... always explicit
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
