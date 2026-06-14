"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard, Loader2,
  Tag, X, Users
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { resolveCheckoutCharge, type FeeHandlingType } from "@/lib/transactionFees"
import { PriceBreakdown } from "@/components/checkout/price-breakdown"
import { MemberValidationModal } from "./member-validation-modal"
import { RefundPolicyBadge } from "@/components/refund-policy-badge"
import { RefundPolicyCheckoutLine } from "@/components/member/refund-policy-checkout-line"
import { RefundPolicyModal } from "@/components/modals/refund-policy-modal"
import { useCheckoutRefundPolicy } from "@/hooks/useCheckoutRefundPolicy"
import { getJointScreeningClubNames } from "@/lib/joint-screening-clubs"
import { canShowPointsRedemption, validatePointsRedemptionInput } from "@/lib/points-redemption"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface EventCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  event?: {
    _id?: string
    name: string
    price: number
  clubId?: string
    ticketPrice?: number
    earlyBirdDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
      startTime?: string
      endTime?: string
      membersOnly?: boolean
    }
    memberDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
    }
    groupDiscount?: {
      enabled?: boolean
      type?: 'percentage' | 'fixed'
      value?: number
      minQuantity?: number
    }
    currency?: string
    feeHandlingType?: FeeHandlingType
    jointScreening?: {
      enabled?: boolean
      homeTeam?: string
      awayTeam?: string
      partnerClubNames?: string[]
    }
  }
  attendees: Array<{ name: string; phone: string }>
  couponCode?: string
  waitlistToken?: string | null
  onSuccess: () => void
  onFailure: () => void
  /** Skip the in-modal MemberValidationModal — use when the caller already confirmed non-member intent */
  skipMemberValidation?: boolean
}

export function EventCheckoutModal({ isOpen, onClose, event, attendees, couponCode, waitlistToken, onSuccess, onFailure, skipMemberValidation }: EventCheckoutModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [razorpayOpen, setRazorpayOpen] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [showMemberValidation, setShowMemberValidation] = useState(false)
  const [memberValidated, setMemberValidated] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [redeemPoints, setRedeemPoints] = useState<number | string>("")
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState<number>(0)
  const [reserving, setReserving] = useState(false)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [guestEmail, setGuestEmail] = useState("")
  const [guestEmailError, setGuestEmailError] = useState("")
  const [localCouponCode, setLocalCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponApplied, setCouponApplied] = useState(false)
  const [attributedClub, setAttributedClub] = useState("")
  const [attributedClubError, setAttributedClubError] = useState("")
  const [showClubAlert, setShowClubAlert] = useState(false)

    const reservePointsNow = async () => {
    const { orderTotalBeforeCoupon } = getOrderPricing()
    const orderTotalForReservation = Math.max(orderTotalBeforeCoupon - couponDiscount, 0)
    const validationError = validatePointsRedemptionInput(redeemPoints, availablePoints, orderTotalForReservation)
    if (validationError) {
      toast.error(validationError)
      return
    }
    if (!eventData?.clubId) {
      toast.error('Club information is missing for redemption')
      return
    }
    setReserving(true)
    try {
      const redeemPointsNum = Number(redeemPoints) || 0
      const res = await apiClient.createReservation(redeemPointsNum, eventData.clubId, orderTotalForReservation)
        if (res && res.success) {
          setReservationToken(res.data?.reservationToken || null)
          setReservedDiscount(res.data?.discountAmount || 0)
          toast.success('Points reserved')
        } else {
          toast.error(res?.message || 'Failed to reserve points')
        }
    } catch (e) {
      toast.error('Failed to reserve points')
    } finally {
      setReserving(false)
    }
  }

  const clearReservation = async () => {
    if (!reservationToken) {
      setRedeemPoints(0)
      setReservedDiscount(0)
      return
    }
    try {
      await apiClient.cancelReservation(reservationToken)
    } catch (e) {
    }
    setReservationToken(null)
    setRedeemPoints("")
    setReservedDiscount(0)
  }

  useEffect(() => {
    if (isOpen) {
      setMemberValidated(Boolean(skipMemberValidation || user))
      setLocalCouponCode("")
      setCouponApplied(false)
      setCouponDiscount(0)
      setCouponName("")
      setAttributedClub("")
      setAttributedClubError("")
      setShowClubAlert(false)
    }
  }, [isOpen, skipMemberValidation, user])

  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => {
        toast.error("Failed to load payment system. Please refresh the page.")
      }
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [isOpen, scriptLoaded])

  useEffect(() => {
    const fetchEventData = async () => {
      if (event?._id && isOpen && !eventData) {
        try {
          const response = await apiClient.getPublicEventById(String(event._id))
          if (response.success && response.data) {
            setEventData(response.data)
          }
        } catch (error) {
          console.error("Error fetching event data:", error)
        }
      }
    }
    fetchEventData()
  }, [event?._id, isOpen, eventData])

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        if (isOpen && user && (eventData?.clubId || event?.clubId)) {
          const clubId = eventData?.clubId || (event as any)?.clubId
          const resp = await apiClient.getMemberPoints((user as any)._id, clubId)
          if (resp && resp.success && resp.data) {
            setAvailablePoints(resp.data.points || 0)
          }
        }
      } catch (e) {
      }
    }
    fetchPoints()
  }, [isOpen, user, eventData, event])

  const discountSource = eventData || event
  const isMember = Boolean(
    user && (
      (user as any).membershipStatus === 'active' ||
      (user as any).memberships?.some((m: any) => m?.status === 'active')
    )
  )

  const getOrderPricing = () => {
    const ticketPrice = event?.ticketPrice ?? event?.price ?? 0
    const count = attendees.length
    const totalBasePrice = ticketPrice * count
    
    if (!discountSource) {
      return {
        ticketPrice,
        totalBasePrice,
        earlyBirdDiscountTotal: 0,
        memberDiscountPerTicket: 0,
        memberDiscountTotal: 0,
        groupDiscountPerTicket: 0,
        groupDiscountTotal: 0,
        orderTotalBeforeCoupon: totalBasePrice
      }
    }

    let earlyBirdDiscountTotal = 0
    if (discountSource.earlyBirdDiscount?.enabled) {
      const eb = discountSource.earlyBirdDiscount
      if (!eb.membersOnly || isMember) {
        const now = new Date()
        const startTime = new Date(eb.startTime ?? 0)
        const endTime = new Date(eb.endTime ?? 0)
        if (now >= startTime && now <= endTime) {
          earlyBirdDiscountTotal = eb.type === 'percentage' 
            ? (ticketPrice * (eb.value ?? 0)) / 100 
            : (eb.value ?? 0)
        }
      }
    }

    let memberDiscountPerTicket = 0
    if (discountSource.memberDiscount?.enabled && isMember) {
      const md = discountSource.memberDiscount
      memberDiscountPerTicket = md.type === 'percentage' 
        ? (ticketPrice * (md.value ?? 0)) / 100 
        : (md.value ?? 0)
    }
    const memberDiscountTotal = memberDiscountPerTicket * count

    let groupDiscountPerTicket = 0
    if (discountSource.groupDiscount?.enabled && count >= (discountSource.groupDiscount.minQuantity ?? 2)) {
      const gd = discountSource.groupDiscount
      groupDiscountPerTicket = gd.type === 'percentage' 
        ? (ticketPrice * (gd.value ?? 0)) / 100 
        : (gd.value ?? 0)
    }
    const groupDiscountTotal = groupDiscountPerTicket * count

    const orderTotalBeforeCoupon = Math.max(totalBasePrice - earlyBirdDiscountTotal - memberDiscountTotal - groupDiscountTotal, 0)

    return {
      ticketPrice,
      totalBasePrice,
      earlyBirdDiscountTotal,
      memberDiscountPerTicket,
      memberDiscountTotal,
      groupDiscountPerTicket,
      groupDiscountTotal,
      orderTotalBeforeCoupon
    }
  }

  const checkoutEventId = event?._id ? String(event._id) : undefined
  const isPaidCheckout = (event?.ticketPrice ?? event?.price ?? 0) > 0
  const refundPolicy = useCheckoutRefundPolicy(checkoutEventId, isOpen, isPaidCheckout)

  const handleValidateCoupon = async () => {
    if (!localCouponCode.trim() || !event?._id) {
      toast.error("Please enter a coupon code")
      return
    }
    const { orderTotalBeforeCoupon } = getOrderPricing()
    if (orderTotalBeforeCoupon <= 0) {
      toast.error("This event is free, coupons are not applicable")
      return
    }
    setValidatingCoupon(true)
    try {
      const clubId = eventData?.clubId || (event as any)?.clubId
      const response = await apiClient.validateCoupon(localCouponCode.toUpperCase(), String(event._id), orderTotalBeforeCoupon, clubId)
      if (response.success && response.data?.coupon) {
        setCouponDiscount(response.data.coupon.discount)
        setCouponName(response.data.coupon.name)
        setCouponApplied(true)
        toast.success("Coupon applied!")
      } else {
        setCouponDiscount(0)
        setCouponName("")
        setCouponApplied(false)
        toast.error(response.error || "Invalid coupon code")
      }
    } catch {
      setCouponDiscount(0)
      setCouponName("")
      toast.error("Failed to validate coupon")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied(false)
    setLocalCouponCode("")
    setCouponDiscount(0)
    setCouponName("")
    toast.info("Coupon removed")
  }

  const jointScreening = eventData?.jointScreening
  const isJointEvent = Boolean(jointScreening?.enabled && (jointScreening?.partnerClubNames?.length ?? 0) > 0)
  const affiliationClubOptions = getJointScreeningClubNames(jointScreening ?? undefined)

  const handlePayment = async () => {
    if (!refundPolicy.ensureAgreed()) {
      toast.error('Review the refund policy and tap "I Agree" before continuing.')
      return
    }
    if (!scriptLoaded) {
      toast.error("Payment system is still loading. Please wait.")
      return
    }

    if (!event?._id) {
      toast.error("Event information is missing")
      return
    }

    if (isJointEvent && !attributedClub) {
      setAttributedClubError("Please select your club affiliation to continue")
      setShowClubAlert(true)
      return
    }

    // Validate remaining seats using fresh event data
    if (eventData?.maxAttendees != null) {
      const remaining = Math.max(0, eventData.maxAttendees - (eventData.currentAttendees || 0))
      if (attendees.length > remaining) {
        toast.error(remaining === 0 ? "This event is now full" : `Only ${remaining} seat${remaining !== 1 ? 's' : ''} remaining — please reduce attendees`)
        return
      }
    }

    if (!user && !memberValidated) {
      setShowMemberValidation(true)
      return
    }

    if (!user) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!guestEmail.trim()) {
        setGuestEmailError("Email is required")
        return
      }
      if (!emailRegex.test(guestEmail.trim())) {
        setGuestEmailError("Enter a valid email address")
        return
      }
      setGuestEmailError("")
    }

    setLoading(true)

    try {
      const { orderTotalBeforeCoupon, earlyBirdDiscountTotal } = getOrderPricing()

      const eventSubtotalAfterCoupon = Math.max(orderTotalBeforeCoupon - couponDiscount, 0)
      const displayShipping = 0
      const displayTax = 0
      const adjustedFinalPrice = Math.max(eventSubtotalAfterCoupon + displayShipping + displayTax - (reservedDiscount || 0), 0)

      if (adjustedFinalPrice <= 0) {
        if (reservationToken) {
          try {
            await apiClient.confirmReservation(reservationToken)
          } catch (e) {}
        }

        const response = user
          ? await apiClient.registerForEvent(
              String(event._id),
              undefined,
              attendees,
              localCouponCode || undefined,
              undefined,
              undefined,
              undefined,
              waitlistToken || undefined,
              reservationToken || undefined,
              0,
              couponDiscount || undefined,
              earlyBirdDiscountTotal || undefined,
              reservedDiscount || undefined,
              attributedClub || undefined,
            )
          : await apiClient.registerForPublicEvent(String(event._id), {
              registrantName: attendees?.[0]?.name || 'Guest',
              registrantPhone: attendees?.[0]?.phone || '',
              registrantEmail: guestEmail.trim(),
              attendees,
              couponCode: localCouponCode || undefined,
              reservationToken: reservationToken || undefined,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: earlyBirdDiscountTotal || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
            })

        if (response.success) {
          toast.success("Successfully registered for event!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          onFailure()
          router.push("/purchase/failure")
        }
        setLoading(false)
        return
      }

      // Recompute payment amount including shipping and tax (reuse `eventSubtotalAfterCoupon` from above)
      const paymentSubtotal = eventSubtotalAfterCoupon
      const paymentShipping = displayShipping
      const paymentTax = displayTax
      const paymentNet = Math.max(paymentSubtotal + paymentShipping + paymentTax - (reservedDiscount || 0), 0)
      // When the club absorbs fees, the buyer is charged the base net only.
      const { amountToCharge } = resolveCheckoutCharge(paymentNet, event?.feeHandlingType)

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency || 'INR',
          orderId: `EVT-${Date.now()}`,
          orderNumber: `EVT-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment order')
      }

      const { razorpayOrderId, amount, currency: orderCurrency } = await response.json()
      
      const pendingResponse = user
        ? await apiClient.createPendingRegistration(String(event._id), {
            attendees,
            couponCode: localCouponCode || undefined,
            razorpayOrderId,
            amountPaid: Math.round(amountToCharge),
            waitlistToken: waitlistToken || undefined,
            reservationToken: reservationToken || undefined,
            couponDiscount: couponDiscount || undefined,
            earlyBirdDiscountAmt: earlyBirdDiscountTotal || undefined,
            pointsDiscount: reservedDiscount || undefined,
            attributed_club: attributedClub || undefined,
          })
        : await apiClient.createPendingPublicRegistration(String(event._id), {
            registrantName: attendees?.[0]?.name || 'Guest',
            registrantEmail: guestEmail.trim(),
            registrantPhone: attendees?.[0]?.phone || '',
            attendees,
            couponCode: localCouponCode || undefined,
            razorpayOrderId,
            amountPaid: Math.round(amountToCharge),
            reservationToken: reservationToken || undefined,
            couponDiscount: couponDiscount || undefined,
            earlyBirdDiscountAmt: earlyBirdDiscountTotal || undefined,
            pointsDiscount: reservedDiscount || undefined,
            attributed_club: attributedClub || undefined,
          })

      if (!pendingResponse.success) {
        const pendingMessage =
          pendingResponse.message ||
          pendingResponse.error ||
          'Unable to start checkout for this event. Please check your details or contact support.'
        console.warn('[EventCheckoutModal] Pending registration rejected:', {
          status: pendingResponse.status,
          message: pendingMessage,
          razorpayOrderId,
        })
        toast.error(pendingMessage)
        if (reservationToken) {
          try {
            await apiClient.cancelReservation(reservationToken)
          } catch {
            // ignore
          }
        }
        setLoading(false)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: orderCurrency,
        name: 'RallyUp',
        description: `Payment for ${event.name} - ${attendees.length} ticket(s)`,
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
          const paymentId: string = response.razorpay_payment_id
          const orderId: string = response.razorpay_order_id
          const signature: string = response.razorpay_signature

          try {
            // Verify the payment signature. If the verify endpoint itself fails (network
            // issues, server error) we still proceed with registration because Razorpay
            // already confirmed the payment by invoking this handler. The backend
            // `registerForEvent` endpoint re-validates the signature server-side.
            try {
              const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: paymentId,
                  razorpay_signature: signature,
                  orderId: `event_${event._id}_${Date.now()}`,
                }),
              })
              if (!verifyResponse.ok) {
                // Log but don't block — backend will re-verify
                console.error('Frontend signature check returned non-OK; proceeding with registration')
              }
            } catch (verifyNetworkError) {
              // Verify request itself failed (network). Still attempt registration.
              console.error('Verify request failed:', verifyNetworkError)
            }

            if (reservationToken) {
              try {
                await apiClient.confirmReservation(reservationToken, orderId)
              } catch (e) {
              }
            }

            // Round to match what Razorpay actually charged (create-order uses Math.round)
            const amountCharged = Math.round(amountToCharge)
            const registerResponse = user
              ? await apiClient.registerForEvent(
                  String(event._id),
                  undefined,
                  attendees,
                  localCouponCode || undefined,
                  orderId,
                  paymentId,
                  signature,
                  waitlistToken || undefined,
                  reservationToken || undefined,
                  amountCharged,
                  couponDiscount || undefined,
                  earlyBirdDiscountTotal || undefined,
                  reservedDiscount || undefined,
                  attributedClub || undefined,
                )
              : await apiClient.registerForPublicEvent(String(event._id), {
                  registrantName: attendees?.[0]?.name || 'Guest',
                  registrantPhone: attendees?.[0]?.phone || '',
                  registrantEmail: guestEmail.trim(),
                  attendees,
                  couponCode: localCouponCode || undefined,
                  orderID: orderId,
                  paymentID: paymentId,
                  signature,
                  reservationToken: reservationToken || undefined,
                  amountPaid: amountCharged,
                  couponDiscount: couponDiscount || undefined,
                  earlyBirdDiscountAmt: earlyBirdDiscountTotal || undefined,
                  pointsDiscount: reservedDiscount || undefined,
                  attributed_club: attributedClub || undefined,
                })

            if (registerResponse.success) {
              toast.success("Payment successful! You are now registered for the event.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              // Payment went through but our backend rejected registration.
              console.error('[EventCheckoutModal] Registration failed after payment:', {
                paymentId,
                orderId,
                status: registerResponse.status,
                error: registerResponse.error,
                data: registerResponse.data,
              })
              toast.error(
                `Payment received (ID: ${paymentId}) but registration failed — ${registerResponse.error || 'please contact support with your payment ID.'}`
              )
              setRazorpayOpen(false)
            }
          } catch (error) {
            // Unexpected error after payment. Show payment ID so user isn't stuck.
            console.error('[EventCheckoutModal] Unexpected error after payment:', error)
            toast.error(
              `Something went wrong after payment (ID: ${paymentId}). Please contact support with your payment ID.`
            )
            setRazorpayOpen(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user?.name || attendees?.[0]?.name || '',
          email: user?.email || guestEmail.trim() || '',
          contact: user?.phoneNumber || attendees?.[0]?.phone || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          }
        }
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment processing failed. Please try again.")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        onClose()
        router.push("/purchase/failure")
      })

      setRazorpayOpen(true)
      razorpay.open()
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const priceBeforeDiscount = event?.ticketPrice ?? event?.price ?? 0
  const { totalBasePrice, earlyBirdDiscountTotal, memberDiscountPerTicket, groupDiscountPerTicket, memberDiscountTotal, groupDiscountTotal, orderTotalBeforeCoupon } = getOrderPricing()
  const finalPrice = Math.max(orderTotalBeforeCoupon - couponDiscount, 0);
  const showPointsRedemption = canShowPointsRedemption(availablePoints, finalPrice)
  const netSubtotal = Math.max(finalPrice - (reservedDiscount || 0), 0);
  // Fees are calculated on the final net amount (after all discounts). When the
  // club absorbs fees, the buyer pays the base net and fees are not appended.
  const { feeBreakdown, amountToCharge, feesAbsorbed } = resolveCheckoutCharge(netSubtotal, event?.feeHandlingType);

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'CA$',
    JPY: '¥',
    CNY: '¥',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    TRY: '₺',
    DKK: 'kr',
    ILS: '₪',
    PLN: 'zł'
  }

  const formatCurrency = (amount: number, cur?: string) => {
    const c = cur || event?.currency || 'INR'
    const symbol = currencySymbols[c] || (c + ' ')
    return `${symbol}${Number(amount || 0).toLocaleString()}`
  }

  if (!event) {
    return null;
  }

  return (
    <>
      <AlertDialog open={showClubAlert} onOpenChange={setShowClubAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Your Club Affiliation</AlertDialogTitle>
            <AlertDialogDescription>
              This is a joint screening event. Please select the club you support before proceeding to payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowClubAlert(false)}>OK, I'll select</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    <Dialog open={isOpen} onOpenChange={() => { if (!razorpayOpen) onClose() }} modal={!razorpayOpen}>
      <DialogContent
        className={`max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 ${refundPolicy.policyModalOpen ? "pointer-events-none" : ""}`}
        onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Event Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your payment for the event
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{event?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {isJointEvent && (
                <div className="mb-4 space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Club Affiliation <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    This is a joint screening. Please select your club so revenue can be attributed correctly.
                  </p>
                  <Select
                    value={attributedClub}
                    onValueChange={(v) => {
                      setAttributedClub(v)
                      if (v) setAttributedClubError("")
                    }}
                  >
                    <SelectTrigger className={attributedClubError ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select your club…" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliationClubOptions.map((club) => (
                        <SelectItem key={club} value={club}>{club}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attributedClubError && (
                    <p className="text-xs text-destructive">{attributedClubError}</p>
                  )}
                  <Separator className="mt-3" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span>Price per ticket:</span>
                  <span className="flex items-center gap-2">
                    <span>{formatCurrency(priceBeforeDiscount, event.currency)}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span>Number of tickets:</span>
                  <span>{attendees.length}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-medium text-sm sm:text-base">
                  <span>Base Subtotal:</span>
                  <span>{formatCurrency(totalBasePrice, event.currency)}</span>
                </div>

                {earlyBirdDiscountTotal > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-green-600">
                    <span>Early bird discount:</span>
                    <span>-{formatCurrency(earlyBirdDiscountTotal, event.currency)}</span>
                  </div>
                )}
                {memberDiscountTotal > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-blue-600">
                    <span>Member discount:</span>
                    <span>-{formatCurrency(memberDiscountTotal, event.currency)}</span>
                  </div>
                )}
                {groupDiscountTotal > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-purple-600">
                    <span>Group discount:</span>
                    <span>-{formatCurrency(groupDiscountTotal, event.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center font-medium text-sm sm:text-base">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderTotalBeforeCoupon, event.currency)}</span>
                </div>

                {couponApplied && couponDiscount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-green-600 text-sm">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Coupon ({localCouponCode}){couponName ? ` — ${couponName}` : ''}
                      </span>
                      <span>-{formatCurrency(couponDiscount, event.currency)}</span>
                    </div>
                    <Separator />
                  </>
                )}

                {reservedDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Points discount:</span>
                    <span>-{formatCurrency(reservedDiscount, event.currency)}</span>
                  </div>
                )}

                {netSubtotal > 0 && (
                  <PriceBreakdown
                    baseAmount={netSubtotal}
                    pgFeeTotal={feeBreakdown ? feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst : 0}
                    platformFeeTotal={feeBreakdown ? feeBreakdown.platformFee + feeBreakdown.platformFeeGst : 0}
                    total={amountToCharge}
                    feeHandlingType={event?.feeHandlingType}
                    formatCurrency={(a) => formatCurrency(a, event.currency)}
                  />
                )}
                {feesAbsorbed && netSubtotal > 0 && (
                  <p className="text-xs text-green-600">Platform &amp; gateway fees are covered by the organiser.</p>
                )}
                
                  {user && showPointsRedemption && (
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Redeem Points {availablePoints !== null && ` (Available: ${availablePoints} pts)`}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      min={1}
                      max={availablePoints || undefined}
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full sm:w-32 flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Points"
                      disabled={!!reservationToken || reserving}
                    />
                    <div className="flex gap-2">
                      {reservationToken ? (
                        <Button disabled size="sm" variant="outline" className="flex-1 sm:flex-none border-green-500 text-green-600 opacity-100">
                          Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={reservePointsNow}
                          disabled={reserving || !redeemPoints || Number(redeemPoints) <= 0}
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          {reserving ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Reserving...
                            </div>
                          ) : 'Reserve'}
                        </Button>
                      )}

                      {(redeemPoints !== "" || reservationToken) && (
                        <Button
                          variant="ghost"
                          onClick={clearReservation}
                          disabled={reserving}
                          size="sm"
                          className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  {reservationToken && (
                    <div className="text-sm text-green-600">
                      Reserved discount: {formatCurrency(reservedDiscount, event.currency)}
                    </div>
                  )}
                  </div>
                  )}

                <Separator className="my-2" />
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Have a Coupon Code?
                  </label>
                  {!couponApplied ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localCouponCode}
                        onChange={(e) => setLocalCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        disabled={validatingCoupon}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleValidateCoupon() } }}
                      />
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={!localCouponCode.trim() || validatingCoupon}
                        size="sm"
                        variant="outline"
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500 rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{couponName}</p>
                        <p className="text-muted-foreground text-xs">Code: {localCouponCode}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-destructive hover:text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

              </div>
              
              {!user && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value)
                        if (guestEmailError) setGuestEmailError("")
                      }}
                      placeholder="Enter your email"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {guestEmailError && (
                      <p className="text-xs text-destructive">{guestEmailError}</p>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium mb-2">Attendees:</h4>
                <ul className="list-disc pl-5 text-sm max-h-32 overflow-y-auto">
                  {attendees.map((attendee, index) => (
                    <li key={index}>{attendee.name} ({attendee.phone})</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {checkoutEventId && (
            <div className="flex flex-col gap-3 mt-4 pb-2">
              <RefundPolicyCheckoutLine eventId={checkoutEventId} />
              {isPaidCheckout && (
                <div className="flex flex-col items-center gap-2">
                  <RefundPolicyBadge
                    eventId={checkoutEventId}
                    source="checkout"
                    isCheckoutFlow
                    onRequestViewPolicy={() => refundPolicy.setPolicyModalOpen(true)}
                  />
                  {refundPolicy.payBlockedByPolicy && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 text-center max-w-sm">
                      Review the refund policy and tap &quot;I Agree&quot; before paying.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center mt-3 pb-2">
            Platform fees and taxes may be non-refundable per{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Global Platform Terms
            </a>
            .
          </p>
        </div>

        <div className="flex-shrink-0 pt-4 pb-2 sm:pb-0 mt-4 border-t bg-background shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="flex justify-between items-center font-bold text-lg px-1 mb-3">
            <span>Total to Pay:</span>
            <span className="text-primary">{formatCurrency(amountToCharge, event.currency)}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={loading || refundPolicy.payBlockedByPolicy}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              "Pay Now"
            )}
          </Button>
        </div>
      </DialogContent>

      {checkoutEventId && (
        <RefundPolicyModal
          eventId={checkoutEventId}
          open={refundPolicy.policyModalOpen}
          onOpenChange={(open) => refundPolicy.handlePolicyModalOpenChange(open, onClose)}
          isCheckoutFlow
          source="checkout"
          onAcknowledged={refundPolicy.onPolicyAcknowledged}
        />
      )}

      {eventData?.clubId && (
        <MemberValidationModal
          isOpen={showMemberValidation}
          onClose={() => setShowMemberValidation(false)}
          clubId={eventData.clubId}
          onMemberFound={() => {
            router.push('/login')
            onClose()
          }}
          onNonMemberContinue={() => {
            setMemberValidated(true)
            setShowMemberValidation(false)
          }}
          onBecomeMember={() => {
            router.push(`/membership-plans?clubId=${eventData.clubId}`)
            onClose()
          }}
        />
      )}
    </Dialog>
    </>
  )
}