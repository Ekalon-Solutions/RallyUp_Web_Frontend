"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard, Loader2,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from "@/lib/transactionFees"
import { MemberValidationModal } from "./member-validation-modal"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface EventCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  event?: {
    _id?: string
    name: string
    price: number
  clubId?: string
    ticketPrice?: number
    earlyBirdDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
      startTime?: string
      endTime?: string
      membersOnly?: boolean
    }
    memberDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
    }
    groupDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
      minQuantity?: number
    }
    currency?: string
  }
  attendees: Array<{ name: string; phone: string }>
  couponCode?: string
  waitlistToken?: string | null
  onSuccess: () => void
  onFailure: () => void
  /** Skip the in-modal MemberValidationModal — use when the caller already confirmed non-member intent */
  skipMemberValidation?: boolean
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, couponCode, waitlistToken, onSuccess, onFailure, skipMemberValidation }: EventCheckoutModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [razorpayOpen, setRazorpayOpen] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [showMemberValidation, setShowMemberValidation] = useState(false)
  const [memberValidated, setMemberValidated] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [redeemPoints, setRedeemPoints] = useState<number | string>("")
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState<number>(0)
  const [reserving, setReserving] = useState(false)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [guestEmail, setGuestEmail] = useState("")
  const [guestEmailError, setGuestEmailError] = useState("")

    const reservePointsNow = async () => {
    if (!redeemPoints || Number(redeemPoints) <= 0) {
      toast.error('Enter points to redeem')
      return
    }
    if (!eventData?.clubId) {
      toast.error('Club information is missing for redemption')
      return
    }
    if (availablePoints !== null && Number(redeemPoints) > availablePoints) {
      toast.error('You do not have enough points')
      setReserving(false)
      return
    }
    setReserving(true)
    try {
      // pass order total so backend can cap reserved points to order value
      const basePrice = getDiscountedPricePerTicket()
      const totalBeforeCoupon = basePrice * attendees.length
      const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0)
      const orderTotalForReservation = finalPrice
      const redeemPointsNum = Number(redeemPoints) || 0
      const res = await apiClient.createReservation(redeemPointsNum, eventData.clubId, orderTotalForReservation)
        if (res && res.success) {
          setReservationToken(res.data?.reservationToken || null)
          setReservedDiscount(res.data?.discountAmount || 0)
          toast.success('Points reserved')
        } else {
          toast.error(res?.message || 'Failed to reserve points')
        }
    } catch (e) {
      toast.error('Failed to reserve points')
    } finally {
      setReserving(false)
    }
  }

  const clearReservation = async () => {
    if (!reservationToken) {
      setRedeemPoints(0)
      setReservedDiscount(0)
      return
    }
    try {
      await apiClient.cancelReservation(reservationToken)
    } catch (e) {
    }
    setReservationToken(null)
    setRedeemPoints("")
    setReservedDiscount(0)
  }

  useEffect(() => {
    if (isOpen) {
      setMemberValidated(Boolean(skipMemberValidation))
    }
  }, [isOpen, skipMemberValidation])

  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => {
        toast.error("Failed to load payment system. Please refresh the page.")
      }
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [isOpen, scriptLoaded])

  useEffect(() => {
    const fetchEventData = async () => {
      if (event?._id && isOpen && !eventData) {
        try {
          const response = await apiClient.getPublicEventById(String(event._id))
          if (response.success && response.data) {
            setEventData(response.data)
          }
        } catch (error) {
          console.error("Error fetching event data:", error)
        }
      }
    }
    fetchEventData()
  }, [event?._id, isOpen, eventData])

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        if (isOpen && user && (eventData?.clubId || event?.clubId)) {
          const clubId = eventData?.clubId || (event as any)?.clubId
          const resp = await apiClient.getMemberPoints((user as any)._id, clubId)
          if (resp && resp.success && resp.data) {
            setAvailablePoints(resp.data.points || 0)
          }
        }
      } catch (e) {
      }
    }
    fetchPoints()
  }, [isOpen, user, eventData, event])

  const discountSource = eventData || event
  const isMember = Boolean(
    user && (
      (user as any).membershipStatus === 'active' ||
      (user as any).memberships?.some((m: any) => m?.status === 'active')
    )
  )

  const getDiscountedPricePerTicket = (): number => {
    if (!event) return 0
    const ticketPrice = event.ticketPrice ?? event.price ?? 0
    if (!discountSource) return ticketPrice

    let price = ticketPrice

    if (discountSource.earlyBirdDiscount?.enabled) {
      const eb = discountSource.earlyBirdDiscount
      if (eb.membersOnly && !isMember) {
      } else {
        const now = new Date()
        const startTime = new Date(eb.startTime ?? 0)
        const endTime = new Date(eb.endTime ?? 0)
        if (now >= startTime && now <= endTime) {
          const discount =
            eb.type === 'percentage' ? (price * (eb.value ?? 0)) / 100 : (eb.value ?? 0)
          price = Math.max(price - discount, 0)
        }
      }
    }

    if (discountSource.memberDiscount?.enabled && isMember) {
      const md = discountSource.memberDiscount
      const discount =
        md.type === 'percentage' ? (price * (md.value ?? 0)) / 100 : (md.value ?? 0)
      price = Math.max(price - discount, 0)
    }

    if (
      discountSource.groupDiscount?.enabled &&
      attendees.length >= (discountSource.groupDiscount.minQuantity ?? 2)
    ) {
      const gd = discountSource.groupDiscount
      const discount =
        gd.type === 'percentage' ? (price * (gd.value ?? 0)) / 100 : (gd.value ?? 0)
      price = Math.max(price - discount, 0)
    }

    return price
  }

  const getDiscountBreakdown = () => {
    const ticketPrice = event?.ticketPrice ?? event?.price ?? 0
    if (!discountSource) return { earlyBirdAmt: 0, memberAmt: 0, groupAmt: 0 }

    let price = ticketPrice
    let earlyBirdAmt = 0
    let memberAmt = 0
    let groupAmt = 0

    if (discountSource.earlyBirdDiscount?.enabled) {
      const eb = discountSource.earlyBirdDiscount
      if (!eb.membersOnly || isMember) {
        const now = new Date()
        const startTime = new Date(eb.startTime ?? 0)
        const endTime = new Date(eb.endTime ?? 0)
        if (now >= startTime && now <= endTime) {
          earlyBirdAmt = eb.type === 'percentage' ? (price * (eb.value ?? 0)) / 100 : (eb.value ?? 0)
          price = Math.max(price - earlyBirdAmt, 0)
        }
      }
    }

    if (discountSource.memberDiscount?.enabled && isMember) {
      const md = discountSource.memberDiscount
      memberAmt = md.type === 'percentage' ? (price * (md.value ?? 0)) / 100 : (md.value ?? 0)
      price = Math.max(price - memberAmt, 0)
    }

    if (discountSource.groupDiscount?.enabled && attendees.length >= (discountSource.groupDiscount.minQuantity ?? 2)) {
      const gd = discountSource.groupDiscount
      groupAmt = gd.type === 'percentage' ? (price * (gd.value ?? 0)) / 100 : (gd.value ?? 0)
    }

    return { earlyBirdAmt, memberAmt, groupAmt }
  }

  useEffect(() => {
    const validateCoupon = async () => {
      if (couponCode && event?._id && isOpen) {
        try {
          const totalPrice = getDiscountedPricePerTicket() * attendees.length
          const clubId = eventData?.clubId || (event as any)?.clubId
          const response = await apiClient.validateCoupon(couponCode, String(event._id), totalPrice, clubId)
          
          if (response.success && response.data?.coupon) {
            setCouponDiscount(response.data.coupon.discount * attendees.length)
            setCouponName(response.data.coupon.name)
          } else {
            setCouponDiscount(0)
            setCouponName("")
          }
        } catch (error) {
          setCouponDiscount(0)
          setCouponName("")
        }
      } else {
        setCouponDiscount(0)
        setCouponName("")
      }
    }
    
    validateCoupon()
  }, [couponCode, event?._id, attendees.length, isOpen, eventData])

  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast.error("Payment system is still loading. Please wait.")
      return
    }

    if (!event?._id) {
      toast.error("Event information is missing")
      return
    }

    if (!user && !memberValidated) {
      setShowMemberValidation(true)
      return
    }

    if (!user) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!guestEmail.trim()) {
        setGuestEmailError("Email is required")
        return
      }
      if (!emailRegex.test(guestEmail.trim())) {
        setGuestEmailError("Enter a valid email address")
        return
      }
      setGuestEmailError("")
    }

    setLoading(true)

    try {
      const basePrice = getDiscountedPricePerTicket()
      const totalBeforeCoupon = basePrice * attendees.length

      const eventSubtotalAfterCoupon = Math.max(totalBeforeCoupon - couponDiscount, 0)
      const displayShipping = 0
      const displayTax = 0
      const adjustedFinalPrice = Math.max(eventSubtotalAfterCoupon + displayShipping + displayTax - (reservedDiscount || 0), 0)

      const { earlyBirdAmt } = getDiscountBreakdown()

      if (adjustedFinalPrice <= 0) {
        if (reservationToken) {
          try {
            await apiClient.confirmReservation(reservationToken)
          } catch (e) {}
        }

        const response = user
          ? await apiClient.registerForEvent(
              String(event._id),
              undefined,
              attendees,
              couponCode,
              undefined,
              undefined,
              undefined,
              waitlistToken || undefined,
              reservationToken || undefined,
              0,
              couponDiscount || undefined,
              earlyBirdAmt || undefined,
              reservedDiscount || undefined,
            )
          : await apiClient.registerForPublicEvent(String(event._id), {
              registrantName: attendees?.[0]?.name || 'Guest',
              registrantPhone: attendees?.[0]?.phone || '',
              registrantEmail: guestEmail.trim(),
              attendees,
              couponCode,
              reservationToken: reservationToken || undefined,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: earlyBirdAmt || undefined,
              pointsDiscount: reservedDiscount || undefined,
            })

        if (response.success) {
          toast.success("Successfully registered for event!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          onFailure()
          router.push("/purchase/failure")
        }
        setLoading(false)
        return
      }

      // Recompute payment amount including shipping and tax (reuse `eventSubtotalAfterCoupon` from above)
      const paymentSubtotal = eventSubtotalAfterCoupon
      const paymentShipping = displayShipping
      const paymentTax = displayTax
      const paymentNet = Math.max(paymentSubtotal + paymentShipping + paymentTax - (reservedDiscount || 0), 0)
      const paymentFeeBreakdown = paymentNet > 0 ? calculateTransactionFees(paymentNet) : null
      const amountToCharge = paymentFeeBreakdown ? paymentFeeBreakdown.finalAmount : paymentNet

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency || 'INR',
          orderId: `EVT-${Date.now()}`,
          orderNumber: `EVT-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment order')
      }

      const { razorpayOrderId, amount, currency: orderCurrency } = await response.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: orderCurrency,
        name: 'RallyUp',
        description: `Payment for ${event.name} - ${attendees.length} ticket(s)`,
        order_id: razorpayOrderId,
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true,
          paylater: true,
          cardless_emi: true,
          emi: true,
          bank_transfer: true,
        },
        handler: async function (response: any) {
          const paymentId: string = response.razorpay_payment_id
          const orderId: string = response.razorpay_order_id
          const signature: string = response.razorpay_signature

          try {
            // Verify the payment signature. If the verify endpoint itself fails (network
            // issues, server error) we still proceed with registration because Razorpay
            // already confirmed the payment by invoking this handler. The backend
            // `registerForEvent` endpoint re-validates the signature server-side.
            try {
              const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: paymentId,
                  razorpay_signature: signature,
                  orderId: `event_${event._id}_${Date.now()}`,
                }),
              })
              if (!verifyResponse.ok) {
                // Log but don't block — backend will re-verify
                console.error('Frontend signature check returned non-OK; proceeding with registration')
              }
            } catch (verifyNetworkError) {
              // Verify request itself failed (network). Still attempt registration.
              console.error('Verify request failed:', verifyNetworkError)
            }

            if (reservationToken) {
              try {
                await apiClient.confirmReservation(reservationToken, orderId)
              } catch (e) {
              }
            }

            const amountCharged = amountToCharge
            const registerResponse = user
              ? await apiClient.registerForEvent(
                  String(event._id),
                  undefined,
                  attendees,
                  couponCode,
                  orderId,
                  paymentId,
                  signature,
                  waitlistToken || undefined,
                  reservationToken || undefined,
                  amountCharged,
                  couponDiscount || undefined,
                  earlyBirdAmt || undefined,
                  reservedDiscount || undefined,
                )
              : await apiClient.registerForPublicEvent(String(event._id), {
                  registrantName: attendees?.[0]?.name || 'Guest',
                  registrantPhone: attendees?.[0]?.phone || '',
                  registrantEmail: guestEmail.trim(),
                  attendees,
                  couponCode,
                  orderID: orderId,
                  paymentID: paymentId,
                  signature,
                  reservationToken: reservationToken || undefined,
                  amountPaid: amountCharged,
                  couponDiscount: couponDiscount || undefined,
                  earlyBirdDiscountAmt: earlyBirdAmt || undefined,
                  pointsDiscount: reservedDiscount || undefined,
                })

            if (registerResponse.success) {
              toast.success("Payment successful! You are now registered for the event.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              // Payment went through but our backend rejected registration.
              // Surface the payment ID so the user can follow up.
              toast.error(
                `Payment received (ID: ${paymentId}) but registration failed — ${registerResponse.error || 'please contact support with your payment ID.'}`
              )
              setRazorpayOpen(false)
            }
          } catch (error) {
            // Unexpected error after payment. Show payment ID so user isn't stuck.
            toast.error(
              `Something went wrong after payment (ID: ${paymentId}). Please contact support with your payment ID.`
            )
            setRazorpayOpen(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user?.name || attendees?.[0]?.name || '',
          email: user?.email || guestEmail.trim() || '',
          contact: user?.phoneNumber || attendees?.[0]?.phone || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          }
        }
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment processing failed. Please try again.")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        onClose()
        router.push("/purchase/failure")
      })

      setRazorpayOpen(true)
      razorpay.open()
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const priceBeforeDiscount = event?.ticketPrice ?? event?.price ?? 0
  const basePrice = getDiscountedPricePerTicket()
  const { earlyBirdAmt, memberAmt, groupAmt } = getDiscountBreakdown()
  const totalBeforeCoupon = basePrice * attendees.length;
  const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0);
  const netSubtotal = Math.max(finalPrice - (reservedDiscount || 0), 0);
  // Fees are calculated on the final net amount (after all discounts)
  const feeBreakdown = netSubtotal > 0 ? calculateTransactionFees(netSubtotal) : null;
  const amountToCharge = feeBreakdown ? feeBreakdown.finalAmount : netSubtotal;

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'CA$',
    JPY: '¥',
    CNY: '¥',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    TRY: '₺',
    DKK: 'kr',
    ILS: '₪',
    PLN: 'zł'
  }

  const formatCurrency = (amount: number, cur?: string) => {
    const c = cur || event?.currency || 'INR'
    const symbol = currencySymbols[c] || (c + ' ')
    return `${symbol}${Number(amount || 0).toLocaleString()}`
  }

  if (!event) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!razorpayOpen) onClose() }} modal={!razorpayOpen}>
      <DialogContent
        className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6"
        onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Event Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your payment for the event
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{event?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span>Price per ticket:</span>
                  <span className="flex items-center gap-2">
                    {priceBeforeDiscount > basePrice ? (
                      <>
                        <span className="line-through text-muted-foreground">
                          {formatCurrency(priceBeforeDiscount, event.currency)}
                        </span>
                        <span>{formatCurrency(basePrice, event.currency)}</span>
                      </>
                    ) : (
                      <span>{formatCurrency(basePrice, event.currency)}</span>
                    )}
                  </span>
                </div>

                {earlyBirdAmt > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-green-600">
                    <span>Early bird discount (per ticket):</span>
                    <span>-{formatCurrency(earlyBirdAmt, event.currency)}</span>
                  </div>
                )}
                {memberAmt > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-blue-600">
                    <span>Member discount (per ticket):</span>
                    <span>-{formatCurrency(memberAmt, event.currency)}</span>
                  </div>
                )}
                {groupAmt > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-purple-600">
                    <span>Group discount (per ticket):</span>
                    <span>-{formatCurrency(groupAmt, event.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span>Number of tickets:</span>
                  <span>{attendees.length}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-medium text-sm sm:text-base">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totalBeforeCoupon, event.currency)}</span>
                </div>

                {couponCode && couponDiscount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-green-600 text-sm">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Coupon ({couponCode}){couponName ? ` — ${couponName}` : ''}
                      </span>
                      <span>-{formatCurrency(couponDiscount, event.currency)}</span>
                    </div>
                    <Separator />
                  </>
                )}

                {reservedDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Points discount:</span>
                    <span>-{formatCurrency(reservedDiscount, event.currency)}</span>
                  </div>
                )}

                {feeBreakdown && feeBreakdown.totalFees > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                      <span>Platform fee ({PLATFORM_FEE_PERCENT}% + GST):</span>
                      <span>{formatCurrency(feeBreakdown.platformFee + feeBreakdown.platformFeeGst, event.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                      <span>Payment gateway fee ({RAZORPAY_FEE_PERCENT}% + GST):</span>
                      <span>{formatCurrency(feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst, event.currency)}</span>
                    </div>
                    <Separator />
                  </>
                )}
                
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Redeem Points {availablePoints !== null && ` (Available: ${availablePoints} pts)`}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      min={0}
                      max={availablePoints || undefined}
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full sm:w-32 flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Points"
                      disabled={!!reservationToken || reserving}
                    />
                    <div className="flex gap-2">
                      {reservationToken ? (
                        <Button disabled size="sm" variant="outline" className="flex-1 sm:flex-none border-green-500 text-green-600 opacity-100">
                          Applied
                        </Button>
                      ) : (
                        <Button 
                          onClick={reservePointsNow} 
                          disabled={reserving || !redeemPoints || Number(redeemPoints) <= 0} 
                          size="sm" 
                          className="flex-1 sm:flex-none"
                        >
                          {reserving ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Reserving...
                            </div>
                          ) : 'Reserve'}
                        </Button>
                      )}
                      
                      {(redeemPoints !== "" || reservationToken) && (
                        <Button 
                          variant="ghost" 
                          onClick={clearReservation} 
                          disabled={reserving} 
                          size="sm" 
                          className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  {reservationToken && (
                    <div className="text-sm text-green-600">
                      Reserved discount: {formatCurrency(reservedDiscount, event.currency)}
                    </div>
                  )}
                </div>

              </div>
              
              {!user && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value)
                        if (guestEmailError) setGuestEmailError("")
                      }}
                      placeholder="Enter your email"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {guestEmailError && (
                      <p className="text-xs text-destructive">{guestEmailError}</p>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium mb-2">Attendees:</h4>
                <ul className="list-disc pl-5 text-sm max-h-32 overflow-y-auto">
                  {attendees.map((attendee, index) => (
                    <li key={index}>{attendee.name} ({attendee.phone})</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4 pb-2">
            By completing payment, you agree to our{" "}
            <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline">
              Refund and Cancellation Policy
            </a>
            .
          </p>
        </div>

        <div className="flex-shrink-0 pt-4 pb-2 sm:pb-0 mt-4 border-t bg-background shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="flex justify-between items-center font-bold text-lg px-1 mb-3">
            <span>Total to Pay:</span>
            <span className="text-primary">{formatCurrency(amountToCharge, event.currency)}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              "Pay Now"
            )}
          </Button>
        </div>
      </DialogContent>

      {eventData?.clubId && (
        <MemberValidationModal
          isOpen={showMemberValidation}
          onClose={() => setShowMemberValidation(false)}
          clubId={eventData.clubId}
          onMemberFound={() => {
            router.push('/login')
            onClose()
          }}
          onNonMemberContinue={() => {
            setMemberValidated(true)
            setShowMemberValidation(false)
          }}
          onBecomeMember={() => {
            router.push(`/membership-plans?clubId=${eventData.clubId}`)
            onClose()
          }}
        />
      )}
    </Dialog>
  )
}