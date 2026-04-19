'use client'

import { useTranslations } from 'next-intl'
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const { theme, setTheme } = useTheme()

  const [displayName, setDisplayName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('pl')
  const [preferredCurrency, setPreferredCurrency] = useState('EUR')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [reminderDays, setReminderDays] = useState(3)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setPreferredLanguage(profile.preferred_language ?? 'pl')
      setPreferredCurrency(profile.preferred_currency ?? 'EUR')
      setEmailNotifications(profile.email_notifications_enabled ?? true)
      setReminderDays(profile.reminder_days_before ?? 3)
    }
  }, [profile])

  async function handleSave() {
    await updateProfile.mutateAsync({
      display_name: displayName,
      preferred_language: preferredLanguage,
      preferred_currency: preferredCurrency,
      email_notifications_enabled: emailNotifications,
      reminder_days_before: reminderDays,
    })
    toast.success('Zapisano ustawienia')
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <Card>
        <CardHeader><CardTitle>{t('profile')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lang">{t('preferredLanguage')}</Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">{t('preferredCurrency')}</Label>
            <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
              <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['EUR', 'PLN', 'USD', 'GBP', 'CHF', 'CZK', 'HUF'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('notifications')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotif">{t('emailNotifications')}</Label>
            <Switch
              id="emailNotif"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderDays">{t('reminderDaysBefore')}</Label>
            <Input
              id="reminderDays"
              type="number"
              min={0}
              max={30}
              value={reminderDays}
              onChange={e => setReminderDays(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('theme')}</CardTitle></CardHeader>
        <CardContent>
          <Select value={theme ?? 'system'} onValueChange={setTheme}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('themeLight')}</SelectItem>
              <SelectItem value="dark">{t('themeDark')}</SelectItem>
              <SelectItem value="system">{t('themeSystem')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
      </Button>
    </div>
  )
}
