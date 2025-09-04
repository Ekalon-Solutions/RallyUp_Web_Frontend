"use client"

import React, { useState } from "react"
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
  Phone, 
  Mail, 
  User, 
  DollarSign,
  Package,
  CheckCircle,
  Image as ImageIcon,
  Loader2
} from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { PaymentSimulationModal } from "./payment-simulation-modal"
import { toast } from "sonner"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  paymentMethod: 'card' | 'paypal' | 'bank_transfer'
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [orderForm, setOrderForm] = useState<OrderForm>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    notes: '',
    paymentMethod: 'card'
  })

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
      // Create order via API
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
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      }

      const response = await apiClient.post('/orders', orderData)
      
      if (response.success && response.data) {
        const order = response.data.data
        setCreatedOrder(order)
        setShowPaymentModal(true)
        // Don't close the modal yet - wait for payment simulation
      } else {
        toast.error(response.message || 'Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      // Update payment status to paid
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'paid'
      })
      
      toast.success('Payment successful! Order confirmed.')
      clearCart()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Payment successful but failed to update order status.')
    }
  }

  const handlePaymentFailure = async (orderId: string) => {
    try {
      // Update payment status to failed
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'failed'
      })
      
      toast.error('Payment failed. Please try again.')
      // Keep the order in pending status for retry
    } catch (error) {
      console.error('Error updating payment status:', error)
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

    // Basic email validation
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
                          <DollarSign className="w-3 h-3 inline mr-1" />
                          {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={orderForm.paymentMethod === 'card'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-primary"
                      />
                      <span>Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={orderForm.paymentMethod === 'paypal'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-primary"
                      />
                      <span>PayPal</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={orderForm.paymentMethod === 'bank_transfer'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-primary"
                      />
                      <span>Bank Transfer</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Order Total */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        {totalPrice.toFixed(2)} {items[0]?.currency || 'USD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        {totalPrice.toFixed(2)} {items[0]?.currency || 'USD'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

      {/* Payment Simulation Modal */}
      {createdOrder && (
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
          total={createdOrder.total}
          currency={createdOrder.currency}
          paymentMethod={createdOrder.paymentMethod}
        />
      )}
    </Dialog>
  )
}
