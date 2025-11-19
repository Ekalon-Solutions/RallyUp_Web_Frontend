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
import { Calendar, Clock, MapPin, Users, Ticket, UserCheck, Bus, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface Event {
  _id: string
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
    bookingStartTime: "",
    bookingEndTime: "",
  })

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      setErrors({}) // Clear errors when modal opens
      if (editEvent) {
        setFormData({
          title: editEvent.title,
          category: editEvent.category,
          startTime: editEvent.startTime.slice(0, 16), // Format for datetime-local input
          endTime: editEvent.endTime ? editEvent.endTime.slice(0, 16) : "",
          venue: editEvent.venue,
          description: editEvent.description,
          maxAttendees: editEvent.maxAttendees?.toString() || "",
          ticketPrice: editEvent.ticketPrice.toString(),
          requiresTicket: editEvent.requiresTicket,
          memberOnly: editEvent.memberOnly,
          bookingStartTime: editEvent.bookingStartTime?.slice(0, 16) || "",
          bookingEndTime: editEvent.bookingEndTime?.slice(0, 16) || "",
        })
      } else {
        // Set default values for new event
        const now = new Date()
        const defaultStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
        const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours

        setFormData({
          title: "",
          category: "match-screening",
          startTime: defaultStartTime.toISOString().slice(0, 16),
          endTime: defaultEndTime.toISOString().slice(0, 16),
          venue: "",
          description: "",
          maxAttendees: "",
          ticketPrice: "0",
          requiresTicket: false,
          memberOnly: false,
          bookingStartTime: "",
          bookingEndTime: "",
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
        bookingStartTime: formData.bookingStartTime || undefined,
        bookingEndTime: formData.bookingEndTime || undefined,
      }

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
      console.error("Error saving event:", error)

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
    setFormData({
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
      bookingStartTime: "",
      bookingEndTime: "",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editEvent ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            {editEvent ? "Update event details" : "Create a new event for your supporter group"}
          </DialogDescription>
        </DialogHeader>

        {/* Error Summary */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter event title (e.g., 'Match Screening vs. XYZ FC')"
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
                  className={errors.title ? "border-red-500" : ""}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
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
                <Label htmlFor="venue">
                  Venue <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="venue"
                  placeholder="Enter venue location (e.g., 'The Fan Zone, Mumbai' or 'Online via Zoom')"
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
                  className={errors.venue ? "border-red-500" : ""}
                />
                {errors.venue && (
                  <p className="text-red-500 text-sm">{errors.venue}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">
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
                  className={errors.startTime ? "border-red-500" : ""}
                  required
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (Optional)</Label>
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
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm">{errors.endTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Event description (e.g., 'Join us for a thrilling match screening...')"
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
                  className={errors.description ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>
            </div>
          </div>

          {/* Event Settings */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees (Optional)</Label>
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
                  className={errors.maxAttendees ? "border-red-500" : ""}
                  min="1"
                />
                {errors.maxAttendees && (
                  <p className="text-red-500 text-sm">{errors.maxAttendees}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Ticket Price (₹)</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  placeholder="0 for free (e.g., 250)"
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
                  className={errors.ticketPrice ? "border-red-500" : ""}
                  min="0"
                  step="10"
                />
                {errors.ticketPrice && (
                  <p className="text-red-500 text-sm">{errors.ticketPrice}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requiresTicket">Requires Ticket</Label>
                  <p className="text-sm text-muted-foreground">Members need to book tickets</p>
                </div>
                <Switch
                  id="requiresTicket"
                  checked={formData.requiresTicket}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresTicket: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memberOnly">Members Only</Label>
                  <p className="text-sm text-muted-foreground">Only club members can attend</p>
                </div>
                <Switch
                  id="memberOnly"
                  checked={formData.memberOnly}
                  onCheckedChange={(checked) => setFormData({ ...formData, memberOnly: checked })}
                />
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingStartTime">Booking Start Time</Label>
                <Input
                  id="bookingStartTime"
                  type="datetime-local"
                  value={formData.bookingStartTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bookingStartTime: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingEndTime">Booking End Time</Label>
                <Input
                  id="bookingEndTime"
                  type="datetime-local"
                  value={formData.bookingEndTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bookingEndTime: e.target.value }))
                  }
                />
              </div>
            </div>
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
                <span>{formData.ticketPrice === "0" ? "Free" : `₹${formData.ticketPrice}`}</span>
              </div>
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
