"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2,
  DollarSign,
  Clock,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentSimulationModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: (orderId: string) => void
  onPaymentFailure: (orderId: string) => void
  orderId: string
  orderNumber: string
  total: number
  currency: string
  paymentMethod: string
}

export function PaymentSimulationModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  onPaymentFailure,
  orderId,
  orderNumber,
  total,
  currency,
  paymentMethod
}: PaymentSimulationModalProps) {
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [simulating, setSimulating] = useState<'success' | 'failure' | null>(null)

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const simulatePayment = async (type: 'success' | 'failure') => {
    setProcessing(true)
    setSimulating(type)

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (type === 'success') {
        toast({
          title: "Payment Successful!",
          description: `Order ${orderNumber} payment completed successfully.`,
        })
        onPaymentSuccess(orderId)
      } else {
        toast({
          title: "Payment Failed",
          description: `Order ${orderNumber} payment failed. Please try again.`,
          variant: "destructive",
        })
        onPaymentFailure(orderId)
      }
      
      onClose()
    } catch (error) {
      console.error('Payment simulation error:', error)
      toast({
        title: "Error",
        description: "An error occurred during payment simulation.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setSimulating(null)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'paypal':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">PP</div>
      case 'bank_transfer':
        return <div className="w-5 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">BT</div>
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit Card'
      case 'paypal':
        return 'PayPal'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return 'Credit Card'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Simulation
          </DialogTitle>
          <DialogDescription>
            Simulate payment processing for testing purposes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Order Number:</span>
                <Badge variant="outline">{orderNumber}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payment Method:</span>
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(paymentMethod)}
                  <span className="text-sm">{getPaymentMethodName(paymentMethod)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Simulation Buttons */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Choose payment simulation:
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Success Button */}
              <Button
                onClick={() => simulatePayment('success')}
                disabled={processing}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                {simulating === 'success' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Simulate Successful Payment
                  </div>
                )}
              </Button>

              {/* Failure Button */}
              <Button
                onClick={() => simulatePayment('failure')}
                disabled={processing}
                variant="destructive"
                className="w-full h-12"
              >
                {simulating === 'failure' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Simulate Failed Payment
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Testing Mode</p>
                <p className="text-blue-700">
                  This is a simulation for testing purposes. No real payment will be processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
