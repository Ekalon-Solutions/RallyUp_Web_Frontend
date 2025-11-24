"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard, Loader2, Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface EventPaymentSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    _id: string
    name: string
    price: number
    ticketPrice?: number
    earlyBirdDiscount?: any
  }
 
  attendees: Array<{ name: string; phone: string }>;
  couponCode?: string;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
}

export function EventPaymentSimulationModal({
  isOpen,
  onClose,
  event,
  attendees,
  couponCode,
  onPaymentSuccess,
  onPaymentFailure,
}: EventPaymentSimulationModalProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [simulating, setSimulating] = useState<"success" | "failure" | null>(
    null
  );
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    const validateCoupon = async () => {
      if (couponCode && event?._id && isOpen) {
        try {
          const totalPrice = event.price * attendees.length
          const response = await apiClient.validateCoupon(couponCode, event._id, totalPrice)
          
          if (response.success && response.data?.coupon) {
            setCouponDiscount(response.data.coupon.discount * attendees.length)
          } else {
            setCouponDiscount(0)
          }
        } catch (error) {
          console.error("Error validating coupon:", error)
          setCouponDiscount(0)
        }
      } else {
        setCouponDiscount(0)
      }
    }
    
    validateCoupon()
  }, [couponCode, event?._id, attendees.length, isOpen])

  const simulatePayment = async (type: "success" | "failure") => {
    setProcessing(true);
    setSimulating(type);

    try {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (type === "success") {
        // Call the event registration API on success
        const response = await apiClient.registerForEvent(
          event._id,
          undefined,
          attendees,
          couponCode
        );
        if (response.success) {
          toast({
            title: "Payment Successful!",
            description:
              "Your payment was processed successfully, and you are registered for the event.",
          });
          onPaymentSuccess();
        } else {
          toast({
            title: "Event registration failed after payment.",
            description:
              "Your payment was processed successfully, but event registration failed.",
          })
          throw new Error("Event registration failed after payment.");
        }
      } else {
        toast({
          title: "Payment Failed",
          description: "Please try again.",
          variant: "destructive",
        });
        onPaymentFailure();
      }

      onClose();
    } catch (error) {
      console.error("Payment simulation error:", error);
      toast({
        title: "Error",
        description:
          "An error occurred during payment simulation or event registration.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSimulating(null);
    }
  };

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

  const basePrice = calculateDiscountedPrice();
 
  const totalBeforeCoupon = (basePrice || 0) * attendees.length;
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
            Payment Simulation
          </DialogTitle>
          <DialogDescription>Simulate payment for the event</DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>{event?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Price per ticket:</span>
                <span>₹{(basePrice || 0).toLocaleString()}</span>
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
                  <li key={index}>
                    {attendee.name} ({attendee.phone})
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 mt-4">
          <Button
            onClick={() => simulatePayment("success")}
            disabled={processing}
            className="w-full bg-green-600 hover:bg-green-700 text-white">
            {simulating === "success" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              "Simulate Successful Payment"
            )}
          </Button>

          <Button
            onClick={() => simulatePayment("failure")}
            disabled={processing}
            variant="destructive"
            className="w-full">
            {simulating === "failure" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              "Simulate Failed Payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
