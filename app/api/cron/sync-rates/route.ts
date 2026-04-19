import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // Prosta weryfikacja sekretu dla CRON
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    // 1. Pobierz dane z Frankfurter API (baza EUR)
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR')
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.statusText}`)
    }

    const data = await response.json()
    const rates = data.rates
    
    // Dodaj EUR: 1.0 jawnie
    rates['EUR'] = 1.0

    // 2. Przygotuj dane do upsertu
    const upsertData = Object.entries(rates).map(([code, rate]) => ({
      code,
      rate_to_eur: rate,
      updated_at: new Date().toISOString()
    }))

    // 3. Wykonaj upsert w Supabase
    const { error } = await supabase
      .from('currency_rates')
      .upsert(upsertData as any, { onConflict: 'code' })

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${upsertData.length} currency rates`,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('CRON sync-rates error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Obsługa POST (niektóre toolse do cronów wolą POST)
export async function POST(request: Request) {
  return GET(request)
}
