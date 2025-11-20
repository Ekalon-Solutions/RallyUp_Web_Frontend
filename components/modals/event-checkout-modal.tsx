"use client"

import React, { useState } from "react"
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
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface EventCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    name: string
    price: number
  }
  attendees: Array<{ name: string; phone: string }>
  onSuccess: () => void
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, onSuccess }: EventCheckoutModalProps) {
  const [loading, setLoading] = useState(false)

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
            <div className="flex justify-between items-center">
              <span>Price:</span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {event?.price}
              </span>
            </div>
            <Separator className="my-4" />
            <div>
              <h4 className="text-sm font-medium">Attendees:</h4>
              <ul className="list-disc pl-5">
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