import { ChecklistView } from '@/components/trips/checklist/ChecklistView'

export default async function TripChecklistPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div className="pb-10">
      <ChecklistView tripId={id} />
    </div>
  )
}
