import { VignetteTable } from '@/components/trips/vignettes/VignetteTable'

export default async function TripVignettesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div className="pb-20">
      <VignetteTable tripId={id} />
    </div>
  )
}
