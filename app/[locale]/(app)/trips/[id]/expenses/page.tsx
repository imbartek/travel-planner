import { TripSummary } from '@/components/trips/expenses/TripSummary'
import { ExpenseList } from '@/components/trips/expenses/ExpenseList'

export default async function TripExpensesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div className="space-y-8 pb-20">
      <TripSummary tripId={id} />
      <ExpenseList tripId={id} />
    </div>
  )
}
