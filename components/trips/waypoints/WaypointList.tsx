/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'
import { MapPin, Plus } from 'lucide-react'

import { useWaypoints, useReorderWaypoints, useDeleteWaypoint } from '@/lib/hooks/useWaypoints'
import { SortableWaypointItem } from './SortableWaypointItem'
import { AddWaypointDialog } from './AddWaypointDialog'
import { Button } from '@/components/ui/button'

export function WaypointList({ tripId }: { tripId: string }) {
  const t = useTranslations('trips.waypoints')
  const { data: waypoints, isLoading } = useWaypoints(tripId)
  const { mutate: reorderWaypoints } = useReorderWaypoints(tripId)
  const { mutate: deleteWaypoint } = useDeleteWaypoint(tripId)

  const [items, setItems] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)

  // Sync internal state with external query data
  useEffect(() => {
    if (waypoints) setItems(waypoints)
  }, [waypoints])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Allows clicking inside elements
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        // Trigger optimistic external mutator
        reorderWaypoints(newOrder)
        return newOrder
      })
    }
  }

  const handleDelete = (id: string, city: string) => {
    if (window.confirm(`Czy na pewno chcesz usunąć punkt ${city}?`)) {
      deleteWaypoint(id)
    }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setIsDialogOpen(true)
  }

  const handleCreateNew = () => {
    setEditItem(null)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-xl" />)}
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Trasa przejazdu
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length === 0 
              ? 'Nie dodałeś jeszcze żadnych punktów' 
              : `Liczba punktów na trasie: ${items.length}`
            }
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj punkt
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card">
              <p className="text-muted-foreground mb-4">Dodaj pierwszy punkt, aby zacząć planować trasę.</p>
              <Button variant="outline" onClick={handleCreateNew}>Dodaj waypoint</Button>
            </div>
          ) : (
            <SortableContext
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableWaypointItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>

      <AddWaypointDialog 
        tripId={tripId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editItem={editItem}
      />
    </div>
  )
}
