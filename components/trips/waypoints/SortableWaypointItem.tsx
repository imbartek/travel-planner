/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { COUNTRIES } from '@/components/shared/CountrySelect'

interface SortableWaypointItemProps {
  id: string
  item: any
  index: number
  onEdit: (item: any) => void
  onDelete: (id: string, city: string) => void
}

export function SortableWaypointItem({ id, item, index, onEdit, onDelete }: SortableWaypointItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  const countryName = item.country
    ? COUNTRIES.find((c) => c.code === item.country)?.name || item.country
    : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm transition-colors
        ${isDragging ? 'ring-2 ring-primary border-transparent' : 'hover:border-primary/50'}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1 -ml-2 rounded"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base truncate">{item.city}</span>
          {countryName && (
            <span className="text-sm text-muted-foreground shrink-0">{countryName}</span>
          )}
        </div>
        {item.note && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-snug">
            {item.note}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id, item.city)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Mobile actions (visible always on small screens) */}
      <div className="flex sm:hidden items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
