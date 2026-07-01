"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CreditCard,
  MapPin,
  User,
  DollarSign,
  Package,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Building2,
  Smartphone,
  Tag,
  X,
  Truck,
  Clock,
  Zap,
  ExternalLink,
  AlertTriangle
} from "lucide-react"
import { useCart, CartItem } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from "@/lib/transactionFees"
import { PaymentSimulationModal } from "./payment-simulation-modal"
import { toast } from "sonner"
import { MemberValidationModal } from "./member-validation-modal"
import { useRouter } from "next/navigation"

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
  billingSameAsShipping: boolean
  billingFirstName: string
  billingLastName: string
  billingAddress: string
  billingCity: string
  billingState: string
  billingZipCode: string
  billingCountry: string
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

interface ServiceabilityCourier {
  courierId: number
  courierName: string
  rate: number
  estimatedDays: { min: number; max: number } | null
}

interface ServiceabilityResult {
  serviceable: boolean
  estimatedDays: { min: number; max: number } | null
  cheapest: ServiceabilityCourier | null
  fastest: ServiceabilityCourier | null
  fallback: boolean
  message: string
}

function formatEstimatedDays(estimatedDays: { min: number; max: number }, titleCase = false): string {
  const { min, max } = estimatedDays
  const unit = titleCase
    ? (n: number) => (n === 1 ? 'Day' : 'Days')
    : (n: number) => (n === 1 ? 'day' : 'days')
  if (min === max) return `${min} ${unit(min)}`
  return `${min}-${max} ${titleCase ? 'Days' : 'days'}`
}

export function CheckoutModal({ isOpen, onClose, onSuccess, directCheckoutItems }: CheckoutModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart } = useCart()
  const items = directCheckoutItems || cartItems
  const totalPrice = directCheckoutItems 
    ? directCheckoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : cartTotalPrice
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [orderShipping, setOrderShipping] = useState<number | null>(null)
  const [orderTax, setOrderTax] = useState<number | null>(null)
  const [estimatedShipping, setEstimatedShipping] = useState<number | null>(null)
  const [estimatedTax, setEstimatedTax] = useState<number | null>(null)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [redeemPoints, setRedeemPoints] = useState<number>(0)
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState<number>(0)
  const [reserving, setReserving] = useState(false)
  const [showMemberValidation, setShowMemberValidation] = useState(false)
  const [memberValidated, setMemberValidated] = useState(false)
  const [shiprocketLoading, setShiprocketLoading] = useState(false)
  const [shiprocketMessage, setShiprocketMessage] = useState<string | null>(null)
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null)
  const [shippingMethod, setShippingMethod] = useState<'cheapest' | 'fastest'>('cheapest')
  const [merchandiseSettings, setMerchandiseSettings] = useState<{
    freeShippingThreshold: number
    taxRate: number
    enableTax: boolean
    enableShipping: boolean
    pickupPostcode?: number | null
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
    country: 'India',
    billingSameAsShipping: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'India',
    notes: '',
    paymentMethod: 'all'
  })
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [isAutoApplied, setIsAutoApplied] = useState(false)
  const [autoCouponRemoved, setAutoCouponRemoved] = useState(false)

  const currency = items.length > 0 ? (items[0].currency || 'INR') : 'INR'

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

  const triggerAutoCouponApply = useCallback(async (phoneNumber?: string, emailAddress?: string) => {
    if (autoCouponRemoved) return

    const searchPhone = phoneNumber || orderForm.phone || user?.phoneNumber || localStorage.getItem("rallyup_verified_guest_phone") || ""
    const searchEmail = emailAddress || orderForm.email || user?.email || ""
    const clubId = items.length > 0 ? (typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id) : null

    if (!clubId || (!searchPhone && !searchEmail)) return

    try {
      const res = await apiClient.getHighestEligibleAutoCoupon({
        clubId,
        phone: searchPhone || undefined,
        email: searchEmail || undefined,
        cartSubtotal: totalPrice,
      })

      if (res.success && res.data?.coupon) {
        const autoC = res.data.coupon
        setAppliedCoupon({
          code: autoC.code,
          name: autoC.name,
          discountType: autoC.discountType,
          discountValue: autoC.discountValue,
          discount: autoC.discount,
          originalPrice: totalPrice,
          finalPrice: Math.max(0, totalPrice - autoC.discount)
        })
        setIsAutoApplied(true)
      } else {
        if (isAutoApplied) {
          setAppliedCoupon(null)
          setIsAutoApplied(false)
        }
      }
    } catch (err) {
      console.error("Auto coupon fetch error:", err)
    }
  }, [autoCouponRemoved, orderForm.phone, orderForm.email, user, items, totalPrice, isAutoApplied])

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem("rallyup_verified_guest_phone") || ""
      const storedCountry = localStorage.getItem("rallyup_verified_guest_country_code") || "+91"
      if (storedPhone && !orderForm.phone) {
        setOrderForm(prev => ({
          ...prev,
          phone: prev.phone || `${storedCountry} ${storedPhone}`.trim()
        }))
      }
      triggerAutoCouponApply(storedPhone)
    }
  }, [isOpen, triggerAutoCouponApply])

  useEffect(() => {
    if (isOpen && (orderForm.phone || orderForm.email)) {
      const delayDebounceFn = setTimeout(() => {
        triggerAutoCouponApply()
      }, 500)
      return () => clearTimeout(delayDebounceFn)
    }
  }, [orderForm.phone, orderForm.email, isOpen, triggerAutoCouponApply])


  useEffect(() => {
    if (!isOpen) {
      if (reservationToken) {
        apiClient.cancelReservation(reservationToken).catch(() => {})
      }
      setCouponCode("")
      setAppliedCoupon(null)
      setRedeemPoints(0)
      setReservationToken(null)
      setReservedDiscount(0)
      setIsAutoApplied(false)
      setAutoCouponRemoved(false)
    }
  }, [isOpen])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const club = items[0]?.club
        const clubId = typeof club === 'string' ? club : club?._id

        if (clubId) {
          const response = await apiClient.getPublicMerchandiseSettings(clubId)
          if (response.success) {
            const payload = (response.data as any)?.data ?? response.data
            const settings = payload?.settings
            if (settings && typeof settings === 'object') {
              setMerchandiseSettings(settings)
            }
          }
        }
      } catch {
      }
    }

    if (isOpen && items.length > 0) {
      fetchSettings()
    }
  }, [isOpen, items])
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        if (isOpen && user && items.length > 0) {
          const clubId = typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id
          if (clubId) {
            const resp = await apiClient.getMemberPoints((user as any)._id, clubId)
            if (resp && resp.success && resp.data) {
              setAvailablePoints(resp.data.points || 0)
            }
          }
        }
      } catch (e) {
      }
    }
    fetchPoints()
  }, [isOpen, user, items])

  const couponDiscount = appliedCoupon?.discount ?? 0
  const subtotalAfterCoupon = Math.max(0, totalPrice - couponDiscount)

  const calculateShipping = () => {
    if (!merchandiseSettings?.enableShipping) return 0
    if (merchandiseSettings.freeShippingThreshold && subtotalAfterCoupon >= merchandiseSettings.freeShippingThreshold) {
      return 0
    }
    return 0
  }

  const calculateTax = () => {
    if (!merchandiseSettings?.enableTax || !merchandiseSettings.taxRate) return 0
    return subtotalAfterCoupon * (merchandiseSettings.taxRate / 100)
  }

  const validPincode = /^\d{6}$/.test(orderForm.zipCode?.trim() || '')
  const hasCompleteShippingAddress =
    validPincode &&
    !!orderForm.address.trim() &&
    !!orderForm.city.trim() &&
    !!orderForm.state.trim() &&
    !!orderForm.country.trim()
  
  const selectedCourier = serviceability && !serviceability.fallback
    ? (shippingMethod === 'fastest' ? (serviceability.fastest ?? serviceability.cheapest) : (serviceability.cheapest ?? serviceability.fastest))
    : null
  const shiprocketCost = (merchandiseSettings?.enableShipping && hasCompleteShippingAddress && serviceability?.serviceable && selectedCourier)
    ? selectedCourier.rate
    : null
  const shippingCost = !hasCompleteShippingAddress
    ? null
    : shiprocketCost != null
      ? shiprocketCost
      : shiprocketLoading
        ? null
        : estimatedShipping
  const taxAmount = calculateTax()

  useEffect(() => {
    if (!merchandiseSettings || !isOpen || !hasCompleteShippingAddress) {
      if (!hasCompleteShippingAddress) {
        setEstimatedShipping(null)
      }
      return
    }

    setEstimatedShipping(calculateShipping())
    setEstimatedTax(calculateTax())

    ;(async () => {
      try {
        const clubId = typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id
        const orderData = {
          customer: {
            firstName: orderForm.firstName || 'Guest',
            lastName: orderForm.lastName || '',
            email: orderForm.email || ''
          },
          shippingAddress: {
            address: orderForm.address || '',
            city: orderForm.city || '',
            state: orderForm.state || '',
            zipCode: orderForm.zipCode || '',
            country: orderForm.country || ''
          },
          items: items.map(i => ({ productId: i._id, quantity: i.quantity })),
          couponCode: appliedCoupon?.code || undefined,
          paymentMethod: orderForm.paymentMethod,
          shippingMethod,
        }

        const resp = await apiClient.post('/orders/estimate', orderData)
        if (resp && resp.success && resp.data) {
          setEstimatedShipping(resp.data.shippingCost ?? calculateShipping())
          setEstimatedTax(resp.data.tax ?? calculateTax())
        }
      } catch (e) {
      }
    })()
  }, [merchandiseSettings, subtotalAfterCoupon, orderForm.paymentMethod, shippingMethod, hasCompleteShippingAddress, orderForm.address, orderForm.city, orderForm.state, orderForm.country, orderForm.zipCode, appliedCoupon?.code, items, isOpen])

  const resolvedShippingCost = shippingCost ?? estimatedShipping ?? 0
  const displayShipping = orderShipping ?? (createdOrder ? (createdOrder.shippingCost ?? resolvedShippingCost) : resolvedShippingCost)
  const displayTax = orderTax ?? (createdOrder ? (createdOrder.tax ?? (estimatedTax ?? taxAmount)) : (estimatedTax ?? taxAmount))

  const netSubtotal = Math.max(subtotalAfterCoupon - (reservedDiscount || 0), 0)
  const feeBreakdown = totalPrice > 0 ? calculateTransactionFees(totalPrice) : null
  const finalAmount = netSubtotal + resolvedShippingCost + taxAmount + (feeBreakdown ? feeBreakdown.totalFees : 0)

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
    setIsAutoApplied(false)
    setAutoCouponRemoved(true)
    toast.info("Coupon removed")
  }

  const fetchServiceability = useCallback(async (zipCode: string) => {
    const deliveryPincode = zipCode.trim()
    if (!/^\d{6}$/.test(deliveryPincode)) return

    const clubId = typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id
    if (!clubId) return

    const fallbackResult: ServiceabilityResult = {
      serviceable: true,
      estimatedDays: { min: 5, max: 7 },
      cheapest: null,
      fastest: null,
      fallback: true,
      message: "Unable to verify delivery for this pincode right now — showing standard delivery estimate",
    }

    try {
      setShiprocketLoading(true)
      setShiprocketMessage(null)

      const response = await apiClient.checkMerchandiseServiceability({
        clubId,
        deliveryPincode,
        items: items.map(i => ({ productId: i._id, quantity: i.quantity })),
      })

      if (!response.success || !response.data) {
        setServiceability(fallbackResult)
        setShiprocketMessage(fallbackResult.message)
        return
      }

      setServiceability((response.data as any)?.data ?? response.data)
      const shipData = (response.data as any)?.data ?? response.data
      setShiprocketMessage(shipData.fallback ? shipData.message : null)
    } catch {
      setServiceability(fallbackResult)
      setShiprocketMessage(fallbackResult.message)
    } finally {
      setShiprocketLoading(false)
    }
  }, [items])

  const serviceabilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!isOpen || items.length === 0) return

    const zip = orderForm.zipCode?.trim()
    if (!zip || !/^\d{6}$/.test(zip)) {
      setServiceability(null)
      setShiprocketMessage(null)
      return
    }

    if (serviceabilityDebounceRef.current) {
      clearTimeout(serviceabilityDebounceRef.current)
    }

    const delay = merchandiseSettings === null ? 1500 : 500
    serviceabilityDebounceRef.current = setTimeout(() => {
      serviceabilityDebounceRef.current = null
      fetchServiceability(zip)
    }, delay)

    return () => {
      if (serviceabilityDebounceRef.current) {
        clearTimeout(serviceabilityDebounceRef.current)
        serviceabilityDebounceRef.current = null
      }
    }
  }, [isOpen, orderForm.zipCode, items.length, fetchServiceability, merchandiseSettings])

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
        country: prev.country || userAny?.country || 'India',
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
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes,
        ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
        shippingCost: resolvedShippingCost,
        shippingMethod,
        ...(!orderForm.billingSameAsShipping
          ? {
              billingAddress: {
                firstName: orderForm.billingFirstName,
                lastName: orderForm.billingLastName,
                address: orderForm.billingAddress,
                city: orderForm.billingCity,
                state: orderForm.billingState,
                zipCode: orderForm.billingZipCode,
                country: orderForm.billingCountry,
              },
            }
          : {}),
        tax: taxAmount,
        finalAmount,
        ...(feeBreakdown
          ? {
              platformFee: feeBreakdown.platformFee,
              platformFeeGst: feeBreakdown.platformFeeGst,
              razorpayFee: feeBreakdown.razorpayFee,
              razorpayFeeGst: feeBreakdown.razorpayFeeGst,
            }
          : {
              platformFee: 0,
              platformFeeGst: 0,
              razorpayFee: 0,
              razorpayFeeGst: 0,
            })
      }

      if (reservationToken) {
        (orderData as any).reservationToken = reservationToken
        ;(orderData as any).redeemedPoints = redeemPoints
        ;(orderData as any).redeemedDiscount = reservedDiscount
      }

      const response = await apiClient.post(user ? '/orders' : '/orders/public', orderData)

        if (response.success && response.data) {
        const order = response.data.data
        setOrderShipping(order.shippingCost ?? null)
        setOrderTax(order.tax ?? null)
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
      if (reservationToken) {
        try {
          await apiClient.confirmReservation(reservationToken, orderId)
        } catch (e) {
        }
        setReservationToken(null)
        setReservedDiscount(0)
        setRedeemPoints(0)
      }
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
      toast.error('Payment successful but failed to update order status.')
    }
  }

  const handlePaymentFailure = async (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    try {
      if (reservationToken) {
        try {
          await apiClient.cancelReservation(reservationToken)
        } catch (e) {
        }
        setReservationToken(null)
        setReservedDiscount(0)
        setRedeemPoints(0)
      }
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'failed', paymentId, razorpayOrderId, razorpaySignature
      })

      toast.error('Payment failed. Please try again.')
    } catch (error) {
      toast.error('Failed to update payment status.')
    }
  }

  const deliveryUnavailable = hasCompleteShippingAddress && !shiprocketLoading && serviceability !== null && !serviceability.serviceable
  const orderBlocked = hasCompleteShippingAddress && shiprocketLoading

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country']
    
    for (const field of required) {
      if (!orderForm[field as keyof OrderForm]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }

    if (!/^\d{6}$/.test(orderForm.zipCode.trim())) {
      toast.error('Please enter a valid 6-digit PIN code')
      return false
    }

    if (!orderForm.billingSameAsShipping) {
      const billingRequired = [
        'billingFirstName',
        'billingLastName',
        'billingAddress',
        'billingCity',
        'billingState',
        'billingZipCode',
        'billingCountry',
      ]
      for (const field of billingRequired) {
        if (!orderForm[field as keyof OrderForm]) {
          toast.error(`Please fill in billing ${field.replace(/^billing/, '').replace(/([A-Z])/g, ' $1').toLowerCase()}`)
          return false
        }
      }
      if (!/^\d{6}$/.test(orderForm.billingZipCode.trim())) {
        toast.error('Please enter a valid 6-digit billing PIN code')
        return false
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(orderForm.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    if (!hasCompleteShippingAddress) {
      toast.error('Please complete your shipping address before placing the order')
      return false
    }

    if (deliveryUnavailable) {
      toast.error("Sorry, we don't deliver to this area yet")
      return false
    }

    if (orderBlocked) {
      toast.error("Please wait for the delivery check to complete")
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
            <div className="space-y-6">
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
                      <Label htmlFor="zipCode">ZIP / PIN Code *</Label>
                      <Input
                        id="zipCode"
                        value={orderForm.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        maxLength={6}
                        required
                      />
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`PIN code${orderForm.address ? ` for ${orderForm.address}` : ''}${orderForm.city ? `, ${orderForm.city}` : ''}${orderForm.state ? `, ${orderForm.state}` : ''} India`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-500 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Don&apos;t know your PIN code? Look it up
                      </a>
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

                  {!hasCompleteShippingAddress && (
                    <p className="text-xs text-muted-foreground">
                      Enter your full shipping address to calculate delivery options and shipping cost.
                    </p>
                  )}

                  {hasCompleteShippingAddress && (
                    <div className="rounded-lg border p-3 text-sm space-y-1">
                      {shiprocketLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking delivery availability for this pincode...
                        </div>
                      )}
                      {!shiprocketLoading && serviceability && (
                        <>
                          {serviceability.serviceable ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <Truck className="w-4 h-4" />
                              <span>We deliver to this area</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Sorry, we don&apos;t deliver to this area yet</span>
                            </div>
                          )}
                          {serviceability.serviceable && serviceability.estimatedDays && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                Estimated Delivery: {formatEstimatedDays(serviceability.estimatedDays, true)}
                              </span>
                            </div>
                          )}
                          {serviceability.fallback && (
                            <div className="flex items-center gap-2 text-amber-600 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{serviceability.message}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {items.length > 0 && shiprocketMessage && !validPincode && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {shiprocketMessage}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="billingSameAsShipping"
                      checked={orderForm.billingSameAsShipping}
                      onCheckedChange={(checked) =>
                        setOrderForm(prev => ({
                          ...prev,
                          billingSameAsShipping: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="billingSameAsShipping" className="text-sm font-normal cursor-pointer">
                      Billing address is the same as shipping address
                    </Label>
                  </div>

                  {!orderForm.billingSameAsShipping && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingFirstName">First Name *</Label>
                          <Input
                            id="billingFirstName"
                            value={orderForm.billingFirstName}
                            onChange={(e) => handleInputChange('billingFirstName', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingLastName">Last Name *</Label>
                          <Input
                            id="billingLastName"
                            value={orderForm.billingLastName}
                            onChange={(e) => handleInputChange('billingLastName', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billingAddress">Street Address *</Label>
                        <Input
                          id="billingAddress"
                          value={orderForm.billingAddress}
                          onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingCity">City *</Label>
                          <Input
                            id="billingCity"
                            value={orderForm.billingCity}
                            onChange={(e) => handleInputChange('billingCity', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingState">State *</Label>
                          <Input
                            id="billingState"
                            value={orderForm.billingState}
                            onChange={(e) => handleInputChange('billingState', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingZipCode">ZIP / PIN Code *</Label>
                          <Input
                            id="billingZipCode"
                            value={orderForm.billingZipCode}
                            onChange={(e) => handleInputChange('billingZipCode', e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingCountry">Country *</Label>
                          <Input
                            id="billingCountry"
                            value={orderForm.billingCountry}
                            onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {merchandiseSettings?.enableShipping && hasCompleteShippingAddress && serviceability?.serviceable && !serviceability.fallback && (serviceability.cheapest || serviceability.fastest) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {serviceability.cheapest && (
                        <button
                          type="button"
                          onClick={() => setShippingMethod('cheapest')}
                          className={cn(
                            "border rounded-lg p-3 text-left transition-colors",
                            shippingMethod === 'cheapest' || !serviceability.fastest
                              ? "border-primary ring-1 ring-primary"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="w-4 h-4" />
                            Cheapest
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{serviceability.cheapest.courierName}</p>
                          <p className="text-sm mt-1">
                            {formatCurrency(serviceability.cheapest.rate, currency)}
                            {serviceability.cheapest.estimatedDays && (
                              <span className="text-muted-foreground"> · {formatEstimatedDays(serviceability.cheapest.estimatedDays)}</span>
                            )}
                          </p>
                        </button>
                      )}
                      {serviceability.fastest && (
                        <button
                          type="button"
                          onClick={() => setShippingMethod('fastest')}
                          className={cn(
                            "border rounded-lg p-3 text-left transition-colors",
                            shippingMethod === 'fastest'
                              ? "border-primary ring-1 ring-primary"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Zap className="w-4 h-4" />
                            Fastest
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{serviceability.fastest.courierName}</p>
                          <p className="text-sm mt-1">
                            {formatCurrency(serviceability.fastest.rate, currency)}
                            {serviceability.fastest.estimatedDays && (
                              <span className="text-muted-foreground"> · {formatEstimatedDays(serviceability.fastest.estimatedDays)}</span>
                            )}
                          </p>
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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

            <div className="space-y-6">
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
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase()
                            setCouponCode(val)
                            if (!val && autoCouponRemoved) {
                              setAutoCouponRemoved(false)
                              triggerAutoCouponApply()
                            }
                          }}
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
                            <div className="font-medium text-green-900 flex items-center gap-2 flex-wrap">
                              <span>{appliedCoupon.name}</span>
                              {isAutoApplied && (
                                <span className="bg-green-100 text-green-800 text-[10px] leading-4 px-1.5 py-0.5 rounded font-medium border border-green-200">
                                  Member Discount Auto-Applied
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-green-700">
                              Code: <code className="font-mono font-semibold">{appliedCoupon.code}</code>
                            </div>
                          </div>
                        </div>
                        {!isAutoApplied ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold underline ml-2 shrink-0"
                          >
                            Remove/Change Code
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {user && <div className="mb-4">
                      <Label>Redeem Points {availablePoints !== null && ` (Available: ${availablePoints} pts)`}</Label>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          min={0}
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(Number(e.target.value || 0))}
                          className="border rounded px-2 py-1 w-32"
                          placeholder="Points"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            if (!user) {
                              toast.error('Please log in to redeem points')
                              return
                            }
                            if (!redeemPoints || redeemPoints <= 0) {
                              toast.error('Enter points to redeem')
                              return
                            }
                            if (subtotalAfterCoupon <= 0) {
                              toast.error('Subtotal is already zero — no need to redeem points')
                              return
                            }
                            if (availablePoints !== null && redeemPoints > availablePoints) {
                              toast.error('You do not have enough points')
                              return
                            }
                            setReserving(true)
                            try {
                              const clubId = typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id
                              if (!clubId) {
                                toast.error('Club information missing for redemption')
                                setReserving(false)
                                return
                              }
                              const orderTotalForReservation = Math.max(subtotalAfterCoupon + displayShipping + displayTax + (feeBreakdown ? feeBreakdown.totalFees : 0), 0)
                              const resp = await apiClient.createReservation(redeemPoints, clubId, orderTotalForReservation)
                              if (resp && resp.success) {
                                setReservationToken(resp.data?.reservationToken || null)
                                setReservedDiscount(resp.data?.discountAmount || 0)
                                toast.success('Points reserved')
                              } else {
                                toast.error(resp?.message || 'Failed to reserve points')
                              }
                            } catch (err: any) {
                              const msg = err?.message || 'Failed to reserve points'
                              toast.error(msg)
                            } finally {
                              setReserving(false)
                            }
                          }}
                        >
                          {reserving ? 'Reserving...' : 'Reserve'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={async () => {
                          if (reservationToken) {
                            try {
                              await apiClient.cancelReservation(reservationToken)
                            } catch (e) {
                            }
                          }
                          setRedeemPoints(0);
                          setReservationToken(null);
                          setReservedDiscount(0);
                        }}>
                          Clear
                        </Button>
                      </div>
                      {reservedDiscount > 0 && (
                        <div className="text-sm text-green-600 mt-2">Discount: {formatCurrency(reservedDiscount, currency)}</div>
                      )}
                    </div>}
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="flex items-center gap-2">
                        {(couponDiscount > 0 || reservedDiscount > 0) ? (
                          <>
                            <span className="line-through text-muted-foreground">{formatCurrency(totalPrice, currency)}</span>
                            <span>{formatCurrency(Math.max(totalPrice - couponDiscount - reservedDiscount, 0), currency)}</span>
                          </>
                        ) : (
                          <span>{formatCurrency(totalPrice, currency)}</span>
                        )}
                      </span>
                    </div>
                    {appliedCoupon && couponDiscount > 0 && (
                      <div className="flex justify-between items-start text-green-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Tag className="w-4 h-4" />
                            <span>Coupon ({appliedCoupon.code})</span>
                          </div>
                          {isAutoApplied && (
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <span className="bg-green-100 text-green-800 text-[10px] leading-4 px-1.5 py-0.5 rounded font-medium border border-green-200">
                                Member Discount Auto-Applied
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveCoupon}
                                className="text-[10px] leading-4 text-red-600 hover:text-red-800 font-semibold underline"
                              >
                                Remove/Change Code
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="font-medium shrink-0">-{formatCurrency(couponDiscount, currency)}</span>
                      </div>
                    )}
                    {reservedDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>- Points discount:</span>
                        <span>-{formatCurrency(reservedDiscount, currency)}</span>
                      </div>
                    )}
                    {merchandiseSettings?.enableShipping && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        {!hasCompleteShippingAddress ? (
                          <span className="text-muted-foreground text-sm">Enter shipping address</span>
                        ) : shiprocketLoading && shippingCost == null ? (
                          <span className="text-muted-foreground text-sm">Calculating...</span>
                        ) : displayShipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span>{formatCurrency(displayShipping, currency)}</span>
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

              {deliveryUnavailable && (
                <p className="text-sm text-destructive text-center">
                  Sorry, we don&apos;t deliver to this area yet
                </p>
              )}
              {/* Place Order Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || items.length === 0 || !hasCompleteShippingAddress || orderBlocked || deliveryUnavailable}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Member Validation Modal */}
      {items.length > 0 && (
        <MemberValidationModal
          isOpen={showMemberValidation}
          onClose={() => setShowMemberValidation(false)}
          clubId={typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id || ''}
          clubName={typeof items[0]?.club === 'object' ? items[0].club?.name : undefined}
          onMemberFound={() => {
            router.push('/login')
            onClose()
          }}
          onNonMemberContinue={() => {
            setMemberValidated(true)
            setShowMemberValidation(false)
            const form = document.querySelector('form')
            if (form) {
              form.requestSubmit()
            }
          }}
          onBecomeMember={() => {
            const clubId = typeof items[0]?.club === 'string' ? items[0].club : items[0]?.club?._id
            router.push(`/membership-plans?clubId=${clubId}`)
            onClose()
          }}
        />
      )}

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
          total={finalAmount}
          subtotal={totalPrice}
          shippingCost={createdOrder.shippingCost ?? resolvedShippingCost}
          tax={createdOrder.tax ?? taxAmount}
          currency={createdOrder.currency ?? currency}
          paymentMethod={createdOrder.paymentMethod || orderForm.paymentMethod || 'all'}
          platformFeeTotal={feeBreakdown ? feeBreakdown.platformFee + feeBreakdown.platformFeeGst : undefined}
          razorpayFeeTotal={feeBreakdown ? feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst : undefined}
          couponDiscount={createdOrder.couponDiscount ?? (couponDiscount > 0 ? couponDiscount : undefined)}
          couponCode={createdOrder.couponCode ?? appliedCoupon?.code}
          pointsDiscount={reservedDiscount > 0 ? reservedDiscount : undefined}
        />
      )}
    </Dialog>
  )
}
