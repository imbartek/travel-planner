/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SortableChecklistItemProps {
  item: any
  onToggle: (id: string, isDone: boolean) => void
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export function SortableChecklistItem({ item, onToggle, onUpdate, onDelete }: SortableChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(item.item)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (text !== item.item) {
      onUpdate(item.id, text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') {
      setText(item.item)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 py-2 px-1 rounded-md transition-colors",
        isDragging ? "bg-accent shadow-sm" : "hover:bg-muted/50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <Checkbox 
        id={item.id} 
        checked={item.is_done} 
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
      />

      {isEditing ? (
        <Input
          className="h-8 py-0 px-1 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary shadow-none flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span 
          className={cn(
            "flex-1 text-sm cursor-pointer truncate",
            item.is_done ? "text-muted-foreground line-through" : "text-foreground"
          )}
          onDoubleClick={() => setIsEditing(true)}
        >
          {item.item}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive transition-all"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}
