"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Loader2,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentSimulationModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string) => void
  onPaymentFailure: (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string, error: any) => void
  orderId: string
  orderNumber: string
  total: number
  subtotal?: number
  shippingCost?: number
  tax?: number
  currency: string
  paymentMethod: string
  /** Platform fee (4.5% + GST) for display */
  platformFeeTotal?: number
  /** Payment gateway fee (2.5% + GST) for display */
  razorpayFeeTotal?: number
  dialogTitle?: string
  dialogDescription?: string
  payButtonLabel?: string
}

export function PaymentSimulationModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  onPaymentFailure,
  orderId,
  orderNumber,
  total,
  subtotal,
  shippingCost,
  tax,
  currency,
  paymentMethod,
  platformFeeTotal,
  razorpayFeeTotal,
  dialogTitle,
  dialogDescription,
  payButtonLabel,
}: PaymentSimulationModalProps) {
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load Razorpay. Please check your internet connection.",
        variant: "destructive",
      })
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [toast])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'INR': 'en-IN',
      'EUR': 'en-EU',
      'GBP': 'en-GB',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'JPY': 'ja-JP',
      'BRL': 'pt-BR',
      'MXN': 'es-MX',
      'ZAR': 'en-ZA'
    }
    const locale = localeMap[currency] || 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const initiatePayment = async () => {
    if (!scriptLoaded) {
      toast({
        title: "Error",
        description: "Payment system is still loading. Please wait.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: currency,
          orderId: orderId,
          orderNumber: orderNumber,
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
        description: `Payment for Order ${orderNumber}`,
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
                orderId: orderId,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed')
            }

            toast({
              title: "Payment Successful!",
              description: `Order ${orderNumber} payment completed successfully.`,
            })
            
            onPaymentSuccess(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature)
            onClose()
          } catch (error) {
            // console.error('Payment verification error:', error)
            toast({
              title: "Payment Verification Failed",
              description: "Payment was received but verification failed. Please contact support.",
              variant: "destructive",
            })
            onPaymentFailure(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature, error)
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "destructive",
            })
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      
      razorpay.on('payment.failed', function (response: any) {
        // console.error('Payment failed:', response.error)
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment processing failed. Please try again.",
          variant: "destructive",
        })
        onPaymentFailure(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature, response.error)
        setProcessing(false)
      })

      razorpay.open()
    } catch (error) {
      // console.error('Payment initiation error:', error)
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
      setProcessing(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'upi':
        return <div className="w-5 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">UPI</div>
      case 'netbanking':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">NB</div>
      case 'wallet':
        return <div className="w-5 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">W</div>
      case 'all':
        return <DollarSign className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card'
      case 'upi':
        return 'UPI'
      case 'netbanking':
        return 'Net Banking'
      case 'wallet':
        return 'Wallet'
      case 'all':
        return 'All Payment Methods'
      default:
        return 'All Payment Methods'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {dialogTitle ?? "Complete Payment"}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription ?? "Secure payment powered by Razorpay"}
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
                  <span className="text-sm">{getPaymentMethodName(paymentMethod)}</span>
                </div>
              </div>
              <Separator />
              {/* Price Breakdown */}
              {subtotal !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
              )}
              {shippingCost !== undefined && shippingCost > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Shipping:</span>
                  <span>{formatCurrency(shippingCost, currency)}</span>
                </div>
              )}
              {shippingCost !== undefined && shippingCost === 0 && subtotal !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span>Shipping:</span>
                  <span className="text-green-600">Free</span>
                </div>
              )}
              {tax !== undefined && tax > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Tax:</span>
                  <span>{formatCurrency(tax, currency)}</span>
                </div>
              )}
              {platformFeeTotal !== undefined && platformFeeTotal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Platform fee (4.5% + GST):</span>
                  <span>{formatCurrency(platformFeeTotal, currency)}</span>
                </div>
              )}
              {razorpayFeeTotal !== undefined && razorpayFeeTotal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Payment gateway fee (2.5% + GST):</span>
                  <span>{formatCurrency(razorpayFeeTotal, currency)}</span>
                </div>
              )}
              {(subtotal !== undefined || shippingCost !== undefined || tax !== undefined || (platformFeeTotal ?? 0) > 0 || (razorpayFeeTotal ?? 0) > 0) && (
                <Separator />
              )}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Button
            onClick={initiatePayment}
            disabled={processing || !scriptLoaded}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </div>
            ) : !scriptLoaded ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Payment System...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {payButtonLabel ?? `Pay ${formatCurrency(total, currency)}`}
              </div>
            )}
          </Button>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Secure Payment</p>
                <p className="text-blue-700">
                  Your payment is secured by Razorpay. We support UPI, Cards, Net Banking, Wallets, EMI, Pay Later, and Bank Transfer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
