"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Ticket, UserCheck, Bus, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient, Event } from "@/lib/api"

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  event: Event | null
  isRegistered: boolean
  registrationStatus?: 'confirmed' | 'pending' | 'cancelled'
}

export function EventRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  event, 
  isRegistered,
  registrationStatus 
}: EventRegistrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!event) return null

  const handleRegister = async () => {
    if (!event) return

    setLoading(true)
    try {
      const response = await apiClient.registerForEvent(event._id, notes)
      
      if (response.success) {
        toast.success("Successfully registered for event!")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to register for event")
      }
    } catch (error) {
      console.error("Error registering for event:", error)
      toast.error("An error occurred while registering for the event")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    if (!event) return

    setLoading(true)
    try {
      const response = await apiClient.cancelEventRegistration(event._id)
      
      if (response.success) {
        toast.success("Registration cancelled successfully")
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to cancel registration")
      }
    } catch (error) {
      console.error("Error cancelling registration:", error)
      toast.error("An error occurred while cancelling registration")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'match-screening': return '📺'
      case 'away-day': return '🚌'
      case 'social': return '🎉'
      case 'fundraising': return '💰'
      case 'meeting': return '🤝'
      case 'community-outreach': return '🌍'
      default: return '📅'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match-screening': return 'bg-blue-100 text-blue-800'
      case 'away-day': return 'bg-green-100 text-green-800'
      case 'social': return 'bg-purple-100 text-purple-800'
      case 'fundraising': return 'bg-yellow-100 text-yellow-800'
      case 'meeting': return 'bg-gray-100 text-gray-800'
      case 'community-outreach': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const isEventFull = event.maxAttendees && event.currentAttendees >= event.maxAttendees
  const canRegister = event.isActive && !isEventFull && !isRegistered
  const canCancel = isRegistered && registrationStatus === 'confirmed'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isRegistered ? "Event Registration Details" : "Register for Event"}
          </DialogTitle>
          <DialogDescription>
            {isRegistered 
              ? "Your registration details for this event"
              : "Join this exciting event with your supporter group"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Event Information */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold text-lg mb-3">{event.title}</h3>
            
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(event.category)}>
                  {getCategoryIcon(event.category)} {event.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Start: {formatDate(event.startTime)}</span>
              </div>
              
              {event.endTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>End: {formatDate(event.endTime)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.venue}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {event.currentAttendees}
                  {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attendees
                  {isEventFull && <span className="text-red-600 font-medium"> (FULL)</span>}
                </span>
              </div>
              
              {event.ticketPrice > 0 && (
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                  <span>Ticket Price: ₹{event.ticketPrice}</span>
                </div>
              )}
              
              {event.memberOnly && (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-blue-600">Members only event</span>
                </div>
              )}
              
              {event.awayDayEvent && (
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-green-600">Away day travel event</span>
                </div>
              )}
            </div>
          </div>

          {/* Registration Status */}
          {isRegistered && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">You are registered for this event!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Status: <Badge variant="outline" className="text-green-700 border-green-300">
                  {registrationStatus?.charAt(0).toUpperCase() + registrationStatus?.slice(1)}
                </Badge>
              </p>
            </div>
          )}

          {/* Event Full Warning */}
          {isEventFull && !isRegistered && (
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Event is full</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This event has reached its maximum capacity.
              </p>
            </div>
          )}

          {/* Registration Form */}
          {!isRegistered && canRegister && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or notes for the event organizers..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {canCancel && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Cancel Registration"}
              </Button>
            )}
            
            {canRegister && (
              <Button 
                type="button" 
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "Registering..." : "Register for Event"}
              </Button>
            )}
          </div>
        </DialogFooter>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Registration</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your registration for "{event.title}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Registration
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleCancelRegistration}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
