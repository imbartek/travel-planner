import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Rejestracja | Travel Planner',
  description: 'Utwórz nowe konto w Travel Planner',
}

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>
          Utwórz darmowe konto, aby planować swoje podróże.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  )
}
