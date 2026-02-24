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
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, couponCode, waitlistToken, onSuccess, onFailure }: EventCheckoutModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [showMemberValidation, setShowMemberValidation] = useState(false)
  const [memberValidated, setMemberValidated] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [redeemPoints, setRedeemPoints] = useState<number>(0)
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState<number>(0)
  const [reserving, setReserving] = useState(false)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)

    const reservePointsNow = async () => {
    if (!redeemPoints || redeemPoints <= 0) {
      toast.error('Enter points to redeem')
      return
    }
    if (!eventData?.clubId) {
      toast.error('Club information is missing for redemption')
      return
    }
    if (availablePoints !== null && redeemPoints > availablePoints) {
      toast.error('You do not have enough points')
      setReserving(false)
      return
    }
    setReserving(true)
    try {
        const res = await apiClient.createReservation(redeemPoints, eventData.clubId)
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
      // ignore
    }
    setReservationToken(null)
    setRedeemPoints(0)
    setReservedDiscount(0)
  }

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
        // ignore
      }
    }
    fetchPoints()
  }, [isOpen, user, eventData, event])

  const discountSource = eventData || event
  const isMember = Boolean(user && (user as any).membershipStatus === 'active')

  const getDiscountedPricePerTicket = (): number => {
    if (!event) return 0
    const ticketPrice = event.ticketPrice ?? event.price ?? 0
    if (!discountSource) return ticketPrice

    let price = ticketPrice

    if (discountSource.earlyBirdDiscount?.enabled) {
      const eb = discountSource.earlyBirdDiscount
      if (eb.membersOnly && !isMember) {
        // early bird is members-only and user is not a member
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

    setLoading(true)

    try {
      const basePrice = getDiscountedPricePerTicket()
      const totalBeforeCoupon = basePrice * attendees.length
      const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0)
      // apply reserved discount (if any)
      const adjustedFinalPrice = Math.max(finalPrice - (reservedDiscount || 0), 0)

      if (adjustedFinalPrice <= 0) {
        const response = user
          ? await apiClient.registerForEvent(String(event._id), undefined, attendees, couponCode, undefined, undefined, undefined, waitlistToken || undefined)
          : await apiClient.registerForPublicEvent(String(event._id), {
              registrantName: attendees?.[0]?.name || 'Guest',
              registrantPhone: attendees?.[0]?.phone || '',
              registrantEmail: `${(attendees?.[0]?.phone || '').replace(/[^0-9]/g, '')}@guest.rallyup.local`,
              attendees,
              couponCode,
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

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round((feeBreakdown ? feeBreakdown.finalAmount : finalPrice) - (reservedDiscount || 0)),
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
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed')
            }
            
            // confirm reservation before finalizing registration
            if (reservationToken) {
              try {
                await apiClient.confirmReservation(reservationToken, response.razorpay_order_id)
              } catch (e) {
                // non-fatal
              }
            }

            const registerResponse = user
              ? await apiClient.registerForEvent(
                  String(event._id),
                  undefined,
                  attendees,
                  couponCode,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  waitlistToken || undefined,
                  reservationToken || undefined,
                )
              : await apiClient.registerForPublicEvent(String(event._id), {
                  registrantName: attendees?.[0]?.name || 'Guest',
                  registrantPhone: attendees?.[0]?.phone || '',
                  registrantEmail: `${(attendees?.[0]?.phone || '').replace(/[^0-9]/g, '')}@guest.rallyup.local`,
                  attendees,
                  couponCode,
                  orderID: response.razorpay_order_id,
                  paymentID: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  reservationToken: reservationToken || undefined,
                })

            if (registerResponse.success) {
              toast.success("Payment successful! You are now registered for the event.")
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error("Payment successful but registration failed. Please contact support.")
            }
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.")
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phoneNumber || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
            toast.error("Payment cancelled")
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      
      razorpay.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment processing failed. Please try again.")
        setLoading(false)
        onFailure()
        onClose()
        router.push("/purchase/failure")
      })

      razorpay.open()
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const priceBeforeDiscount = event?.ticketPrice ?? event?.price ?? 0
  const basePrice = getDiscountedPricePerTicket()
  const totalBeforeCoupon = basePrice * attendees.length;
  const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0);
  const feeBreakdown = finalPrice > 0 ? calculateTransactionFees(finalPrice) : null;
  const amountToCharge = feeBreakdown ? feeBreakdown.finalAmount : finalPrice;
  const netSubtotal = Math.max(finalPrice - (reservedDiscount || 0), 0);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Event Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your payment for the event
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>{event?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
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
              
              <div className="flex justify-between items-center">
                <span>Number of tickets:</span>
                <span>{attendees.length}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal:</span>
                <span>
                  {(couponDiscount > 0 || reservedDiscount > 0) ? (
                    <>
                      <span className="line-through text-muted-foreground mr-2">{formatCurrency(totalBeforeCoupon, event.currency)}</span>
                      <span>{formatCurrency(netSubtotal, event.currency)}</span>
                    </>
                  ) : (
                    <span>{formatCurrency(totalBeforeCoupon, event.currency)}</span>
                  )}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>- Coupon discount:</span>
                  <span>-{formatCurrency(couponDiscount, event.currency)}</span>
                </div>
              )}

              {reservedDiscount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>- Points discount:</span>
                  <span>-{formatCurrency(reservedDiscount, event.currency)}</span>
                </div>
              )}
              
              {couponCode && couponDiscount > 0 && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Coupon ({couponCode})
                    </span>
                    <span>-{formatCurrency(couponDiscount, event.currency)}</span>
                  </div>
                  {couponName && (
                    <div className="text-xs text-muted-foreground">
                      {couponName}
                    </div>
                  )}
                  <Separator />
                </>
              )}

              {feeBreakdown && feeBreakdown.totalFees > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Platform fee ({PLATFORM_FEE_PERCENT}% + GST):</span>
                    <span>{formatCurrency(feeBreakdown.platformFee + feeBreakdown.platformFeeGst, event.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Payment gateway fee ({RAZORPAY_FEE_PERCENT}% + GST):</span>
                    <span>{formatCurrency(feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst, event.currency)}</span>
                  </div>
                  <Separator />
                </>
              )}
              
                <div className="space-y-2">
                <label className="text-sm font-medium">Redeem Points {availablePoints !== null && ` (Available: ${availablePoints} pts)`}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(Number(e.target.value))}
                    className="w-32 input input-bordered"
                    placeholder="Points"
                  />
                  <Button onClick={reservePointsNow} disabled={reserving || !!reservationToken} size="sm">{reserving ? 'Reserving...' : 'Reserve'}</Button>
                  <Button variant="ghost" onClick={clearReservation} disabled={reserving}>Clear</Button>
                </div>
                {reservationToken && (
                  <div className="text-sm text-green-600">
                    Reserved discount: {formatCurrency(reservedDiscount, event.currency)}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total to Pay:</span>
                <span className="text-primary">{formatCurrency(Math.max((feeBreakdown ? feeBreakdown.finalAmount : finalPrice) - (reservedDiscount || 0), 0), event.currency)}</span>
              </div>
            </div>
            
            <Separator className="my-4" />
            <div>
              <h4 className="text-sm font-medium mb-2">Attendees:</h4>
              <ul className="list-disc pl-5 text-sm">
                {attendees.map((attendee, index) => (
                  <li key={index}>{attendee.name} ({attendee.phone})</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          By completing payment, you agree to our{" "}
          <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline">
            Refund and Cancellation Policy
          </a>
          .
        </p>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : (
            "Pay Now"
          )}
        </Button>
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