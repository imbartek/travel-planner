import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Logowanie | Travel Planner',
  description: 'Zaloguj się do swojego konta Travel Planner',
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby zalogować się do konta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
