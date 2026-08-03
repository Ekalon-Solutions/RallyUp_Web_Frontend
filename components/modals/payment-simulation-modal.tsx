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
  AlertCircle,
  Tag,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { PLATFORM_FEE_PERCENT } from "@/lib/transactionFees"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentSimulationModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string, couponCode?: string) => void
  onPaymentFailure: (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string, error: any) => void
  orderId: string
  orderNumber: string
  total: number
  subtotal?: number
  shippingCost?: number
  tax?: number
  currency: string
  paymentMethod: string
  platformFeeTotal?: number
  platformFeePercent?: number
  razorpayFeeTotal?: number
  couponDiscount?: number
  couponCode?: string
  clubId?: string
  showCouponInput?: boolean
  pointsDiscount?: number
  dialogTitle?: string
  dialogDescription?: string
  payButtonLabel?: string
  prefillPhone?: string
  prefillEmail?: string
  /** Optional purchase-specific persistence step that must finish before checkout opens. */
  onRazorpayOrderCreated?: (razorpayOrderId: string, couponCode?: string) => Promise<boolean>
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
  platformFeePercent = PLATFORM_FEE_PERCENT,
  razorpayFeeTotal,
  couponDiscount,
  couponCode,
  clubId,
  showCouponInput = false,
  dialogTitle,
  dialogDescription,
  payButtonLabel,
  pointsDiscount,
  prefillPhone,
  prefillEmail,
  onRazorpayOrderCreated,
}: PaymentSimulationModalProps) {
  const [processing, setProcessing] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [razorpayOpen, setRazorpayOpen] = useState(false)

  const [inputCouponCode, setInputCouponCode] = useState("")
  const [activeCouponCode, setActiveCouponCode] = useState<string | undefined>(couponCode)
  const [activeCouponDiscount, setActiveCouponDiscount] = useState<number>(couponDiscount || 0)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [isAutoAppliedCoupon, setIsAutoAppliedCoupon] = useState(false)
  const [autoCouponRemoved, setAutoCouponRemoved] = useState(false)

  useEffect(() => {
    if (couponCode) setActiveCouponCode(couponCode)
    if (couponDiscount) setActiveCouponDiscount(couponDiscount)
  }, [couponCode, couponDiscount])

  useEffect(() => {
    if (!isOpen || !showCouponInput || autoCouponRemoved || activeCouponCode) return
    const targetClubId = clubId || (typeof window !== "undefined" ? localStorage.getItem("selectedClubId") || sessionStorage.getItem("selectedClubId") : undefined)
    if (!targetClubId) return

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.getHighestEligibleAutoCoupon({
          clubId: targetClubId,
          phone: prefillPhone || undefined,
          email: prefillEmail || undefined,
          cartSubtotal: subtotal || total,
          purchaseType: 'membership',
        })
        if (res.success && res.data?.coupon) {
          const c = res.data.coupon
          setActiveCouponCode(c.code)
          setActiveCouponDiscount(c.discount || 0)
          setIsAutoAppliedCoupon(true)
        }
      } catch {
        // Auto-apply is best effort
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, showCouponInput, clubId, subtotal, total, prefillPhone, prefillEmail, autoCouponRemoved, activeCouponCode])

  const handleApplyCoupon = async () => {
    if (!inputCouponCode.trim()) return
    try {
      setValidatingCoupon(true)
      const targetClubId = clubId || (typeof window !== "undefined" ? localStorage.getItem("selectedClubId") || sessionStorage.getItem("selectedClubId") : undefined)
      if (!targetClubId) {
        toast.error("Club context is missing. Please select a club first.")
        return
      }
      const res = await apiClient.validateCoupon(inputCouponCode.trim().toUpperCase(), {
        clubId: targetClubId,
        purchaseType: 'membership',
      })
      if (res.success && res.data?.coupon) {
        setActiveCouponCode(res.data.coupon.code)
        setActiveCouponDiscount(res.data.coupon.discount || 0)
        setIsAutoAppliedCoupon(false)
        toast.success(`Coupon ${res.data.coupon.code} applied successfully!`)
      } else {
        toast.error(res.error || res.message || "Invalid coupon code")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to validate coupon")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setInputCouponCode("")
    setActiveCouponCode(undefined)
    setActiveCouponDiscount(0)
    setAutoCouponRemoved(true)
    setIsAutoAppliedCoupon(false)
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => {
      toast.error("Failed to load Razorpay. Please check your internet connection.")
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [toast])

  const formatCurrency = (amount: number, currency: string = 'INR') => {
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
      toast.error("Payment system is still loading. Please wait.")
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

      if (onRazorpayOrderCreated) {
        const saved = await onRazorpayOrderCreated(razorpayOrderId)
        if (!saved) throw new Error('Failed to save pending purchase')
      }

      // Persist Razorpay order id on the merchandise order before checkout (Mongo ObjectId orders only).
      const persist = await apiClient.patch(`/orders/admin/${orderId}/razorpay-order-id`, {
        razorpayOrderId,
      })
      if (!persist.success) {
        console.warn(
          "[Razorpay] Could not save razorpayOrderId on order (non-merchandise or wrong id is ok):",
          persist.error || persist.message
        )
      }

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

            toast.success(`Payment Successful! Order ${orderNumber} payment completed successfully.`)

            setRazorpayOpen(false)
            onPaymentSuccess(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature, activeCouponCode)
            onClose()
          } catch (error) {
            toast.error("Payment was received but verification failed. Please contact support.")
            setRazorpayOpen(false)
            onPaymentFailure(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature, error)
          }
        },
        prefill: {
          name: '',
          email: prefillEmail || '',
          contact: prefillPhone || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: async function() {
            setRazorpayOpen(false)
            setProcessing(false)
            const cancellationError = Object.assign(
              new Error("Payment cancelled by user"),
              { code: "PAYMENT_CANCELLED" }
            )
            try {
              await onPaymentFailure(
                orderId,
                "",
                razorpayOrderId,
                "",
                cancellationError
              )
            } catch (error) {
              console.error("[Razorpay] Failed to persist payment cancellation:", error)
            }
            toast.error("You cancelled the payment process.")
          }
        }
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        toast.error(response?.error?.description || "Payment processing failed. Please try again.")
        setRazorpayOpen(false)
        onPaymentFailure(
          orderId,
          response.razorpay_payment_id,
          response.razorpay_order_id || razorpayOrderId,
          response.razorpay_signature,
          response.error
        )
        setProcessing(false)
      })

      setRazorpayOpen(true)
      razorpay.open()
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.")
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
    <Dialog open={isOpen} onOpenChange={() => { if (!razorpayOpen) onClose() }} modal={!razorpayOpen}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
      >
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
              {(() => {
                const currentDiscount = activeCouponDiscount > 0 ? activeCouponDiscount : (couponDiscount ?? 0)
                const currentCoupon = activeCouponCode || couponCode
                // Show a clear breakdown: items subtotal, shipping, tax
                if (subtotal !== undefined) {
                  const hasDiscount = currentDiscount > 0 || (pointsDiscount ?? 0) > 0
                  const netSubtotal = Math.max(subtotal - currentDiscount - (pointsDiscount ?? 0), 0)
                  return (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span>Items Subtotal:</span>
                        <span className="flex items-center gap-2">
                          {hasDiscount ? (
                            <>
                              <span className="line-through text-muted-foreground">{formatCurrency(subtotal, currency)}</span>
                              <span>{formatCurrency(netSubtotal, currency)}</span>
                            </>
                          ) : (
                            <span>{formatCurrency(subtotal, currency)}</span>
                          )}
                        </span>
                      </div>
                      {currentDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                          <span>Coupon {currentCoupon ? `(${currentCoupon})` : 'discount'}:</span>
                          <span>-{formatCurrency(currentDiscount, currency)}</span>
                        </div>
                      )}
                      {(pointsDiscount ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>- Points discount:</span>
                          <span>-{formatCurrency(pointsDiscount!, currency)}</span>
                        </div>
                      )}
                      {shippingCost !== undefined && (
                        <div className="flex justify-between items-center text-sm">
                          <span>Shipping:</span>
                          {shippingCost === 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <span>{formatCurrency(shippingCost, currency)}</span>
                          )}
                        </div>
                      )}
                      {tax !== undefined && tax > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span>Tax:</span>
                          <span>{formatCurrency(tax, currency)}</span>
                        </div>
                      )}
                    </>
                  )
                }

                // Fallback: show any available parts separately
                return (
                  <>
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
                  </>
                )
              })()}

              {/* Coupon Field inside Payment Summary (only visible when showCouponInput is true) */}
              {showCouponInput && (
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span>Coupon or Promo Code</span>
                  </div>
                  {activeCouponCode ? (
                    <div className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/30 text-xs">
                      <div>
                        <span className="font-bold text-green-700 dark:text-green-300">
                          {activeCouponCode}
                          {isAutoAppliedCoupon && <span className="ml-1 text-[10px] text-green-600 font-normal">· Auto-applied</span>}
                        </span>
                        {activeCouponDiscount > 0 && (
                          <span className="ml-2 text-green-600 dark:text-green-400">(-{formatCurrency(activeCouponDiscount, currency)})</span>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-100">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter coupon code (e.g. RENEWAL50)"
                        value={inputCouponCode}
                        onChange={(e) => setInputCouponCode(e.target.value.toUpperCase())}
                        className="h-8 text-xs uppercase"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleApplyCoupon()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleApplyCoupon()}
                        disabled={validatingCoupon || !inputCouponCode.trim()}
                        className="h-8 text-xs px-3"
                      >
                        {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {platformFeeTotal !== undefined && platformFeeTotal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Platform fee:</span>
                  <span>{formatCurrency(platformFeeTotal, currency)}</span>
                </div>
              )}
              {razorpayFeeTotal !== undefined && razorpayFeeTotal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Payment gateway fee:</span>
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
