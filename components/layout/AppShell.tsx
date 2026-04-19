import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="h-full px-4 py-6 md:px-8 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
