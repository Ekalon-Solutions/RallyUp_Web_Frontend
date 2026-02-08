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
    ticketPrice?: number
    earlyBirdDiscount?: any
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
    const validateCoupon = async () => {
      if (couponCode && event?._id && isOpen) {
        try {
          const ticketPrice = event.ticketPrice || event.price
          const totalPrice = ticketPrice * attendees.length
          const response = await apiClient.validateCoupon(couponCode, String(event._id), totalPrice)
          
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
  }, [couponCode, event?._id, attendees.length, isOpen])

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
      const basePrice = calculateDiscountedPrice()
      const totalBeforeCoupon = basePrice * attendees.length
      const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0)

      if (finalPrice <= 0) {
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
        } else {
          onFailure()
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
          amount: finalPrice,
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
                })

            if (registerResponse.success) {
              toast.success("Payment successful! You are now registered for the event.")
              onSuccess()
              onClose()
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
      })

      razorpay.open()
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const calculateDiscountedPrice = () => {
    if (!event || !event.earlyBirdDiscount?.enabled) return event?.ticketPrice || event?.price || 0;

    const now = new Date();
    const startTime = new Date(event.earlyBirdDiscount.startTime);
    const endTime = new Date(event.earlyBirdDiscount.endTime);
    const eventPrice = event.ticketPrice || event.price;

    if (now >= startTime && now <= endTime) {
      const discount = event.earlyBirdDiscount.type === 'percentage'
        ? (eventPrice * event.earlyBirdDiscount.value) / 100
        : event.earlyBirdDiscount.value;
      return Math.max((eventPrice || event.price) - discount, 0);
    }

    return eventPrice;
  };

  const priceBeforeDiscount = event?.ticketPrice || event?.price || 0;
  const basePrice = calculateDiscountedPrice();
  const totalBeforeCoupon = basePrice * attendees.length;
  const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0);

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
                <span className="flex space-x-2">
                  <span className="flex items-center gap-1 line-through text-muted-foreground">
                    {formatCurrency(priceBeforeDiscount, event.currency)}
                  </span>
                  <span className="flex items-center gap-1">
                    {formatCurrency(basePrice, event.currency)}
                  </span>
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Number of tickets:</span>
                <span>{attendees.length}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal:</span>
                <span>{formatCurrency(totalBeforeCoupon, event.currency)}</span>
              </div>
              
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
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total to Pay:</span>
                <span className="text-primary">{formatCurrency(finalPrice, event.currency)}</span>
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
            handlePayment()
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