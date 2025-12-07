"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Ticket, UserCheck, Bus, Plus, X, Percent } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface Event {
  _id: string
  clubId?: string
  title: string
  category: string
  startTime: string
  endTime: string
  venue: string
  description: string
  maxAttendees: number
  ticketPrice: number
  requiresTicket: boolean
  memberOnly: boolean
  awayDayEvent: boolean
  earlyBirdDiscount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
    startTime: string,
    endTime: string,
    membersOnly: boolean,
  }
  memberDiscount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
  }
  groupDiscount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
    minQuantity: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
  bookingStartTime: string
  bookingEndTime: string
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editEvent?: Event | null
}

export function CreateEventModal({ isOpen, onClose, onSuccess, editEvent }: CreateEventModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    title: "",
    category: "match-screening",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    maxAttendees: "",
    ticketPrice: "0",
    requiresTicket: false,
    memberOnly: false,
    awayDayEvent: false,
    bookingStartTime: "",
    bookingEndTime: "",
    currency: "INR",
    // Discount fields
    earlyBirdEnabled: false,
    earlyBirdType: "percentage" as "percentage" | "fixed",
    earlyBirdValue: "",
    earlyBirdStartTime: "",
    earlyBirdEndTime: "",
    earlyBirdMembersOnly: false,
    clubId: "",
    memberDiscountEnabled: false,
    memberDiscountType: "percentage" as "percentage" | "fixed",
    memberDiscountValue: "",
    groupDiscountEnabled: false,
    groupDiscountType: "percentage" as "percentage" | "fixed",
    groupDiscountValue: "",
    groupDiscountMinQty: "2",
  })

  const [clubs, setClubs] = useState<Array<{ _id: string; name: string }>>([])

  useEffect(() => {
    // Get clubs list for the members-only dropdown
    // Only show clubs that the current user (admin) has access to
    let mounted = true
    
    async function fetchClubs() {
      try {
        // For admins, they can only access their assigned club
        // For super_admin or system_owner, they can access all clubs
        const userRole = user?.role
        
        if (userRole === 'admin' || userRole === 'super_admin') {
          // Admin: only show their assigned club
          const adminUser = user as any
          if (adminUser?.club) {
            // Admin has a single club assigned
            const adminClub = adminUser.club
            if (mounted) {
              setClubs([{ _id: adminClub._id, name: adminClub.name }])
            }
            return
          }
        }
        
        // System owner or fallback: fetch all clubs
        if (userRole === 'system_owner') {
          const res: any = await apiClient.getPublicClubs()
          if (mounted && res?.data) {
            const list = res?.data?.clubs || []
            setClubs(list.map((c: any) => ({ _id: c._id, name: c.name })))
          }
        }
      } catch (err) {
        // console.error('Failed to load clubs for event modal', err)
      }
    }

    if (isOpen && user) fetchClubs()
    return () => { mounted = false }
  }, [isOpen, user])

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      setErrors({}) // Clear errors when modal opens
      if (editEvent) {
        // Calculate default booking times based on event start time
        setFormData({
          title: editEvent.title,
          category: editEvent.category,
          startTime: editEvent.startTime.slice(0, 16), // Format for datetime-local input
          endTime: editEvent.endTime ? editEvent.endTime.slice(0, 16) : "",
          venue: editEvent.venue,
          description: editEvent.description,
          maxAttendees: editEvent.maxAttendees?.toString() || "",
          ticketPrice: editEvent.ticketPrice.toString(),
          currency: (editEvent as any).currency || 'INR',
          requiresTicket: editEvent.requiresTicket,
          memberOnly: editEvent.memberOnly,
          awayDayEvent: editEvent.awayDayEvent,
          bookingStartTime: editEvent.bookingStartTime?.slice(0, 16) || "",
          bookingEndTime: editEvent.bookingEndTime?.slice(0, 16) || "",
          // Discount fields
          earlyBirdEnabled: editEvent.earlyBirdDiscount?.enabled || false,
          earlyBirdType: editEvent.earlyBirdDiscount?.type || "percentage",
          earlyBirdValue: editEvent.earlyBirdDiscount?.value?.toString() || "",
          earlyBirdStartTime: editEvent.earlyBirdDiscount?.startTime?.slice(0, 16) || "",
          earlyBirdEndTime: editEvent.earlyBirdDiscount?.endTime?.slice(0, 16) || "",
          earlyBirdMembersOnly: editEvent.earlyBirdDiscount?.membersOnly || false,
          clubId: (editEvent as any).clubId || (editEvent as any).club?._id || "",
          memberDiscountEnabled: editEvent.memberDiscount?.enabled || false,
          memberDiscountType: editEvent.memberDiscount?.type || "percentage",
          memberDiscountValue: editEvent.memberDiscount?.value?.toString() || "",
          groupDiscountEnabled: editEvent.groupDiscount?.enabled || false,
          groupDiscountType: editEvent.groupDiscount?.type || "percentage",
          groupDiscountValue: editEvent.groupDiscount?.value?.toString() || "",
          groupDiscountMinQty: editEvent.groupDiscount?.minQuantity?.toString() || "2",
        })
      } else {
        // Set default values for new event
        const now = new Date()
        const defaultStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
        const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours
        const defaultBookingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000) // 1 hour from now
        const defaultBookingEnd = new Date(defaultStartTime.getTime() - 1 * 60 * 60 * 1000) // 1 hour before event

        setFormData({
          title: "",
          category: "match-screening",
          startTime: defaultStartTime.toISOString().slice(0, 16),
          endTime: defaultEndTime.toISOString().slice(0, 16),
          venue: "",
          description: "",
          maxAttendees: "",
          ticketPrice: "0",
          currency: "INR",
          requiresTicket: false,
          memberOnly: false,
          awayDayEvent: false,
          bookingStartTime: defaultBookingStart.toISOString().slice(0, 16),
          bookingEndTime: defaultBookingEnd.toISOString().slice(0, 16),
          // Discount fields
          earlyBirdEnabled: false,
          earlyBirdType: "percentage",
          earlyBirdValue: "",
          earlyBirdStartTime: "",
          earlyBirdEndTime: "",
          earlyBirdMembersOnly: false,
          clubId: "",
          memberDiscountEnabled: false,
          memberDiscountType: "percentage",
          memberDiscountValue: "",
          groupDiscountEnabled: false,
          groupDiscountType: "percentage",
          groupDiscountValue: "",
          groupDiscountMinQty: "2",
        })
      }
    }
  }, [isOpen, editEvent])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Event title is required"
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Event title must be at least 3 characters long"
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Event title cannot exceed 200 characters"
    }

    // Start time validation
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required"
    } else {
      const startTime = new Date(formData.startTime)
      const now = new Date()
      if (startTime <= now) {
        newErrors.startTime = "Start time must be in the future"
      }
    }

    // End time validation
    if (formData.endTime) {
      const startTime = new Date(formData.startTime)
      const endTime = new Date(formData.endTime)
      if (endTime <= startTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    // Venue validation
    if (!formData.venue.trim()) {
      newErrors.venue = "Venue is required"
    } else if (formData.venue.trim().length < 5) {
      newErrors.venue = "Venue must be at least 5 characters long"
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Event description is required"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Event description must be at least 10 characters long"
    }

    // Max attendees validation
    if (formData.maxAttendees && parseInt(formData.maxAttendees) < 1) {
      newErrors.maxAttendees = "Maximum attendees must be at least 1"
    }

    // Ticket price validation
    if (formData.ticketPrice && parseFloat(formData.ticketPrice) < 0) {
      newErrors.ticketPrice = "Ticket price cannot be negative"
    }

    // Booking time validation
    if (formData.bookingStartTime && formData.bookingEndTime) {
      const bookingStart = new Date(formData.bookingStartTime)
      const bookingEnd = new Date(formData.bookingEndTime)
      if (bookingEnd <= bookingStart) {
        newErrors.bookingEndTime = "Booking end time must be after booking start time"
      }
    }

    // If members-only, ensure a club is selected
    if (formData.memberOnly && !formData.clubId) {
      newErrors.clubId = "Please select a club for members-only events"
    }

    // Early bird discount validation
    if (formData.earlyBirdEnabled) {
      if (!formData.earlyBirdValue || parseFloat(formData.earlyBirdValue) <= 0) {
        newErrors.earlyBirdValue = "Early bird discount value must be greater than 0"
      }
      if (formData.earlyBirdType === "percentage" && parseFloat(formData.earlyBirdValue) > 100) {
        newErrors.earlyBirdValue = "Percentage discount cannot exceed 100%"
      }
      if (!formData.earlyBirdStartTime) {
        newErrors.earlyBirdStartTime = "Early bird start time is required"
      } else {
        const start = new Date(formData.startTime)
        const earlyBirdStart = new Date(formData.earlyBirdStartTime)
        if (earlyBirdStart >= start) {
          newErrors.earlyBirdStartTime = "Early bird start time must be before event start time"
        }
      }
      if (!formData.earlyBirdEndTime) {
        newErrors.earlyBirdEndTime = "Early bird end time is required"
      } else {
        const earlyBirdEnd = new Date(formData.earlyBirdEndTime)
        const earlyBirdStart = new Date(formData.earlyBirdStartTime)
        if (earlyBirdEnd <= earlyBirdStart) {
          newErrors.earlyBirdEndTime = "Early bird end time must be after early bird start time"
        }
      }
    }

    // Member discount validation
    if (formData.memberDiscountEnabled) {
      if (!formData.memberDiscountValue || parseFloat(formData.memberDiscountValue) <= 0) {
        newErrors.memberDiscountValue = "Member discount value must be greater than 0"
      }
      if (formData.memberDiscountType === "percentage" && parseFloat(formData.memberDiscountValue) > 100) {
        newErrors.memberDiscountValue = "Percentage discount cannot exceed 100%"
      }
    }

    // Group discount validation
    if (formData.groupDiscountEnabled) {
      if (!formData.groupDiscountValue || parseFloat(formData.groupDiscountValue) <= 0) {
        newErrors.groupDiscountValue = "Group discount value must be greater than 0"
      }
      if (formData.groupDiscountType === "percentage" && parseFloat(formData.groupDiscountValue) > 100) {
        newErrors.groupDiscountValue = "Percentage discount cannot exceed 100%"
      }
      if (!formData.groupDiscountMinQty || parseInt(formData.groupDiscountMinQty) < 2) {
        newErrors.groupDiscountMinQty = "Minimum quantity must be at least 2"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)

    try {
      const eventData = {
        title: formData.title.trim(),
        category: formData.category,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        venue: formData.venue.trim(),
        description: formData.description.trim(),
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        ticketPrice: parseFloat(formData.ticketPrice) || 0,
        requiresTicket: formData.requiresTicket,
        memberOnly: formData.memberOnly,
        clubId: formData.memberOnly ? (formData.clubId || undefined) : undefined,
        awayDayEvent: formData.awayDayEvent,
        bookingStartTime: formData.bookingStartTime ? new Date(formData.bookingStartTime).toISOString() : undefined,
        bookingEndTime: formData.bookingEndTime ? new Date(formData.bookingEndTime).toISOString() : undefined,
        currency: formData.currency || 'INR',
        earlyBirdDiscount: formData.earlyBirdEnabled ? {
          enabled: true,
          type: formData.earlyBirdType,
          value: parseFloat(formData.earlyBirdValue),
          startTime: new Date(formData.earlyBirdStartTime).toDateString(),
          endTime: new Date(formData.earlyBirdEndTime).toDateString(),
          membersOnly: formData.earlyBirdMembersOnly
        } : { enabled: false, type: 'percentage', value: 0 },
        memberDiscount: formData.memberDiscountEnabled ? {
          enabled: true,
          type: formData.memberDiscountType,
          value: parseFloat(formData.memberDiscountValue)
        } : { enabled: false, type: 'percentage', value: 0 },
        groupDiscount: formData.groupDiscountEnabled ? {
          enabled: true,
          type: formData.groupDiscountType,
          value: parseFloat(formData.groupDiscountValue),
          minQuantity: parseInt(formData.groupDiscountMinQty)
        } : { enabled: false, type: 'percentage', value: 0, minQuantity: 2 }
      }
      // console.log("eventData to submit:", eventData)
      // Use API client to create/update event
      let response
      if (editEvent) {
        response = await apiClient.updateEvent(editEvent._id, eventData)
      } else {
        response = await apiClient.createEvent(eventData)
      }

      if (response.success) {
        toast.success(editEvent ? "Event updated successfully!" : "Event created successfully!")
        onSuccess()
        onClose()
      } else {
        // Handle specific backend validation errors
        if (response.error && response.error.includes('validation')) {
          toast.error("Please check your form inputs and try again")
        } else {
          throw new Error(response.error || 'Failed to save event')
        }
      }
    } catch (error) {
      // console.error("Error saving event:", error)

      // Provide user-friendly error messages
      let errorMessage = "An error occurred while saving the event"

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = "Your session has expired. Please log in again."
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = "You don't have permission to perform this action."
        } else if (error.message.includes('validation')) {
          errorMessage = "Please check your form inputs and try again."
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setErrors({})
    const now = new Date()
    const defaultStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000)
    const defaultBookingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000)
    const defaultBookingEnd = new Date(defaultStartTime.getTime() - 1 * 60 * 60 * 1000)

    setFormData({
      title: "",
      category: "match-screening",
      startTime: defaultStartTime.toISOString().slice(0, 16),
      endTime: defaultEndTime.toISOString().slice(0, 16),
      venue: "",
      description: "",
      maxAttendees: "",
      ticketPrice: "0",
      currency: "INR",
      requiresTicket: false,
      memberOnly: false,
      awayDayEvent: false,
      bookingStartTime: defaultBookingStart.toISOString().slice(0, 16),
      bookingEndTime: defaultBookingEnd.toISOString().slice(0, 16),
      earlyBirdEnabled: false,
      earlyBirdType: "percentage",
      earlyBirdValue: "",
      earlyBirdStartTime: "",
      earlyBirdEndTime: "",
      earlyBirdMembersOnly: false,
      memberDiscountEnabled: false,
      memberDiscountType: "percentage",
      memberDiscountValue: "",
      groupDiscountEnabled: false,
      groupDiscountType: "percentage",
      groupDiscountValue: "",
      groupDiscountMinQty: "2",
      clubId: "",
    })
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

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-primary" />
            {editEvent ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {editEvent ? "Update event details" : "Create a new event for your supporter group"}
          </DialogDescription>
        </DialogHeader>

        {/* Error Summary */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Basic Information Section */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic Information
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Event Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., 'Match Screening vs. Manchester United'"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) {
                        setErrors((errors) => {
                          const { title, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} transition-all`}
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match-screening">📺 Match Screening</SelectItem>
                      <SelectItem value="away-day">🚌 Away Day Travel</SelectItem>
                      <SelectItem value="social">🎉 Social Event</SelectItem>
                      <SelectItem value="fundraising">💰 Fundraising</SelectItem>
                      <SelectItem value="meeting">🤝 Club Meeting</SelectItem>
                      <SelectItem value="community-outreach">🌍 Community Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-medium text-gray-700">
                    Venue <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="venue"
                    placeholder="e.g., 'The Sports Bar, Mumbai' or 'Online - Zoom'"
                    value={formData.venue}
                    onChange={(e) => {
                      setFormData({ ...formData, venue: e.target.value });
                      if (errors.venue) {
                        setErrors((errors) => {
                          const { venue, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.venue ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} transition-all`}
                  />
                  {errors.venue && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.venue}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      if (errors.startTime) {
                        setErrors((errors) => {
                          const { startTime, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.startTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} transition-all`}
                    required
                  />
                  {errors.startTime && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.startTime}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => {
                      setFormData({ ...formData, endTime: e.target.value });
                      if (errors.endTime) {
                        setErrors((errors) => {
                          const { endTime, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.endTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} transition-all`}
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.endTime}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the event details and what attendees can expect..."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) {
                        setErrors((errors) => {
                          const { description, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} transition-all`}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Minimum 10 characters • {formData.description.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Settings Section */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Event Settings
            </h3>
            <div className="grid gap-6 md:grid-cols-2 divide-x-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees" className="text-sm font-medium">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxAttendees}
                    onChange={(e) => {
                      setFormData({ ...formData, maxAttendees: e.target.value });
                      if (errors.maxAttendees) {
                        setErrors((errors) => {
                          const { maxAttendees, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.maxAttendees ? "border-red-500" : "border-gray-300"} transition-all`}
                    min="1"
                  />
                  {errors.maxAttendees && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.maxAttendees}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Leave blank for unlimited capacity</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="ticketPrice" className="text-sm font-medium">Ticket Price</Label>
                    <div className="w-40">
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="ZAR">ZAR</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                          <SelectItem value="SEK">SEK</SelectItem>
                          <SelectItem value="NZD">NZD</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                          <SelectItem value="HKD">HKD</SelectItem>
                          <SelectItem value="NOK">NOK</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                          <SelectItem value="DKK">DKK</SelectItem>
                          <SelectItem value="ILS">ILS</SelectItem>
                          <SelectItem value="PLN">PLN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input
                    id="ticketPrice"
                    type="number"
                    placeholder="0 for free event"
                    value={formData.ticketPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, ticketPrice: e.target.value });
                      if (errors.ticketPrice) {
                        setErrors((errors) => {
                          const { ticketPrice, ...rest } = errors;
                          return rest;
                        });
                      }
                    }}
                    className={`${errors.ticketPrice ? "border-red-500" : "border-gray-300"} transition-all`}
                    min="0"
                    step="10"
                  />
                  {errors.ticketPrice && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.ticketPrice}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Set to 0 for free events</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <Label htmlFor="requiresTicket" className="text-sm font-medium cursor-pointer">Requires Ticket</Label>
                      <p className="text-xs text-gray-500">Members need to book tickets</p>
                    </div>
                  </div>
                  <Switch
                    id="requiresTicket"
                    checked={formData.requiresTicket}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresTicket: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <Label htmlFor="memberOnly" className="text-sm font-medium cursor-pointer">Members Only</Label>
                      <p className="text-xs">Only club members can attend</p>
                    </div>
                  </div>
                  <Switch
                    id="memberOnly"
                    checked={formData.memberOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, memberOnly: checked })}
                  />
                </div>
                {formData.memberOnly && (
                  <div className="space-y-2 px-4">
                    <Label htmlFor="clubId" className="text-sm font-medium">Select Club</Label>
                    <Select
                      value={formData.clubId}
                      onValueChange={(value) => setFormData({ ...formData, clubId: value })}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Choose a club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.length === 0 ? (
                          <SelectItem disabled value="No clubs available">No clubs available</SelectItem>
                        ) : (
                          clubs.map((club) => (
                            <SelectItem key={club._id} value={club._id}>{club.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formData.memberOnly && !formData.clubId && (
                      <p className="text-red-500 text-sm">Please select a club for members-only events</p>
                    )}
                  </div>
                )}
             </div>
            </div>
          </div>

          {/* Booking Time Settings */}
          <div className="border rounded-lg p-4 ">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Booking Window
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bookingStartTime">Booking Start Time</Label>
                <Input
                  id="bookingStartTime"
                  type="datetime-local"
                  value={formData.bookingStartTime}
                  onChange={(e) => setFormData({ ...formData, bookingStartTime: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">When bookings open</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingEndTime">Booking End Time</Label>
                <Input
                  id="bookingEndTime"
                  type="datetime-local"
                  value={formData.bookingEndTime}
                  onChange={(e) => {
                    setFormData({ ...formData, bookingEndTime: e.target.value });
                    if (errors.bookingEndTime) {
                      setErrors((errors) => {
                        const { bookingEndTime, ...rest } = errors;
                        return rest;
                      });
                    }
                  }}
                  className={errors.bookingEndTime ? "border-red-500" : ""}
                />
                {errors.bookingEndTime && (
                  <p className="text-red-500 text-sm">{errors.bookingEndTime}</p>
                )}
                <p className="text-xs text-muted-foreground">When bookings close</p>
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="border rounded-lg p-4 ">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Discount Options
            </h4>
            
            {/* Early Bird Discount */}
           <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="earlyBirdEnabled" className="font-medium">Early Bird Discount</Label>
                  <p className="text-sm text-muted-foreground">Discount for early registrations</p>
                </div>
                <Switch
                  id="earlyBirdEnabled"
                  checked={formData.earlyBirdEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, earlyBirdEnabled: checked })}
                />
              </div>
              
              {formData.earlyBirdEnabled && (
                <div className="grid gap-4 md:grid-cols-3 pl-4 border-l-2 border-green-300">
                  <div className="space-y-2">
                    <Label htmlFor="earlyBirdType">Type</Label>
                    <Select
                      value={formData.earlyBirdType}
                      onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, earlyBirdType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earlyBirdValue">
                      Value {formData.earlyBirdType === "percentage" ? "(%)" : "(₹)"}
                    </Label>
                    <Input
                      id="earlyBirdValue"
                      type="number"
                      placeholder={formData.earlyBirdType === "percentage" ? "e.g., 20" : "e.g., 100"}
                      value={formData.earlyBirdValue}
                      onChange={(e) => {
                        setFormData({ ...formData, earlyBirdValue: e.target.value });
                        if (errors.earlyBirdValue) {
                          setErrors((errors) => {
                            const { earlyBirdValue, ...rest } = errors;
                            return rest;
                          });
                        }
                      }}
                      className={errors.earlyBirdValue ? "border-red-500" : ""}
                      min="0"
                      max={formData.earlyBirdType === "percentage" ? "100" : undefined}
                    />
                    {errors.earlyBirdValue && (
                      <p className="text-red-500 text-sm">{errors.earlyBirdValue}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earlyBirdStartTime">Start Time</Label>
                    <Input
                      id="earlyBirdStartTime"
                      type="datetime-local"
                      value={formData.earlyBirdStartTime}
                      onChange={(e) => {
                        setFormData({ ...formData, earlyBirdStartTime: e.target.value });
                        if (errors.earlyBirdStartTime) {
                          setErrors((errors) => {
                            const { earlyBirdStartTime, ...rest } = errors;
                            return rest;
                          });
                        }
                      }}
                      className={errors.earlyBirdStartTime ? "border-red-500" : ""}
                    />
                    {errors.earlyBirdStartTime && (
                      <p className="text-red-500 text-sm">{errors.earlyBirdStartTime}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earlyBirdEndTime">End Time</Label>
                    <Input
                      id="earlyBirdEndTime"
                      type="datetime-local"
                      value={formData.earlyBirdEndTime}
                      onChange={(e) => {
                        setFormData({ ...formData, earlyBirdEndTime: e.target.value });
                        if (errors.earlyBirdEndTime) {
                          setErrors((errors) => {
                            const { earlyBirdEndTime, ...rest } = errors;
                            return rest;
                          });
                        }
                      }}
                      className={errors.earlyBirdEndTime ? "border-red-500" : ""}
                    />
                    {errors.earlyBirdEndTime && (
                      <p className="text-red-500 text-sm">{errors.earlyBirdEndTime}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="earlyBirdMembersOnly"
                        checked={formData.earlyBirdMembersOnly || false}
                        onChange={(e) => setFormData({ ...formData, earlyBirdMembersOnly: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="earlyBirdMembersOnly" className="cursor-pointer">
                        Members Only - Apply this discount only to club members
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Group Discount */}
            {/* <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="groupDiscountEnabled" className="font-medium">Group/Bulk Discount</Label>
                  <p className="text-sm text-muted-foreground">Discount for group registrations</p>
                </div>
                <Switch
                  id="groupDiscountEnabled"
                  checked={formData.groupDiscountEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, groupDiscountEnabled: checked })}
                  />
            </div>
              {formData.groupDiscountEnabled && (
                <div className="grid gap-4 md:grid-cols-3 pl-4 border-l-2 border-green-300">
                  <div className="space-y-2">
                    <Label htmlFor="groupDiscountType">Type</Label>
                    <Select
                      value={formData.groupDiscountType}
                      onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, groupDiscountType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDiscountValue">
                      Value {formData.groupDiscountType === "percentage" ? "(%)" : "(₹)"}
                    </Label>
                    <Input
                      id="groupDiscountValue"
                      type="number"
                      placeholder={formData.groupDiscountType === "percentage" ? "e.g., 10" : "e.g., 200"}
                      value={formData.groupDiscountValue}
                      onChange={(e) => {
                        setFormData({ ...formData, groupDiscountValue: e.target.value });
                        if (errors.groupDiscountValue) {
                          setErrors((errors) => {
                            const { groupDiscountValue, ...rest } = errors;
                            return rest;
                          });
                        }
                      }}
                      className={errors.groupDiscountValue ? "border-red-500" : ""}
                      min="0"
                      max={formData.groupDiscountType === "percentage" ? "100" : undefined}
                    />
                    {errors.groupDiscountValue && (
                      <p className="text-red-500 text-sm">{errors.groupDiscountValue}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDiscountMinQty">Min. Quantity</Label>
                    <Input
                      id="groupDiscountMinQty"
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.groupDiscountMinQty}
                      onChange={(e) => {
                        setFormData({ ...formData, groupDiscountMinQty: e.target.value });
                        if (errors.groupDiscountMinQty) {
                          setErrors((errors) => {
                            const { groupDiscountMinQty, ...rest } = errors;
                            return rest;
                          });
                        }
                      }}
                      className={errors.groupDiscountMinQty ? "border-red-500" : ""}
                      min="2"
                    />
                    {errors.groupDiscountMinQty && (
                      <p className="text-red-500 text-sm">{errors.groupDiscountMinQty}</p>
                    )}
                  </div>
                </div>
              )}
          </div> */}
          </div>

          {/* Event Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Event Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Title:</span>
                <span>{formData.title || "No title"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Category:</span>
                <Badge className={getCategoryColor(formData.category)}>
                  {getCategoryIcon(formData.category)} {formData.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Start:</span>
                <span>{formData.startTime ? new Date(formData.startTime).toLocaleString() : "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Venue:</span>
                <span>{formData.venue || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Price:</span>
                <span>{formData.ticketPrice === "0" ? "Free" : `${formData.currency} ${formData.ticketPrice}`}</span>
              </div>
              {formData.bookingStartTime && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Booking Opens:</span>
                  <span>{new Date(formData.bookingStartTime).toLocaleString()}</span>
                </div>
              )}
              {formData.bookingEndTime && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Booking Closes:</span>
                  <span>{new Date(formData.bookingEndTime).toLocaleString()}</span>
                </div>
              )}
              {(formData.earlyBirdEnabled || formData.memberDiscountEnabled || formData.groupDiscountEnabled) && (
                <div className="mt-3 pt-3 border-t">
                  <span className="font-medium block mb-2">Active Discounts:</span>
                  <div className="space-y-1 pl-2">
                    {formData.earlyBirdEnabled && formData.earlyBirdValue && (
                      <div className="flex items-center gap-2 text-green-700">
                        <Badge variant="outline" className="bg-green-100">
                          Early Bird: {formData.earlyBirdType === "percentage" ? `${formData.earlyBirdValue}%` : `₹${formData.earlyBirdValue}`} off
                          {formData.earlyBirdEndTime && ` until ${new Date(formData.earlyBirdEndTime).toLocaleDateString()}`}
                        </Badge>
                      </div>
                    )}
                    {formData.memberDiscountEnabled && formData.memberDiscountValue && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Badge variant="outline" className="bg-blue-100">
                          Member: {formData.memberDiscountType === "percentage" ? `${formData.memberDiscountValue}%` : `₹${formData.memberDiscountValue}`} off
                        </Badge>
                      </div>
                    )}
                    {formData.groupDiscountEnabled && formData.groupDiscountValue && (
                      <div className="flex items-center gap-2 text-purple-700">
                        <Badge variant="outline" className="bg-purple-100">
                          Group: {formData.groupDiscountType === "percentage" ? `${formData.groupDiscountValue}%` : `₹${formData.groupDiscountValue}`} off
                          {formData.groupDiscountMinQty && ` (min ${formData.groupDiscountMinQty} people)`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || hasErrors}>
                {loading ? "Saving..." : editEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
