'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type CancellableAttendee = {
  attendeeId: string
  name: string
  phone?: string
  venueName?: string
  tierName?: string
  price?: number
  attended?: boolean
  refundStatus?: string
  grossPaid?: number
}

interface AttendeeTicketSelectModalProps {
  open: boolean
  attendees: CancellableAttendee[]
  loading?: boolean
  title?: string
  description?: string
  confirmLabel?: string
  onSelect: (attendeeId: string) => void
  onCancel: () => void
}

export function AttendeeTicketSelectModal({
  open,
  attendees,
  loading = false,
  title = 'Select ticket to cancel',
  description = 'Choose which attendee ticket you want to cancel. Other tickets in this registration will remain active.',
  confirmLabel = 'Continue',
  onSelect,
  onCancel,
}: AttendeeTicketSelectModalProps) {
  const selectable = attendees.filter(
    (a) => a.refundStatus !== 'requested' && a.refundStatus !== 'processed' && !a.attended
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {selectable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cancellable tickets are available.</p>
          ) : (
            selectable.map((attendee) => (
              <button
                key={attendee.attendeeId}
                type="button"
                disabled={loading}
                onClick={() => onSelect(attendee.attendeeId)}
                className="w-full rounded-lg border border-border p-3 text-left transition hover:bg-muted/50 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{attendee.name}</p>
                    {attendee.phone && (
                      <p className="text-xs text-muted-foreground">{attendee.phone}</p>
                    )}
                    {(attendee.venueName || attendee.tierName) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[attendee.venueName, attendee.tierName].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Select
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
