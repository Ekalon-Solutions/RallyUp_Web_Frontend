"use client"

import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users, Infinity as InfinityIcon } from 'lucide-react'
import { Event } from '@/lib/api'
import { apiClient } from '@/lib/api'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { formatLocalDate } from '@/lib/timezone'
import { RefundButton } from '@/components/refund-button'
import { ResendQrButton } from '@/components/resend-qr-button'
import { getEventVenueDisplay, getEventCapacity, hasVenueTierMatrix } from '@/lib/event-display-price'

interface EventDetailsModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  const { user } = useAuth()
  const [registration, setRegistration] = useState<any | null>(null)
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL as string) || "https://wingmanpro.tech";

  const userRegistration = event?.registrations?.find(
    r => r && String((r as any).userId) === String(user?._id)
  )
  const isRegistered = Boolean(userRegistration)
  const isConfirmed = userRegistration && (userRegistration as any).status === 'confirmed'

  const eventHasEnded = (() => {
    const cutoffRaw = event?.endTime || event?.startTime
    if (!cutoffRaw) return false
    const cutoff = new Date(cutoffRaw)
    return !isNaN(cutoff.getTime()) && Date.now() > cutoff.getTime()
  })()

  useEffect(() => {
    if (!event) {
      setRegistration(null)
      return
    }
    const regs = (event.registrations || []) as any[]
    const myRegEntry = regs.find(r => r && String(r.userId) === String(user?._id) && r.registrationId)
    if (myRegEntry && myRegEntry.registrationId) {
      apiClient.getRegistrationById(String(myRegEntry.registrationId)).then(res => {
        if (res && res.success && res.data && res.data.registration) setRegistration(res.data.registration)
      }).catch(() => {
      })
    } else {
      setRegistration(null)
    }
  }, [event, user])

  if (!event) return null

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    return formatLocalDate(dateString, 'long')
  }

  const attendeesFromEvent = (event as any).attendees as string[] | undefined
  const registrationIds = event.registrations?.map(r => (r as any).userId) ?? []
  const attendeesList = Array.isArray(attendeesFromEvent) ? attendeesFromEvent : registrationIds
  const attendanceMarked = Boolean(user?._id && attendeesList && attendeesList.includes(user._id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Start: {formatDateTime(event.startTime)}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>End: {event.endTime ? formatDateTime(event.endTime) : 'N/A'}</span></div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{getEventVenueDisplay(event)}</span>
                      {hasVenueTierMatrix(event) && <Badge variant="outline" className="text-xs ml-1">Multi-venue</Badge>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const { count, max } = getEventCapacity(event)
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{count}{max !== null ? `/${max}` : ''} attendees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Category</span>
                            <Badge variant="secondary" className="ml-2">{event.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {max !== null ? (
                              <span className="text-xs text-muted-foreground">Capacity: {max}</span>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground"><InfinityIcon className="h-3 w-3" /><span>Unlimited capacity</span></div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="my-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">Event QR Code</h3>
                  <p className="text-xs text-muted-foreground">Lost or didn't get your pass? Resend it to WhatsApp.</p>
                </div>
                {registration?._id && isConfirmed && (
                  <ResendQrButton
                    mode="member"
                    registrationId={String(registration._id)}
                    phone={registration?.attendees?.[0]?.phone}
                    eventEnded={eventHasEnded}
                    variant="default"
                  />
                )}
              </div>
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                {registration && Array.isArray(registration.attendees) && registration.attendees.length > 0 ? (
                  <div className="w-full">
                    <Accordion type="single" collapsible>
                      {registration.attendees.map((att: any) => {
                        const linkSuffix = `/dashboard/events/attendance?registrationId=${encodeURIComponent(String(registration._id))}&attendeeId=${encodeURIComponent(String(att._id))}` 
                        const val = `${baseUrl}${linkSuffix}`
                        return (
                          <AccordionItem key={String(att._id)} value={String(att._id)}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-3 w-full">
                                <div className="text-sm font-medium">{att.name || 'Attendee'}</div>
                                <div className="text-xs text-muted-foreground">{att.phone}</div>
                                <Badge variant={att.status === 'cancelled' ? "destructive" : att.attended ? "default" : "secondary"} className="text-xs ml-auto">
                                  {att.status === 'cancelled'
                                    ? 'Cancelled'
                                    : att.refundStatus === 'requested'
                                      ? 'Refund requested'
                                      : att.attended
                                        ? "Attended"
                                        : "Not Attended"}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {att.status === 'cancelled' ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">This ticket has been cancelled.</p>
                              ) : (
                              <div className="flex items-center justify-center">
                                <a href={linkSuffix} target="_blank" rel="noopener noreferrer" className="w-40 h-40 bg-white rounded-md flex items-center justify-center cursor-pointer" aria-label={`Open attendance link for ${att.name}`}>
                                  <QRCode value={val} size={152} />
                                </a>
                              </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </div>
                ) : (
                  <p>No attendees registered for this event</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {isRegistered && isConfirmed && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Request Refund</h3>
                    <p className="text-xs text-muted-foreground">
                      Cancel an individual ticket and request a refund
                    </p>
                  </div>
                  <RefundButton
                    sourceType="event_ticket"
                    eventId={event._id}
                    onRefundRequested={() => {
                      onClose()
                      window.location.reload()
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
