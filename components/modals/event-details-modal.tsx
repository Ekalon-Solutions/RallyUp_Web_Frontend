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

interface EventDetailsModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  const { user } = useAuth()
  const [registration, setRegistration] = useState<any | null>(null)
  // Use public NEXT variable for base URL so environments can configure the domain
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL as string) || "wingmanpro.tech";

  useEffect(() => {
    if (!event) {
      setRegistration(null)
      return
    }
    // Find a registration entry on the event for the current user
    const regs = (event.registrations || []) as any[]
    const myRegEntry = regs.find(r => r && String(r.userId) === String(user?._id) && r.registrationId)
    if (myRegEntry && myRegEntry.registrationId) {
      apiClient.getRegistrationById(String(myRegEntry.registrationId)).then(res => {
        if (res && res.success && res.data && res.data.registration) setRegistration(res.data.registration)
      }).catch(() => {
        // ignore failures; leave registration null
      })
    } else {
      setRegistration(null)
    }
  }, [event, user])

  if (!event) return null

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Determine whether the current user already has attendance marked.
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
          {/* Featured image if present - use uploads/events path if available */}
          {/** Some events may include images under featuredImage or similar; using event._id as fallback is avoided */}
          {/** If future fields exist, they can be added here */}

          <Card>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Start: {formatDateTime(event.startTime)}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>End: {event.endTime ? formatDateTime(event.endTime) : 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="truncate">{event.venue || 'TBA'}</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><span>{event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attendees</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Category</span>
                      <Badge variant="secondary" className="ml-2">{event.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.maxAttendees ? (
                        <span className="text-xs text-muted-foreground">Capacity: {event.maxAttendees}</span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><InfinityIcon className="h-3 w-3" /><span>Unlimited capacity</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance status + QR Code combined in one section */}
          <Card>
            <CardContent>
              <div className="my-3">
                <h3 className="text-lg font-semibold mb-3">Event QR Code</h3>
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
                                <Badge variant={att.attended ? "default" : "secondary"} className="text-xs ml-auto">
                                  {att.attended ? "Attended" : "Not Attended"}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex items-center justify-center">
                                <a href={linkSuffix} target="_blank" rel="noopener noreferrer" className="w-40 h-40 bg-white rounded-md flex items-center justify-center cursor-pointer" aria-label={`Open attendance link for ${att.name}`}>
                                  <QRCode value={val} size={152} />
                                </a>
                              </div>
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
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
