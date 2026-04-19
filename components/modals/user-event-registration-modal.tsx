"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, ChevronDown, ChevronRight, Tag, CheckCircle, X, Percent, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface Attendee {
  phoneFull?: string
  name: string
  phone: string
  phoneCode?: string
  open?: boolean
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

interface UserEventRegistrationModalProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
  onRegister?: (payload: { eventId: string; attendees: Attendee[]; couponCode?: string }) => void
  ticketPrice?: number
  event?: any
}

export default function UserEventRegistrationModal({ eventId, isOpen, onClose, onRegister, ticketPrice = 0, event }: UserEventRegistrationModalProps) {
  const { user } = useAuth()
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', phone: '', phoneCode: '', open: true }])
  const [remainingSeats, setRemainingSeats] = useState<number | null>(null)

  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  
  const isMember = Boolean(
    user && (
      (user as any).membershipStatus === 'active' ||
      (user as any).memberships?.some((m: any) => m?.status === 'active')
    )
  )
  
  const calculateEarlyBirdDiscount = () => {
    if (!event?.earlyBirdDiscount?.enabled) return 0
    
    if (event.earlyBirdDiscount.membersOnly && !isMember) return 0
    
    const now = new Date()
    const startTime = new Date(event.earlyBirdDiscount.startTime)
    const endTime = new Date(event.earlyBirdDiscount.endTime)
    
    if (now >= startTime && now <= endTime) {
      return event.earlyBirdDiscount.type === 'percentage'
        ? (ticketPrice * event.earlyBirdDiscount.value) / 100
        : event.earlyBirdDiscount.value
    }
    
    return 0
  }
  
  const earlyBirdDiscountAmount = calculateEarlyBirdDiscount()
  
  const memberDiscountPerTicket = event?.memberDiscount?.enabled && isMember
    ? event.memberDiscount.type === 'percentage'
      ? (ticketPrice * event.memberDiscount.value) / 100
      : event.memberDiscount.value
    : 0
    
  const basePrice = ticketPrice
  const totalBasePrice = basePrice * ticketCount
  const totalMemberDiscountAmount = memberDiscountPerTicket * ticketCount
  
  const orderTotalBeforeCoupon = Math.max(totalBasePrice - earlyBirdDiscountAmount - totalMemberDiscountAmount, 0)

  useEffect(() => {
    if (isOpen && eventId) {
      apiClient.getPublicEventById(eventId).then(res => {
        if (res.success && res.data) {
          const { maxAttendees, currentAttendees } = res.data
          setRemainingSeats(maxAttendees != null ? Math.max(0, maxAttendees - (currentAttendees || 0)) : null)
        }
      }).catch(() => {
        if (event?.maxAttendees != null) {
          setRemainingSeats(Math.max(0, event.maxAttendees - (event.currentAttendees || 0)))
        }
      })
    }
    if (!isOpen) {
      setRemainingSeats(null)
    }
  }, [isOpen, eventId])

  useEffect(() => {
    setAttendees(prev => {
      const copy = [...prev]
      if (ticketCount > copy.length) {
        for (let i = copy.length; i < ticketCount; i++) copy.push({ name: '', phone: '', phoneCode: '', open: false })
      } else if (ticketCount < copy.length) {
        copy.length = ticketCount
      }
      if (copy[0]) copy[0].open = true

      if (isOpen && user && copy[0]) {
        try {
          const userName = (user as any).name || `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim()
          const userPhone = (user as any).phoneNumber || (user as any).phoneNumber || (user as any).phone || ''
          const userCode = (user as any).countryCode || ''
          if (!copy[0].name && userName) copy[0].name = userName
          if (!copy[0].phone && userPhone) copy[0].phone = userPhone
          if (!copy[0].phoneCode && userCode) copy[0].phoneCode = userCode
        } catch (e) {
        }
      }

      return copy
    })

    if (!isOpen) {
      setCouponCode("")
      setAppliedCoupon(null)
    }
  }, [ticketCount, isOpen, user])

  const updateAttendee = (index: number, field: 'name' | 'phone' | 'phoneCode', value: string) => {
    setAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const toggleOpen = (index: number) => {
    setAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], open: !copy[index].open }
      return copy
    })
  }

  const handleRegister = async () => {
    if (!eventId) return

    if (remainingSeats !== null && attendees.length > remainingSeats) {
      toast.error(remainingSeats === 0 ? "This event is now full" : `Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`)
      return
    }

    const phoneCodeRegex = /^\+?\d{1,4}$/
    const digitsOnly = (s: string) => (s || '').replace(/[^0-9]/g, '')

    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i]
      if (!a.name || !a.name.trim()) {
        toast.error(`Please enter a name for attendee ${i + 1}`)
        return
      }
      if (!a.phoneCode || !a.phoneCode.trim()) {
        toast.error(`Please enter a country code for attendee ${i + 1}`)
        return
      }
      if (!phoneCodeRegex.test(a.phoneCode.trim())) {
        toast.error(`Invalid country code for attendee ${i + 1}`)
        return
      }
      if (!a.phone || !a.phone.trim()) {
        toast.error(`Please enter a phone number for attendee ${i + 1}`)
        return
      }
      const p = digitsOnly(a.phone)
      if (p.length < 6 || p.length > 15) {
        toast.error(`Phone number for attendee ${i + 1} must be 6-15 digits`)
        return
      }
      const code = a.phoneCode.trim().startsWith('+') ? a.phoneCode.trim() : `+${a.phoneCode.trim()}`
      a.phoneFull = `${code}${p}`
    }

    const phoneNumbers = attendees.map(a => a.phoneFull)
    const uniquePhones = new Set(phoneNumbers)
    if (uniquePhones.size !== phoneNumbers.length) {
      const duplicate = phoneNumbers.find((p, i) => phoneNumbers.indexOf(p) !== i)
      const dupIndex = phoneNumbers.lastIndexOf(duplicate)
      toast.error(`Attendee ${dupIndex + 1} has the same phone number as another attendee`)
      return
    }

    let couponToApply = null
    if (appliedCoupon && orderTotalBeforeCoupon > 0) {
      if (!user) {
        couponToApply = appliedCoupon.code
      } else {
        try {
          const clubId = event?.clubId
          const applyResponse = await apiClient.applyCoupon(
            appliedCoupon.code,
            eventId,
            orderTotalBeforeCoupon,
            clubId
          )
          
          if (applyResponse.success) {
            couponToApply = appliedCoupon.code
          } else {
            toast.error(applyResponse.error || "Failed to apply coupon")
            return
          }
        } catch (error) {
          toast.error("Failed to apply coupon")
          return
        }
      }
    }

    onRegister && onRegister({ 
      eventId, 
      attendees: attendees.map(a => ({ name: a.name.trim(), phone: a.phoneFull || a.phone })),
      couponCode: couponToApply || undefined
    })
    onClose()
  }

  const handleValidateCoupon = async () => {
    if (!eventId || !couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }

    if (orderTotalBeforeCoupon <= 0) {
      toast.error("This event is free, coupons are not applicable")
      return
    }

    setValidatingCoupon(true)
    try {
      const clubId = event?.clubId
      const response = await apiClient.validateCoupon(
        couponCode.toUpperCase(),
        eventId,
        orderTotalBeforeCoupon,
        clubId
      )

      if (response.success && response.data?.coupon) {
        setAppliedCoupon(response.data.coupon)
        toast.success("Coupon applied successfully!")
      } else {
        setAppliedCoupon(null)
        toast.error(response.error || "Invalid coupon code")
      }
    } catch (error) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Register for Event</DialogTitle>
          <DialogDescription>
            Complete your registration details for this event
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
          {/* Early Bird Discount Banner */}
          {earlyBirdDiscountAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900 text-sm">
                    Early Bird Discount Applied!
                    {event?.earlyBirdDiscount?.membersOnly && " (Members Only)"}
                  </div>
                  <div className="text-xs text-green-700">
                    You're saving ₹{earlyBirdDiscountAmount.toLocaleString()} on your order
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Discount Banner */}
          {totalMemberDiscountAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900 text-sm">Member Discount Applied!</div>
                  <div className="text-xs text-blue-700">
                    You're saving ₹{memberDiscountPerTicket.toLocaleString()} per ticket as a club member
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-lg font-medium">{ticketCount}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (remainingSeats !== null && ticketCount >= remainingSeats) {
                    toast.error(remainingSeats === 0 ? "This event is now full" : `Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`)
                    return
                  }
                  setTicketCount(ticketCount + 1)
                }}
                disabled={remainingSeats !== null && ticketCount >= remainingSeats}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Number of tickets
              {remainingSeats !== null && (
                <span className={`ml-2 font-medium ${remainingSeats === 0 ? 'text-red-600' : remainingSeats <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  ({remainingSeats === 0 ? 'No seats left' : `${remainingSeats} left`})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {attendees.map((att, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleOpen(i)} className="p-1">
                      {att.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="font-medium">Attendee {i + 1}</div>
                    {i === 0 && <Badge variant="outline" className="ml-2">Primary</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground truncate max-w-[120px]">{att.name || 'No name yet'}</div>
                </div>
                {att.open && (
                  <div className="mt-3 space-y-2">
                    <Input placeholder={`Name for attendee ${i + 1}`} value={att.name} onChange={(e) => updateAttendee(i, 'name', e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder="+1" value={att.phoneCode || ''} onChange={(e) => updateAttendee(i, 'phoneCode', e.target.value)} className="w-20 flex-shrink-0" />
                      <Input placeholder={`Phone for attendee ${i + 1}`} value={att.phone} onChange={(e) => updateAttendee(i, 'phone', e.target.value)} className="flex-1 min-w-0" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Coupon Section */}
          {orderTotalBeforeCoupon > 0 && (
            <Card className="border-2 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4" />
                  Have a Coupon Code?
                </CardTitle>
                <CardDescription className="text-xs">
                  Apply a discount code to reduce your ticket price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={validatingCoupon}
                      className="font-mono text-sm flex-1 min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleValidateCoupon()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim() || validatingCoupon}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {validatingCoupon ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          <span className="hidden sm:inline">Validating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Apply</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-green-900">{appliedCoupon.name}</div>
                          <div className="text-xs text-green-700">
                            Code: <code className="font-mono font-semibold">{appliedCoupon.code}</code>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Price ({ticketCount} ticket{ticketCount > 1 ? 's' : ''})</span>
                        <span className="font-medium">₹{totalBasePrice.toLocaleString()}</span>
                      </div>

                      {earlyBirdDiscountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            Early Bird Discount
                          </span>
                          <span className="font-medium text-green-600">
                            -₹{earlyBirdDiscountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {memberDiscountPerTicket > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            Member Discount ({event.memberDiscount.type === 'percentage' ? `${event.memberDiscount.value}%` : `₹${event.memberDiscount.value}`})
                          </span>
                          <span className="font-medium text-blue-600">
                            -₹{totalMemberDiscountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-green-600 flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Coupon Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`})
                        </span>
                        <span className="font-medium text-green-600">
                          -₹{appliedCoupon.discount.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t flex justify-between">
                        <span className="font-semibold">Final Price</span>
                        <span className="font-bold text-base text-primary">
                          ₹{Math.max(orderTotalBeforeCoupon - appliedCoupon.discount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRegister}>Register</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}