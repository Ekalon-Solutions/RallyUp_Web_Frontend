"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  User, 
  DollarSign,
  Loader2,
  Tag,
  Percent
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface EventCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    _id?: string
    name: string
    price: number
    ticketPrice?: number
    earlyBirdDiscount?: any
  }
  attendees: Array<{ name: string; phone: string }>
  couponCode?: string
  onSuccess: () => void
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, couponCode, onSuccess }: EventCheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")

  useEffect(() => {
    const validateCoupon = async () => {
      if (couponCode && event?._id && isOpen) {
        try {
          const ticketPrice = event.ticketPrice || event.price
          const totalPrice = ticketPrice * attendees.length
          const response = await apiClient.validateCoupon(couponCode, event._id, totalPrice)
          
          if (response.success && response.data?.coupon) {
            setCouponDiscount(response.data.coupon.discount * attendees.length)
            setCouponName(response.data.coupon.name)
          } else {
            setCouponDiscount(0)
            setCouponName("")
          }
        } catch (error) {
          console.error("Error validating coupon:", error)
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
    setLoading(true)
    try {
      // Simulate API call for payment
      await new Promise(resolve => setTimeout(resolve, 2000))
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscountedPrice = () => {
    if (!event || !event.earlyBirdDiscount?.enabled) return event?.ticketPrice || event?.price || 0;

    const now = new Date();
    const startTime = new Date(event.earlyBirdDiscount.startTime);
    const endTime = new Date(event.earlyBirdDiscount.endTime);

    if (now >= startTime && now <= endTime) {
      const discount = event.earlyBirdDiscount.type === 'percentage'
        ? (event.ticketPrice * event.earlyBirdDiscount.value) / 100
        : event.earlyBirdDiscount.value;
      return Math.max((event.ticketPrice || event.price) - discount, 0);
    }

    return event.ticketPrice || event.price;
  };

  const basePrice = calculateDiscountedPrice();
  const totalBeforeCoupon = basePrice * attendees.length;
  const finalPrice = Math.max(totalBeforeCoupon - couponDiscount, 0);

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
                <span className="flex items-center gap-1">
                  ₹{basePrice.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Number of tickets:</span>
                <span>{attendees.length}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal:</span>
                <span>₹{totalBeforeCoupon.toLocaleString()}</span>
              </div>
              
              {couponCode && couponDiscount > 0 && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Coupon ({couponCode})
                    </span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
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
                <span className="text-primary">₹{finalPrice.toLocaleString()}</span>
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