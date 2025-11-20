"use client";

import { useState } from "react";
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
    CreditCard, Loader2,
    DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface EventPaymentSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    name: string;
    price: number;
    _id: string;
  };
  attendees: Array<{ name: string; phone: string }>;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
}

export function EventPaymentSimulationModal({
  isOpen,
  onClose,
  event,
  attendees,
  onPaymentSuccess,
  onPaymentFailure,
}: EventPaymentSimulationModalProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [simulating, setSimulating] = useState<"success" | "failure" | null>(
    null
  );

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
          attendees
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
