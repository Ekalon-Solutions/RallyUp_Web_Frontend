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
  onSuccess: () => void
  onFailure: () => void
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, couponCode, onSuccess, onFailure }: EventCheckoutModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Load Razorpay script
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
          // console.error("Error validating coupon:", error)
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

    setLoading(true)

    try {
      const basePrice = calculateDiscountedPrice()
      const totalBeforeCoupon = basePrice * attendees.length
      const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0)

      if (finalPrice <= 0) {
        // Free event, register directly
        const response = await apiClient.registerForEvent(
          String(event._id),
          undefined,
          attendees,
          couponCode
        )
        
        if (response.success) {
          toast.success("Successfully registered for event!")
          onSuccess()
          onClose()
        } else {
          onFailure()
          // toast.error(response.error || "Failed to register for event")
        }
        setLoading(false)
        return
      }

      // Create Razorpay order
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
            // Verify payment
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
            
            const registerResponse = await apiClient.registerForEvent(
              String(event._id),
              undefined,
              attendees,
              couponCode,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
 
            )

            if (registerResponse.success) {
              toast.success("Payment successful! You are now registered for the event.")
              onSuccess()
              onClose()
            } else {
              toast.error("Payment successful but registration failed. Please contact support.")
            }
          } catch (error) {
            // console.error('Payment verification error:', error)
            toast.error("Payment verification failed. Please contact support.")
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone_number || '',
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
        // console.error('Payment failed:', response.error)
        toast.error(response.error.description || "Payment processing failed. Please try again.")
        setLoading(false)
      })

      razorpay.open()
    } catch (error) {
      // console.error('Payment initiation error:', error)
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
    </Dialog>
  )
}