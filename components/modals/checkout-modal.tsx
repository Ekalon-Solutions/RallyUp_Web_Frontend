"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  MapPin, 
  User, 
  DollarSign,
  Package,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Wallet,
  Building2,
  Smartphone,
  Tag,
  X
} from "lucide-react"
import { useCart, CartItem } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from "@/lib/transactionFees"
import { PaymentSimulationModal } from "./payment-simulation-modal"
import { toast } from "sonner"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  directCheckoutItems?: CartItem[]
}

interface OrderForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  notes: string
  paymentMethod: string
}

interface AppliedCoupon {
  code: string
  name: string
  discountType: 'flat' | 'percentage'
  discountValue: number
  discount: number
  originalPrice: number
  finalPrice: number
}

export function CheckoutModal({ isOpen, onClose, onSuccess, directCheckoutItems }: CheckoutModalProps) {
  const { user } = useAuth()
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart } = useCart()
  const items = directCheckoutItems || cartItems
  const totalPrice = directCheckoutItems 
    ? directCheckoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : cartTotalPrice
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [merchandiseSettings, setMerchandiseSettings] = useState<{
    shippingCost: number
    freeShippingThreshold: number
    taxRate: number
    enableTax: boolean
    enableShipping: boolean
  } | null>(null)
  const [orderForm, setOrderForm] = useState<OrderForm>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: '',
    paymentMethod: 'all'
  })
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  // Reset coupon when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCouponCode("")
      setAppliedCoupon(null)
    }
  }, [isOpen])

  // Fetch merchandise settings when modal opens
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const club = items[0]?.club
        const clubId = typeof club === 'string' ? club : club?._id
        
        if (clubId) {
          const response = await apiClient.getPublicMerchandiseSettings(clubId)
          if (response.success && response.data?.settings) {
            setMerchandiseSettings(response.data.settings)
          }
        }
      } catch (error) {
      }
    }
    
    if (isOpen && items.length > 0) {
      fetchSettings()
    }
  }, [isOpen, items])

  const couponDiscount = appliedCoupon?.discount ?? 0
  const subtotalAfterCoupon = Math.max(0, totalPrice - couponDiscount)
  
  const calculateShipping = () => {
    if (!merchandiseSettings?.enableShipping) return 0
    if (merchandiseSettings.freeShippingThreshold && subtotalAfterCoupon >= merchandiseSettings.freeShippingThreshold) {
      return 0
    }
    return merchandiseSettings.shippingCost || 0
  }

  const calculateTax = () => {
    if (!merchandiseSettings?.enableTax || !merchandiseSettings.taxRate) return 0
    return subtotalAfterCoupon * (merchandiseSettings.taxRate / 100)
  }

  const shippingCost = calculateShipping()
  const taxAmount = calculateTax()
  const orderTotal = subtotalAfterCoupon + shippingCost + taxAmount
  const feeBreakdown = orderTotal > 0 ? calculateTransactionFees(orderTotal) : null
  const finalAmount = feeBreakdown ? feeBreakdown.finalAmount : orderTotal

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    if (totalPrice <= 0) {
      toast.error("Coupons are not applicable for this order")
      return
    }
    const clubId = items[0] ? (typeof items[0].club === 'string' ? items[0].club : (items[0].club as any)?._id) : undefined
    if (!clubId) {
      toast.error("Unable to validate coupon for this order")
      return
    }
    setValidatingCoupon(true)
    try {
      const response = await apiClient.validateCoupon(
        couponCode.trim().toUpperCase(),
        undefined,
        totalPrice,
        clubId
      )
      if (response.success && response.data?.coupon) {
        setAppliedCoupon(response.data.coupon)
        toast.success("Coupon applied successfully!")
      } else {
        setAppliedCoupon(null)
        toast.error(response.error || "Invalid coupon code")
      }
    } catch {
      setAppliedCoupon(null)
      toast.error("Failed to validate coupon")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast.info("Coupon removed")
  }

  const currency = items.length > 0 ? (items[0].currency || 'USD') : 'USD'

  const formatCurrency = (amount: number, currencyCode: string = currency) => {
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
    const locale = localeMap[currencyCode] || 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  }

  useEffect(() => {
    if (isOpen && user) {
      const userAny = user as any
      setOrderForm(prev => ({
        ...prev,
        firstName: prev.firstName || user?.name?.split(' ')[0] || '',
        lastName: prev.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user?.email || '',
        phone: prev.phone || userAny?.phoneNumber || '',
        address: prev.address || userAny?.address_line1 || '',
        city: prev.city || userAny?.city || '',
        state: prev.state || userAny?.state_province || '',
        zipCode: prev.zipCode || userAny?.zip_code || '',
        country: prev.country || userAny?.country || '',
      }))
    }
  }, [isOpen, user])

  const handleInputChange = (field: keyof OrderForm, value: string) => {
    setOrderForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const orderData = {
        customer: {
          firstName: orderForm.firstName,
          lastName: orderForm.lastName,
          email: orderForm.email,
          phone: orderForm.phone
        },
        shippingAddress: {
          firstName: orderForm.firstName,
          lastName: orderForm.lastName,
          address: orderForm.address,
          city: orderForm.city,
          state: orderForm.state,
          zipCode: orderForm.zipCode,
          country: orderForm.country
        },
        items: items.map(item => ({
          productId: item._id,
          quantity: item.quantity
        })),
        paymentMethod: 'all',
        notes: orderForm.notes,
        ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {})
      }

      const response = await apiClient.post(user ? '/orders' : '/orders/public', orderData)
      
      if (response.success && response.data) {
        const order = response.data.data
        setCreatedOrder(order)
        setShowPaymentModal(true)
      } else {
        toast.error(response.message || 'Failed to place order. Please try again.')
      }
    } catch (error) {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    try {
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'paid', paymentId, razorpayOrderId, razorpaySignature
      })
      
      toast.success('Payment successful! Order confirmed.')
      if (!directCheckoutItems) {
        clearCart()
      }
      onSuccess()
      onClose()
    } catch (error) {
      // console.error('Error updating payment status:', error)
      toast.error('Payment successful but failed to update order status.')
    }
  }

  const handlePaymentFailure = async (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    try {
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'failed', paymentId, razorpayOrderId, razorpaySignature
      })
      
      toast.error('Payment failed. Please try again.')
    } catch (error) {
      // console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status.')
    }
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
    
    for (const field of required) {
      if (!orderForm[field as keyof OrderForm]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(orderForm.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your order details and payment information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Form */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={orderForm.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={orderForm.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={orderForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={orderForm.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={orderForm.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={orderForm.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={orderForm.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={orderForm.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any special instructions or notes for your order..."
                    value={orderForm.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          {item.featuredImage ? (
                            <img
                              src={item.featuredImage}
                              alt={item.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(() => {
                                // Handle case where tags might be stored as JSON string
                                let parsedTags = item.tags;
                                if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                  try {
                                    parsedTags = JSON.parse(item.tags[0]);
                                  } catch (e) {
                                    parsedTags = item.tags;
                                  }
                                }
                                return parsedTags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ));
                              })()}
                              {(() => {
                                let parsedTags = item.tags;
                                if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                  try {
                                    parsedTags = JSON.parse(item.tags[0]);
                                  } catch (e) {
                                    parsedTags = item.tags;
                                  }
                                }
                                return parsedTags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{parsedTags.length - 2}
                                  </Badge>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity, item.currency || currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Section - same as events */}
              {totalPrice > 0 && (
                <Card className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="w-4 h-4" />
                      Have a Coupon Code?
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Apply a discount code to reduce your order total
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={validatingCoupon}
                          className="font-mono flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleValidateCoupon()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleValidateCoupon}
                          disabled={!couponCode.trim() || validatingCoupon}
                          variant="outline"
                        >
                          {validatingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-900">{appliedCoupon.name}</div>
                            <div className="text-sm text-green-700">
                              Code: <code className="font-mono font-semibold">{appliedCoupon.code}</code>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order Total */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(totalPrice, currency)}
                      </span>
                    </div>
                    {appliedCoupon && couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          Coupon ({appliedCoupon.code})
                        </span>
                        <span>-{formatCurrency(couponDiscount, currency)}</span>
                      </div>
                    )}
                    {merchandiseSettings?.enableShipping && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        {shippingCost === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span>{formatCurrency(shippingCost, currency)}</span>
                        )}
                      </div>
                    )}
                    {merchandiseSettings?.enableTax && taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({merchandiseSettings.taxRate}%):</span>
                        <span>{formatCurrency(taxAmount, currency)}</span>
                      </div>
                    )}
                    {feeBreakdown && feeBreakdown.totalFees > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Platform fee ({PLATFORM_FEE_PERCENT}% + GST):</span>
                          <span>{formatCurrency(feeBreakdown.platformFee + feeBreakdown.platformFeeGst, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Payment gateway fee ({RAZORPAY_FEE_PERCENT}% + GST):</span>
                          <span>{formatCurrency(feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst, currency)}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>
                        {formatCurrency(finalAmount, currency)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refund Policy Notice */}
              <p className="text-xs text-muted-foreground text-center">
                By placing your order, you agree to our{" "}
                <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline">
                  Refund and Cancellation Policy
                </a>
                .
              </p>

              {/* Place Order Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Payment Simulation Modal - use backend order total (includes shipping/tax) + fees so amount is never 0 when order has total */}
      {createdOrder && (() => {
        const backendOrderTotal = Number(createdOrder.total) ?? 0
        const feesForPayment = backendOrderTotal > 0 ? calculateTransactionFees(backendOrderTotal) : null
        const amountToCharge = feesForPayment ? feesForPayment.finalAmount : backendOrderTotal
        return (
          <PaymentSimulationModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setCreatedOrder(null)
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            orderId={createdOrder._id}
            orderNumber={createdOrder.orderNumber}
            total={amountToCharge}
            subtotal={createdOrder.subtotal ?? orderTotal}
            shippingCost={createdOrder.shippingCost ?? shippingCost}
            tax={createdOrder.tax ?? taxAmount}
            currency={createdOrder.currency ?? currency}
            paymentMethod={createdOrder.paymentMethod || orderForm.paymentMethod || 'all'}
            platformFeeTotal={feesForPayment ? feesForPayment.platformFee + feesForPayment.platformFeeGst : undefined}
            razorpayFeeTotal={feesForPayment ? feesForPayment.razorpayFee + feesForPayment.razorpayFeeGst : undefined}
            couponDiscount={createdOrder.couponDiscount}
            couponCode={createdOrder.couponCode}
          />
        )
      })()}
    </Dialog>
  )
}
