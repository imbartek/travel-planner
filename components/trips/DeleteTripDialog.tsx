'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDeleteTrip } from '@/lib/hooks/useTrip'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

interface DeleteTripDialogProps {
  tripId: string
  tripTitle: string
}

export function DeleteTripDialog({ tripId, tripTitle }: DeleteTripDialogProps) {
  const t = useTranslations()
  const { mutate: deleteTrip, isPending } = useDeleteTrip()
  const [confirmTitle, setConfirmTitle] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirmTitle !== tripTitle) return
    deleteTrip(tripId, {
      onSuccess: () => setIsOpen(false)
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="mr-2 h-4 w-4" />
          {t('trips.delete.confirm')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('trips.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('trips.delete.description', { title: tripTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Wpisz poniżej <strong>{tripTitle}</strong> aby potwierdzić usunięcie:
          </p>
          <Input 
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            placeholder={tripTitle}
            className="col-span-3"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmTitle('')}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={confirmTitle !== tripTitle || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t('common.loading') : t('trips.delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
