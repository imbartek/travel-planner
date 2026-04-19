import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Roboto } from 'next/font/google'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { QueryProvider } from '@/components/layout/QueryProvider'
import { Toaster } from 'sonner'
import '@/app/globals.css'

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
})

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!(routing.locales as readonly string[]).includes(locale)) return {}
  return {
    title: 'Travel Planner',
    description: 'Twoja aplikacja do planowania podróży',
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans h-full antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster position="top-center" richColors />
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
