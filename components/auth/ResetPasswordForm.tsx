'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordInput) {
    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/pl/reset-password/update`,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success('Link do resetu hasła został wysłany!')
    setIsSent(true)
    setIsLoading(false)
  }

  if (isSent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Sprawdź swoją skrzynkę e-mail. Wysłaliśmy link do resetu hasła.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/pl/login">Wróc do logowania</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Wysyłanie...' : 'Zresetuj hasło'}
      </Button>

      <div className="text-center text-sm">
        <Link href="/pl/login" className="text-muted-foreground hover:underline">
          Wróć do logowania
        </Link>
      </div>
    </form>
  )
}
