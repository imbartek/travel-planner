/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
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
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { SortableChecklistItem } from './SortableChecklistItem'
import { useAddChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem, useReorderChecklistItems } from '@/lib/hooks/useChecklist'

interface ChecklistCategoryProps {
  tripId: string
  category: string
  items: any[]
}

export function ChecklistCategory({ tripId, category, items }: ChecklistCategoryProps) {
  const [newItemText, setNewItemText] = useState('')
  const { mutate: addItem } = useAddChecklistItem(tripId)
  const { mutate: updateItem } = useUpdateChecklistItem(tripId)
  const { mutate: deleteItem } = useDeleteChecklistItem(tripId)
  const { mutate: reorderItems } = useReorderChecklistItems(tripId)

  const doneCount = items.filter(i => i.is_done).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemText.trim()) {
      addItem({ category, item: newItemText, is_done: false })
      setNewItemText('')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      
      const updates = newItems.map((item, idx) => ({ id: item.id, order_index: idx }))
      reorderItems(updates)
    }
  }

  return (
    <AccordionItem value={category} className="border-none bg-card rounded-xl shadow-sm mb-4 overflow-hidden">
      <div className="px-4 pt-1">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex flex-col items-start gap-1 w-full text-left">
            <h3 className="text-base font-semibold">{category}</h3>
            <div className="flex items-center gap-2 w-full pr-8">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 uppercase tracking-tighter">
                {doneCount} / {totalCount}
              </span>
            </div>
          </div>
        </AccordionTrigger>
      </div>
      
      <AccordionContent className="px-4 pb-4 pt-0">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-1">
            <SortableContext 
              items={items.map(i => i.id)} 
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={(id, isDone) => updateItem({ id, is_done: isDone })}
                  onUpdate={(id, text) => updateItem({ id, item: text })}
                  onDelete={(id) => {
                    if (confirm('Usunąć tę pozycję?')) deleteItem(id)
                  }}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        <form onSubmit={handleAddItem} className="mt-2 flex items-center gap-2 px-1 opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Dodaj nową pozycję..."
            className="h-8 border-none bg-transparent p-0 italic focus-visible:ring-0 shadow-none text-sm"
          />
        </form>
      </AccordionContent>
    </AccordionItem>
  )
}
