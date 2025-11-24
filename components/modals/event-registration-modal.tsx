"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Users, Ticket, UserCheck, Bus, CheckCircle, XCircle, Plus, X, UserPlus, AlertCircle, Tag, Percent, Loader2 } from "lucide-react"
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

interface Attendee {
  name: string
  phone: string
}

interface AppliedCoupon {
  code: string
  name: string
  discountType: 'flat' | 'percentage'
  discountValue: number
  discount: number
  originalPrice: number
  finalPrice: number
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
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: "", phone: "" }])
  const [errors, setErrors] = useState<Record<number, { name?: string; phone?: string }>>({})
  
  // Coupon states
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !isRegistered) {
      setNotes("")
      setAttendees([{ name: "", phone: "" }])
      setErrors({})
      setShowCancelConfirm(false)
      setCouponCode("")
      setAppliedCoupon(null)
    }
  }, [isOpen, isRegistered])

  if (!event) return null

  const validateAttendees = (): boolean => {
    const newErrors: Record<number, { name?: string; phone?: string }> = {}
    let hasError = false

    attendees.forEach((attendee, index) => {
      const attendeeErrors: { name?: string; phone?: string } = {}

      // Validate name
      if (!attendee.name.trim()) {
        attendeeErrors.name = "Name is required"
        hasError = true
      } else if (attendee.name.trim().length < 2) {
        attendeeErrors.name = "Name must be at least 2 characters"
        hasError = true
      }

      // Validate phone
      if (!attendee.phone.trim()) {
        attendeeErrors.phone = "Phone is required"
        hasError = true
      } else {
        // Remove all non-digit characters for validation
        const phoneDigits = attendee.phone.replace(/[^0-9]/g, '')
        if (phoneDigits.length < 10) {
          attendeeErrors.phone = "Phone must be at least 10 digits"
          hasError = true
        }
      }

      if (Object.keys(attendeeErrors).length > 0) {
        newErrors[index] = attendeeErrors
      }
    })

    // Check for duplicate phone numbers
    const phoneNumbers = attendees.map(a => a.phone.replace(/[^0-9]/g, ''))
    const uniquePhones = new Set(phoneNumbers)
    if (phoneNumbers.length !== uniquePhones.size) {
      toast.error("Each attendee must have a unique phone number")
      hasError = true
    }

    setErrors(newErrors)
    return !hasError
  }

  const handleRegister = async () => {
    if (!event) return

    // Validate attendees before submission
    if (!validateAttendees()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
      // First, apply the coupon if one is being used
      let couponToApply = null
      if (appliedCoupon && event.ticketPrice > 0) {
        const applyResponse = await apiClient.applyCoupon(
          appliedCoupon.code,
          event._id,
          event.ticketPrice * attendees.length
        )
        
        if (applyResponse.success) {
          couponToApply = appliedCoupon.code
        } else {
          toast.error(applyResponse.error || "Failed to apply coupon")
          setLoading(false)
          return
        }
      }

      const response = await apiClient.registerForEvent(
        event._id, 
        notes, 
        attendees,
        couponToApply
      )
      
      if (response.success) {
        toast.success(
          appliedCoupon 
            ? `Successfully registered! You saved ₹${appliedCoupon.discount * attendees.length}` 
            : "Successfully registered for event!"
        )
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

  const handleValidateCoupon = async () => {
    if (!event || !couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }

    if (event.ticketPrice <= 0) {
      toast.error("This event is free, coupons are not applicable")
      return
    }

    setValidatingCoupon(true)
    try {
      const totalPrice = event.ticketPrice * attendees.length
      const response = await apiClient.validateCoupon(
        couponCode.toUpperCase(),
        event._id,
        totalPrice
      )

      if (response.success && response.data?.coupon) {
        setAppliedCoupon(response.data.coupon)
        toast.success("Coupon applied successfully!")
      } else {
        setAppliedCoupon(null)
        toast.error(response.error || "Invalid coupon code")
      }
    } catch (error) {
      console.error("Error validating coupon:", error)
      setAppliedCoupon(null)
      toast.error("Failed to validate coupon")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast.info("Coupon removed")
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
      setShowCancelConfirm(false)
    }
  }

  const addAttendee = () => {
    if (attendees.length < 10) { // Limit to 10 attendees
      setAttendees([...attendees, { name: "", phone: "" }])
    } else {
      toast.error("Maximum 10 attendees allowed per registration")
    }
  }

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      const newAttendees = attendees.filter((_, i) => i !== index)
      setAttendees(newAttendees)
      
      // Remove errors for this index
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    } else {
      toast.error("At least one attendee is required")
    }
  }

  const updateAttendee = (index: number, field: 'name' | 'phone', value: string) => {
    const newAttendees = [...attendees]
    newAttendees[index][field] = value
    setAttendees(newAttendees)

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors }
      if (newErrors[index]) {
        delete newErrors[index][field]
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index]
        }
      }
      setErrors(newErrors)
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

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(event.category)}>
                      {getCategoryIcon(event.category)} {event.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {event.memberOnly && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Members Only
                      </Badge>
                    )}
                    {event.requiresTicket && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Ticket className="w-3 h-3 mr-1" />
                        Ticket Required
                      </Badge>
                    )}
                  </div>
                </div>
                {isRegistered && (
                  <Badge className={
                    registrationStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                    registrationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {registrationStatus === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {registrationStatus === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                    {registrationStatus?.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium">Start Time</div>
                    <div className="text-muted-foreground">{formatDate(event.startTime)}</div>
                  </div>
                </div>
                {event.endTime && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">End Time</div>
                      <div className="text-muted-foreground">{formatDate(event.endTime)}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium">Venue</div>
                    <div className="text-muted-foreground">{event.venue}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium">Capacity</div>
                    <div className="text-muted-foreground">
                      {event.currentAttendees} / {event.maxAttendees || '∞'} attendees
                    </div>
                  </div>
                </div>
                {event.ticketPrice > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Ticket className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">Ticket Price</div>
                      <div className="text-muted-foreground">₹{event.ticketPrice}</div>
                    </div>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="pt-4 border-t">
                  <div className="font-medium mb-2">About this event</div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Status Warning */}
          {isEventFull && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <div className="font-medium">Event is Full</div>
                    <div>This event has reached maximum capacity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!event.isActive && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <div className="font-medium">Event is Inactive</div>
                    <div>This event is not currently accepting registrations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration Form */}
          {!isRegistered && canRegister && (
            <>
              {/* Error Summary */}
              {hasErrors && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-800 mb-2">Please fix the following errors:</div>
                        <ul className="text-sm text-red-700 space-y-1">
                          {Object.entries(errors).map(([index, fieldErrors]) => (
                            <div key={index}>
                              {Object.entries(fieldErrors).map(([field, error]) => (
                                <li key={`${index}-${field}`}>• Attendee {parseInt(index) + 1}: {error}</li>
                              ))}
                            </div>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Attendee Information
                  </CardTitle>
                  <CardDescription>
                    Add attendees who will be participating in this event (Maximum 10)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-semibold">Attendee {index + 1}</Label>
                          {attendees.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttendee(index)}
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>
                              Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`name-${index}`}
                              placeholder="Enter full name"
                              value={attendee.name}
                              onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                              className={errors[index]?.name ? "border-red-500" : ""}
                            />
                            {errors[index]?.name && (
                              <p className="text-red-500 text-sm">{errors[index].name}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`phone-${index}`}>
                              Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`phone-${index}`}
                              type="tel"
                              placeholder="+91 1234567890"
                              value={attendee.phone}
                              onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                              className={errors[index]?.phone ? "border-red-500" : ""}
                            />
                            {errors[index]?.phone && (
                              <p className="text-red-500 text-sm">{errors[index].phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {attendees.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAttendee}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Attendee
                    </Button>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or notes (e.g., dietary restrictions, accessibility needs)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  These notes will be visible to event organizers
                </p>
              </div>

              {/* Coupon Section */}
              {event.ticketPrice > 0 && (
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="w-4 h-4" />
                      Have a Coupon Code?
                    </CardTitle>
                    <CardDescription>
                      Apply a discount code to reduce your ticket price
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={validatingCoupon}
                            className="font-mono"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleValidateCoupon()
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleValidateCoupon}
                          disabled={!couponCode.trim() || validatingCoupon}
                          variant="outline"
                        >
                          {validatingCoupon ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Apply
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="font-medium text-green-900">{appliedCoupon.name}</div>
                              <div className="text-sm text-green-700">
                                Code: <code className="font-mono font-semibold">{appliedCoupon.code}</code>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original Price ({attendees.length} ticket{attendees.length > 1 ? 's' : ''})</span>
                            <span className="font-medium">₹{(event.ticketPrice * attendees.length).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`})
                            </span>
                            <span className="font-medium text-green-600">
                              -₹{(appliedCoupon.discount * attendees.length).toLocaleString()}
                            </span>
                          </div>
                          <div className="pt-2 border-t flex justify-between">
                            <span className="font-semibold">Final Price</span>
                            <span className="font-bold text-lg text-primary">
                              ₹{((event.ticketPrice - appliedCoupon.discount) * attendees.length).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-800">Confirm Cancellation</div>
                      <p className="text-sm text-red-700 mt-1">
                        Are you sure you want to cancel your registration? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={loading}
                    >
                      No, Keep Registration
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelRegistration}
                      disabled={loading}
                    >
                      {loading ? "Cancelling..." : "Yes, Cancel Registration"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isRegistered && canCancel && !showCancelConfirm && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelConfirm(true)}
              className="sm:mr-auto"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Registration
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {isRegistered ? "Close" : "Cancel"}
          </Button>
          
          {!isRegistered && canRegister && (
            <Button onClick={handleRegister} disabled={loading || hasErrors}>
              {loading ? "Registering..." : "Register for Event"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
