import { WaypointList } from '@/components/trips/waypoints/WaypointList'

export default async function TripRoutePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div className="pb-20">
      <WaypointList tripId={id} />
    </div>
  )
}
