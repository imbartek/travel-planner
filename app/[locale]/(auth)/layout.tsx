import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Travel Planner</h1>
          <p className="text-muted-foreground mt-2">Zaplanuj swoją wymarzoną podróż</p>
        </div>
        {children}
      </div>
    </div>
  )
}
