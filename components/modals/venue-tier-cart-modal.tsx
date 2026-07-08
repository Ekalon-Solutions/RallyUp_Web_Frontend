"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard, Loader2, Plus, Minus, MapPin, Tag, X, User, Phone, Users,
  ChevronDown, ChevronRight, CheckCircle, CheckCircle2, MessageCircle,
} from "lucide-react"
import { toast } from "sonner"
import { apiClient, Event, VenueTierCartItem } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { resolveCheckoutCharge } from "@/lib/transactionFees"
import { PriceBreakdown } from "@/components/checkout/price-breakdown"
import { useRouter } from "next/navigation"
import { RefundPolicyBadge } from "@/components/refund-policy-badge"
import { RefundPolicyCheckoutLine } from "@/components/member/refund-policy-checkout-line"
import { RefundPolicyModal } from "@/components/modals/refund-policy-modal"
import { useCheckoutRefundPolicy } from "@/hooks/useCheckoutRefundPolicy"
import { getJointScreeningClubNames } from "@/lib/joint-screening-clubs"
import { canShowPointsRedemption, validatePointsRedemptionInput } from "@/lib/points-redemption"
import { hasVenueTierMatrix, isEventPaid } from "@/lib/event-display-price"
import { formatPhoneForDisplay } from "@/components/modals/purchase-flow-modal"

declare global {
  interface Window { Razorpay: any }
}

interface GuestIdentity {
  name: string
  phone: string
  countryCode: string
}

interface VenueTierCartModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onSuccess: () => void
  onFailure: () => void
  onLogin?: (guest: GuestIdentity) => void
  onSignup?: (guest: GuestIdentity) => void
  waitlistToken?: string | null
}

interface AttendeeSlot {
  venueId: string
  venueName: string
  tierId: string
  tierName: string
  name: string
  phone: string
}

interface SimpleAttendee {
  phoneFull?: string
  name: string
  phone: string
  phoneCode?: string
  open?: boolean
}

interface CartState {
  [venueId: string]: { [tierId: string]: number }
}

const SIMPLE_VENUE_ID = "simple"
const SIMPLE_TIER_ID = "simple"
const SIMPLE_TIER_NAME = "General Admission"

const currencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "CA$",
  JPY: "¥", BRL: "R$", MXN: "$", ZAR: "R",
}

function fmt(amount: number, currency = "INR") {
  const sym = currencySymbols[currency] ?? currency + " "
  return `${sym}${Number(amount).toLocaleString()}`
}

const digitsOnly = (s: string) => (s || '').replace(/[^0-9]/g, '')
const phoneCodeRegex = /^\+?\d{1,4}$/
const normalizeCountryCode = (code: string) => {
  const trimmed = (code || '').trim() || '+91'
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

type GuestStep = 'identify' | 'member-found' | 'guest-or-signup' | 'otp' | 'attendees'

export function VenueTierCartModal({ isOpen, onClose, event, onSuccess, onFailure, onLogin, onSignup, waitlistToken }: VenueTierCartModalProps) {
  const { user, checkAuth, login } = useAuth()
  const router = useRouter()

  const hasAuthToken = typeof window !== "undefined" && !!localStorage.getItem("token")
  const isAuthenticated = Boolean(user?._id)
  const isLoggedIn = isAuthenticated || hasAuthToken
  const authStillLoading = hasAuthToken && !isAuthenticated
  const isSimpleEvent = event ? !hasVenueTierMatrix(event) : false
  const showGuestWizard = !isLoggedIn

  // Tier-matrix cart state
  const [cart, setCart] = useState<CartState>({})
  const [attendeeSlots, setAttendeeSlots] = useState<AttendeeSlot[]>([])

  // Simple-event ticket state
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [simpleAttendees, setSimpleAttendees] = useState<SimpleAttendee[]>([{ name: '', phone: '', phoneCode: '', open: true }])
  const [remainingSeats, setRemainingSeats] = useState<number | null>(null)
  const [guestEmail, setGuestEmail] = useState("")
  const [guestEmailError, setGuestEmailError] = useState("")

  // Guest identification wizard (simple events, logged-out only)
  const [step, setStep] = useState<GuestStep>('attendees')
  const [primaryName, setPrimaryName] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')
  const [primaryCountryCode, setPrimaryCountryCode] = useState('+91')
  const [identifyChecking, setIdentifyChecking] = useState(false)
  const [identifyError, setIdentifyError] = useState<string | null>(null)
  const [guestMemberInfo, setGuestMemberInfo] = useState<{ isMember: boolean; memberName?: string } | null>(null)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpSessionInfo, setOtpSessionInfo] = useState<string | null>(null)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Inline member login OTP (member-found step)
  const [memberLoginOtpSent, setMemberLoginOtpSent] = useState(false)
  const [memberLoginOtp, setMemberLoginOtp] = useState('')
  const [memberLoginOtpSending, setMemberLoginOtpSending] = useState(false)
  const [memberLoginOtpVerifying, setMemberLoginOtpVerifying] = useState(false)
  const [memberLoginSessionInfo, setMemberLoginSessionInfo] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [razorpayOpen, setRazorpayOpen] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [localCouponCode, setLocalCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [isAutoApplied, setIsAutoApplied] = useState(false)
  const [autoCouponRemoved, setAutoCouponRemoved] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState<number | string>("")
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState(0)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [reserving, setReserving] = useState(false)
  const [attributedClub, setAttributedClub] = useState("")
  const [showClubAlert, setShowClubAlert] = useState(false)

  const jointScreening = event?.jointScreening
  const isJointEvent = Boolean(jointScreening?.enabled && (jointScreening?.partnerClubNames?.length ?? 0) > 0)
  const affiliationClubOptions = getJointScreeningClubNames(jointScreening ?? undefined)

  const userDefaultName: string = (user as any)?.name
    ?? `${(user as any)?.first_name ?? ""} ${(user as any)?.last_name ?? ""}`.trim()
    ?? ""
  const userDefaultPhone: string = (user as any)?.phoneNumber ?? (user as any)?.phone ?? ""

  const isMember = Boolean(
    user && (
      (user as any).membershipStatus === 'active' ||
      (user as any).memberships?.some((m: any) => m?.status === 'active')
    )
  )

  // Reset all state on open/close; skip guest wizard when session exists
  useEffect(() => {
    if (isOpen) {
      if (hasAuthToken && !isAuthenticated) {
        void checkAuth()
      }
      setCart({})
      setAttendeeSlots([])
      setTicketCount(1)
      setSimpleAttendees([{ name: '', phone: '', phoneCode: '', open: true }])
      setRemainingSeats(null)
      setGuestEmail("")
      setGuestEmailError("")
      setStep(isLoggedIn ? 'attendees' : 'identify')
      setPrimaryName('')
      setPrimaryPhone('')
      setPrimaryCountryCode('+91')
      setIdentifyChecking(false)
      setIdentifyError(null)
      setGuestMemberInfo(null)
      setOtp('')
      setOtpSent(false)
      setOtpVerified(false)
      setOtpSessionInfo(null)
      setOtpSending(false)
      setOtpVerifying(false)
      setResendCountdown(0)
      setMemberLoginOtpSent(false)
      setMemberLoginOtp('')
      setMemberLoginOtpSending(false)
      setMemberLoginOtpVerifying(false)
      setMemberLoginSessionInfo(null)
      setLocalCouponCode("")
      setCouponApplied(false)
      setCouponDiscount(0)
      setCouponName("")
      setIsAutoApplied(false)
      setAutoCouponRemoved(false)
      setRedeemPoints("")
      setReservationToken(null)
      setReservedDiscount(0)
      setAttributedClub("")
      setShowClubAlert(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return
    setStep('attendees')
    const userAny = user as any
    const name = [userAny.first_name, userAny.last_name].filter(Boolean).join(" ").trim() || userAny.name || userAny.username || ""
    const phone = String(userAny.phoneNumber || "").replace(/\D/g, "")
    const phoneCode = userAny.countryCode || "+91"
    if (name || phone) {
      setPrimaryName(name)
      setPrimaryPhone(phone)
      setPrimaryCountryCode(phoneCode)
      setSimpleAttendees([{ name, phone, phoneCode, open: true }])
    }
  }, [isOpen, isAuthenticated, user])

  useEffect(() => {
    if (!event?.venues || !hasVenueTierMatrix(event)) return
    setAttendeeSlots(prev => {
      const newSlots: AttendeeSlot[] = []
      for (const venue of event.venues!) {
        for (const tier of (Array.isArray(venue.tiers) ? venue.tiers : [])) {
          const qty = cart[venue._id]?.[tier._id] ?? 0
          const existing = prev.filter(s => s.venueId === venue._id && s.tierId === tier._id)
          for (let q = 0; q < qty; q++) {
            const slot = existing[q]
            const isVeryFirst = newSlots.length === 0 && q === 0
            newSlots.push(slot ?? {
              venueId: venue._id,
              venueName: venue.name,
              tierId: tier._id,
              tierName: tier.name,
              name: isVeryFirst ? userDefaultName : "",
              phone: isVeryFirst ? userDefaultPhone : "",
            })
          }
        }
      }
      return newSlots
    })
  }, [cart])

  // Fetch fresh remaining-seat count for simple events
  useEffect(() => {
    if (!isOpen || !event?._id || !isSimpleEvent) return
    apiClient.getPublicEventById(event._id).then(res => {
      if (res.success && res.data) {
        const { maxAttendees, currentAttendees } = res.data
        setRemainingSeats(maxAttendees != null ? Math.max(0, maxAttendees - (currentAttendees || 0)) : null)
      }
    }).catch(() => {
      if (event.maxAttendees != null) {
        setRemainingSeats(Math.max(0, event.maxAttendees - (event.currentAttendees || 0)))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event?._id, isSimpleEvent])

  // Keep simple-event attendee list in sync with ticket count
  useEffect(() => {
    if (!isSimpleEvent) return
    setSimpleAttendees(prev => {
      const copy = [...prev]
      if (ticketCount > copy.length) {
        for (let i = copy.length; i < ticketCount; i++) copy.push({ name: '', phone: '', phoneCode: '', open: false })
      } else if (ticketCount < copy.length) {
        copy.length = ticketCount
      }
      if (copy[0]) copy[0].open = true

      if (isOpen && user && copy[0]) {
        const userName = (user as any).name || `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim()
        const userPhone = (user as any).phoneNumber || (user as any).phone || ''
        const userCode = (user as any).countryCode || ''
        if (!copy[0].name && userName) copy[0].name = userName
        if (!copy[0].phone && userPhone) copy[0].phone = userPhone
        if (!copy[0].phoneCode && userCode) copy[0].phoneCode = userCode
      }
      return copy
    })
  }, [ticketCount, isOpen, user, isSimpleEvent])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => toast.error("Failed to load payment system. Please refresh.")
      document.body.appendChild(script)
      return () => { if (document.body.contains(script)) document.body.removeChild(script) }
    }
  }, [isOpen, scriptLoaded])

  useEffect(() => {
    if (isOpen && user && event?.clubId) {
      apiClient.getMemberPoints((user as any)._id, event.clubId)
        .then((res) => { if (res.success && res.data) setAvailablePoints(res.data.points ?? 0) })
        .catch(() => {})
    }
  }, [isOpen, user, event])

  const venues = event?.venues ?? []

  const cartItems: Array<VenueTierCartItem & { venueName: string; tierName: string; price: number }> = []
  for (const venue of venues) {
    for (const tier of (Array.isArray(venue.tiers) ? venue.tiers : [])) {
      const qty = cart[venue._id]?.[tier._id] ?? 0
      if (qty > 0) {
        cartItems.push({
          venueId: venue._id,
          tierId: tier._id,
          quantity: qty,
          venueName: venue.name,
          tierName: tier.name,
          price: tier.price,
        })
      }
    }
  }

  // Simple-event pricing — early bird / member / group discounts (ported from event-checkout-modal getOrderPricing)
  const simpleTicketPrice = event?.ticketPrice ?? 0
  const simpleTotalBasePrice = simpleTicketPrice * ticketCount
  let simpleEarlyBirdDiscountTotal = 0
  let simpleMemberDiscountTotal = 0
  let simpleGroupDiscountTotal = 0
  if (isSimpleEvent && event) {
    const eb = (event as any).earlyBirdDiscount
    if (eb?.enabled && (!eb.membersOnly || isMember)) {
      const now = new Date()
      const startTime = new Date(eb.startTime ?? 0)
      const endTime = new Date(eb.endTime ?? 0)
      if (now >= startTime && now <= endTime) {
        simpleEarlyBirdDiscountTotal = eb.type === 'percentage'
          ? (simpleTicketPrice * (eb.value ?? 0)) / 100 * ticketCount
          : (eb.value ?? 0) * ticketCount
      }
    }
    const md = (event as any).memberDiscount
    if (md?.enabled && isMember) {
      const memberDiscountPerTicket = md.type === 'percentage'
        ? (simpleTicketPrice * (md.value ?? 0)) / 100
        : (md.value ?? 0)
      simpleMemberDiscountTotal = memberDiscountPerTicket * ticketCount
    }
    const gd = (event as any).groupDiscount
    if (gd?.enabled && ticketCount >= (gd.minQuantity ?? 2)) {
      const groupDiscountPerTicket = gd.type === 'percentage'
        ? (simpleTicketPrice * (gd.value ?? 0)) / 100
        : (gd.value ?? 0)
      simpleGroupDiscountTotal = groupDiscountPerTicket * ticketCount
    }
  }
  const simpleOrderTotalBeforeCoupon = Math.max(
    simpleTotalBasePrice - simpleEarlyBirdDiscountTotal - simpleMemberDiscountTotal - simpleGroupDiscountTotal, 0
  )

  const subtotalBase = isSimpleEvent
    ? simpleOrderTotalBeforeCoupon
    : cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  let earlyBirdDiscountTotal = 0
  if (!isSimpleEvent && event) {
    const eb = (event as any).earlyBirdDiscount
    if (eb?.enabled && (!eb.membersOnly || isMember)) {
      const now = new Date()
      const startTime = new Date(eb.startTime ?? 0)
      const endTime = new Date(eb.endTime ?? 0)
      if (now >= startTime && now <= endTime) {
        earlyBirdDiscountTotal = eb.type === 'percentage'
          ? (subtotalBase * (eb.value ?? 0)) / 100
          : Math.min(eb.value ?? 0, subtotalBase)
      }
    }
  }

  const subtotal = Math.max(subtotalBase - earlyBirdDiscountTotal, 0)
  const afterCoupon = Math.max(subtotal - couponDiscount, 0)
  const payableBeforePoints = afterCoupon
  const showPointsRedemption = canShowPointsRedemption(availablePoints, payableBeforePoints)
  const netAmount = Math.max(afterCoupon - (reservedDiscount || 0), 0)
  // When the club absorbs fees, the buyer pays the base net and fees are not appended.
  const clubFeePercent = (event as any)?.platformFeePercent ?? 5
  const { feeBreakdown, amountToCharge, feesAbsorbed } = resolveCheckoutCharge(netAmount, event?.feeHandlingType, clubFeePercent)
  const checkoutEventId = event?._id ? String(event._id) : undefined
  const isPaidCheckout = event ? isEventPaid(event) : false
  const refundPolicy = useCheckoutRefundPolicy(checkoutEventId, isOpen, isPaidCheckout)

  const triggerAutoCouponApply = useCallback(async (currentSubtotal: number, phoneNumber?: string, emailAddress?: string) => {
    if (autoCouponRemoved) return

    const searchPhone = phoneNumber || primaryPhone || user?.phoneNumber || localStorage.getItem("rallyup_verified_guest_phone") || ""
    const searchEmail = emailAddress || guestEmail || user?.email || ""
    const clubId = event?.clubId || (event as any)?.club?._id

    if (!clubId || (!searchPhone && !searchEmail)) return
    if (currentSubtotal <= 0) return

    try {
      const res = await apiClient.getHighestEligibleAutoCoupon({
        clubId,
        phone: searchPhone || undefined,
        email: searchEmail || undefined,
        cartSubtotal: currentSubtotal,
        eventId: event?._id || undefined
      })

      if (res.success && res.data?.coupon) {
        const autoC = res.data.coupon
        setCouponDiscount(autoC.discount)
        setCouponName(autoC.name)
        setLocalCouponCode(autoC.code)
        setCouponApplied(true)
        setIsAutoApplied(true)
      } else {
        if (isAutoApplied) {
          setLocalCouponCode("")
          setCouponApplied(false)
          setCouponDiscount(0)
          setCouponName("")
          setIsAutoApplied(false)
        }
      }
    } catch (err) {
      console.error("Auto coupon fetch error:", err)
    }
  }, [autoCouponRemoved, user, primaryPhone, guestEmail, event, isAutoApplied])

  useEffect(() => {
    if (isOpen) {
      const storedPhone = localStorage.getItem("rallyup_verified_guest_phone") || ""
      triggerAutoCouponApply(subtotal, storedPhone)
    }
  }, [isOpen, triggerAutoCouponApply])

  useEffect(() => {
    if (isOpen && (primaryPhone || guestEmail || subtotal)) {
      const delayDebounceFn = setTimeout(() => {
        triggerAutoCouponApply(subtotal)
      }, 500)
      return () => clearTimeout(delayDebounceFn)
    }
  }, [primaryPhone, guestEmail, subtotal, isOpen, triggerAutoCouponApply])

  const handleRemoveCoupon = () => {
    setCouponApplied(false)
    setLocalCouponCode("")
    setCouponDiscount(0)
    setCouponName("")
    setIsAutoApplied(false)
    setAutoCouponRemoved(true)
    toast.info("Coupon removed")
  }


  if (!event || !isOpen) return null
  if (!isSimpleEvent && !venues.length) return null

  const getClubRemaining = (tier: { allocation: number; sold: number; clubAllocations?: Array<{ clubName: string; allocation: number; sold: number }> }) => {
    if (attributedClub && tier.clubAllocations?.length) {
      const ca = tier.clubAllocations.find((c) => c.clubName === attributedClub)
      if (!ca) return 0
      return Math.max(0, ca.allocation - ca.sold)
    }
    return Math.max(0, tier.allocation - tier.sold)
  }

  const setQty = (venueId: string, tierId: string, delta: number) => {
    setCart((prev) => {
      const vCart = prev[venueId] ?? {}
      const current = vCart[tierId] ?? 0
      const next = Math.max(0, current + delta)
      const venue = venues.find((v) => v._id === venueId)!
      const tier = (Array.isArray(venue.tiers) ? venue.tiers : []).find((t) => t._id === tierId)
      if (!tier) return prev
      const available = getClubRemaining(tier)
      if (next > available) {
        const label = attributedClub && tier.clubAllocations?.length
          ? `Only ${available} seats available for ${attributedClub} in ${venue.name} – ${tier.name}`
          : `Only ${available} seats available for ${venue.name} – ${tier.name}`
        toast.error(label)
        return prev
      }
      const updated = { ...prev, [venueId]: { ...vCart, [tierId]: next } }
      if (next === 0) delete updated[venueId][tierId]
      if (Object.keys(updated[venueId]).length === 0) delete updated[venueId]
      return updated
    })
  }

  const updateSlot = (idx: number, field: "name" | "phone", value: string) => {
    setAttendeeSlots(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const updateSimpleAttendee = (index: number, field: 'name' | 'phone' | 'phoneCode', value: string) => {
    setSimpleAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const toggleSimpleAttendeeOpen = (index: number) => {
    setSimpleAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], open: !copy[index].open }
      return copy
    })
  }

  const reservePoints = async () => {
    const validationError = validatePointsRedemptionInput(redeemPoints, availablePoints, payableBeforePoints)
    if (validationError) {
      toast.error(validationError)
      return
    }
    if (!event.clubId) { toast.error("Club info missing"); return }
    setReserving(true)
    try {
      const res = await apiClient.createReservation(Number(redeemPoints), event.clubId, afterCoupon)
      if (res.success) {
        setReservationToken(res.data?.reservationToken ?? null)
        setReservedDiscount(res.data?.discountAmount ?? 0)
        toast.success("Points reserved")
      } else {
        toast.error(res.message ?? "Failed to reserve points")
      }
    } catch { toast.error("Failed to reserve points") }
    finally { setReserving(false) }
  }

  const clearReservation = async () => {
    if (reservationToken) {
      await apiClient.cancelReservation(reservationToken).catch(() => {})
    }
    setReservationToken(null)
    setRedeemPoints("")
    setReservedDiscount(0)
  }

  const validateCoupon = async () => {
    if (!localCouponCode.trim() || !event._id) { toast.error("Enter a coupon code"); return }
    if (subtotal <= 0) { toast.error("Cart is empty or free — coupon not applicable"); return }
    setValidatingCoupon(true)
    try {
      const res = await apiClient.validateCoupon(localCouponCode.toUpperCase(), event._id, subtotal, event.clubId)
      if (res.success && res.data?.coupon) {
        setCouponDiscount(res.data.coupon.discount)
        setCouponName(res.data.coupon.name)
        setCouponApplied(true)
        toast.success("Coupon applied!")
      } else {
        toast.error(res.error ?? "Invalid coupon")
      }
    } catch { toast.error("Failed to validate coupon") }
    finally { setValidatingCoupon(false) }
  }

  // ---- Inline member login (member-found step) ----

  const handleMemberLoginSendOtp = async () => {
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    setMemberLoginOtpSending(true)
    try {
      const res = await apiClient.sendOtp({ phoneNumber: digits, countryCode, role: 'user' })
      if (res.success) {
        setMemberLoginSessionInfo(res.data?.sessionInfo ?? null)
        setMemberLoginOtpSent(true)
        setMemberLoginOtp('')
        toast.success(`OTP sent to ${formatPhoneForDisplay(countryCode, digits)}`)
      } else {
        toast.error(res.message || res.error || 'Failed to send OTP')
      }
    } catch {
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setMemberLoginOtpSending(false)
    }
  }

  const handleMemberLoginVerifyOtp = async () => {
    if (memberLoginOtp.length < 6) { toast.error('Please enter the 6-digit code'); return }
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    setMemberLoginOtpVerifying(true)
    try {
      const res = await apiClient.verifyOTP({
        phoneNumber: digits,
        countryCode,
        otp: memberLoginOtp,
        role: 'user',
        sessionInfo: memberLoginSessionInfo || undefined,
      })
      if (!res.success) {
        toast.error(res.message || res.error || 'Invalid or expired code')
        return
      }
      // Backend may return a token directly or just { verified: true }
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userType', 'member')
        await checkAuth()
      } else if (res.data?.verified) {
        // OTP verified but no token — complete login with phone
        const loginResult = await login('', digits, countryCode)
        if (!loginResult.success) {
          toast.error(loginResult.error || 'Login failed after OTP verification')
          return
        }
      } else {
        toast.error(res.message || res.error || 'Invalid or expired code')
        return
      }
      toast.success('Signed in successfully!')
      setStep('attendees')
    } catch {
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setMemberLoginOtpVerifying(false)
    }
  }

  // ---- Guest identification wizard handlers (simple events, logged-out only) ----

  const sendOtp = async (digits: string, countryCode: string) => {
    setOtpSending(true)
    try {
      const res = await apiClient.sendGuestPhoneVerificationOTP({ phoneNumber: digits, countryCode })
      if (res.success && res.data?.sessionInfo) {
        setOtpSessionInfo(res.data.sessionInfo)
        setOtpSent(true)
        setOtp('')
        setResendCountdown(30)
        toast.success(`Verification code sent via WhatsApp to ${formatPhoneForDisplay(countryCode, digits)}`)
        return true
      }
      toast.error(res.message || res.error || 'Failed to send WhatsApp verification code')
      return false
    } catch (error) {
      console.error('Send phone verification OTP error:', error)
      toast.error('Failed to send verification code. Please try again.')
      return false
    } finally {
      setOtpSending(false)
    }
  }

  const handleIdentifyContinue = async () => {
    if (!event?._id) return
    const codeInput = primaryCountryCode.trim() || '+91'
    if (!phoneCodeRegex.test(codeInput)) {
      toast.error('Invalid country code')
      return
    }
    const digits = digitsOnly(primaryPhone)
    if (digits.length < 6 || digits.length > 15) {
      toast.error('Please enter a valid mobile number (6-15 digits)')
      return
    }
    const countryCode = normalizeCountryCode(codeInput)

    setIdentifyError(null)
    setIdentifyChecking(true)
    try {
      const res = await apiClient.checkEventRegistrationByPhone(event._id, digits, countryCode)
      if (!res.success) {
        toast.error(res.message || 'Failed to check registration status')
        return
      }
      const payload = (res.data as any)?.data ?? res.data
      if (payload?.alreadyBooked) {
        const regStatus = (payload?.registrationStatus || payload?.status || payload?.registration?.status || '').toLowerCase()
        const isCancelled = ['cancelled', 'canceled', 'refunded'].includes(regStatus)
        if (!isCancelled) {
          setIdentifyError('You are already registered for this event with this number.')
          return
        }
      }

      setPrimaryCountryCode(countryCode)

      const isMember = Boolean(payload?.isMember) ||
        payload?.role === 'member' ||
        payload?.role === 'admin' ||
        payload?.role === 'super_admin'
      const memberName =
        `${payload?.first_name ?? ''} ${payload?.last_name ?? ''}`.trim() ||
        payload?.name ||
        ''

      setGuestMemberInfo({ isMember, memberName })

      setSimpleAttendees(prev => {
        const copy = prev.length ? [...prev] : [{ name: '', phone: '', phoneCode: '', open: true }]
        copy[0] = { ...copy[0], name: memberName || primaryName.trim(), phone: digits, phoneCode: countryCode, open: true }
        return copy
      })

      setStep(isMember ? 'member-found' : 'guest-or-signup')
    } catch (error) {
      console.error('Check event registration by phone error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIdentifyChecking(false)
    }
  }

  const handleGuestLogin = () => {
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    onClose()
    onLogin && onLogin({ name: primaryName.trim(), phone: digits, countryCode })
  }

  const handleGuestSignup = () => {
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    onClose()
    onSignup && onSignup({ name: primaryName.trim(), phone: digits, countryCode })
  }

  const handleContinueAsGuest = async () => {
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    const sent = await sendOtp(digits, countryCode)
    if (sent) setStep('otp')
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code')
      return
    }
    if (!otpSessionInfo) {
      toast.error('Please request a verification code first')
      return
    }
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    setOtpVerifying(true)
    try {
      const res = await apiClient.verifyGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode,
        otp,
        sessionInfo: otpSessionInfo,
      })
      if (res.success && res.data?.verified) {
        setOtpVerified(true)
        localStorage.setItem("rallyup_verified_guest_phone", digits)
        localStorage.setItem("rallyup_verified_guest_country_code", countryCode)
        toast.success('Phone number verified')
        void triggerAutoCouponApply(subtotal, digits)

        const prefillName = (guestMemberInfo?.isMember && guestMemberInfo?.memberName)
          ? guestMemberInfo.memberName
          : primaryName.trim()
        setSimpleAttendees(prev => {
          const copy = prev.length ? [...prev] : [{ name: '', phone: '', phoneCode: '', open: true }]
          copy[0] = { ...copy[0], name: prefillName, phone: digits, phoneCode: countryCode, open: true }
          return copy
        })
        setStep('attendees')
      } else {
        toast.error(res.message || res.error || 'Invalid or expired code')
      }
    } catch (error) {
      console.error('Verify phone OTP error:', error)
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return
    const digits = digitsOnly(primaryPhone)
    const countryCode = normalizeCountryCode(primaryCountryCode)
    setOtpSending(true)
    try {
      const res = await apiClient.resendGuestPhoneVerificationOTP({ phoneNumber: digits, countryCode })
      if (res.success && res.data?.sessionInfo) {
        setOtpSessionInfo(res.data.sessionInfo)
        setOtp('')
        setResendCountdown(30)
        toast.success('Verification code resent via WhatsApp')
      } else {
        toast.error(res.message || res.error || 'Failed to resend code')
      }
    } catch (error) {
      console.error('Resend phone OTP error:', error)
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setOtpSending(false)
    }
  }

  const checkedPhoneLabel = formatPhoneForDisplay(primaryCountryCode, digitsOnly(primaryPhone))

  // ---- Payment ----

  const handlePayment = async () => {
    if (!event) return
    if (!refundPolicy.ensureAgreed()) {
      toast.error('Review the refund policy and tap "I Agree" before continuing.')
      return
    }
    if (!scriptLoaded) { toast.error("Payment system still loading — please wait"); return }
    if (isJointEvent && !attributedClub) {
      setShowClubAlert(true)
      return
    }
    if (isSimpleEvent) {
      await handleSimpleEventPayment()
    } else {
      await handleTierMatrixPayment()
    }
  }

  const handleSimpleEventPayment = async () => {
    if (!event) return
    if (ticketCount < 1) { toast.error("Select at least one ticket"); return }
    if (!user?._id) { toast.error("Please log in to purchase tickets"); return }
    if (remainingSeats !== null && ticketCount > remainingSeats) {
      toast.error(remainingSeats === 0 ? "This event is now full" : `Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`)
      return
    }

    for (let i = 0; i < simpleAttendees.length; i++) {
      const a = simpleAttendees[i]
      if (!a.name || !a.name.trim()) {
        toast.error(`Please enter a name for attendee ${i + 1}`)
        return
      }
      if (!a.phoneCode || !a.phoneCode.trim()) {
        toast.error(`Please enter a country code for attendee ${i + 1}`)
        return
      }
      if (!phoneCodeRegex.test(a.phoneCode.trim())) {
        toast.error(`Invalid country code for attendee ${i + 1}`)
        return
      }
      if (!a.phone || !a.phone.trim()) {
        toast.error(`Please enter a phone number for attendee ${i + 1}`)
        return
      }
      const p = digitsOnly(a.phone)
      if (p.length < 6 || p.length > 15) {
        toast.error(`Phone number for attendee ${i + 1} must be 6-15 digits`)
        return
      }
      a.phoneFull = `${normalizeCountryCode(a.phoneCode)}${p}`
    }

    const phoneNumbers = simpleAttendees.map(a => a.phoneFull)
    const uniquePhones = new Set(phoneNumbers)
    if (uniquePhones.size !== phoneNumbers.length) {
      const duplicate = phoneNumbers.find((p, i) => phoneNumbers.indexOf(p) !== i)
      const dupIndex = phoneNumbers.lastIndexOf(duplicate)
      toast.error(`Attendee ${dupIndex + 1} has the same phone number as another attendee`)
      return
    }

    const bookingAttendees = simpleAttendees.map((a) => ({
      name: a.name.trim(),
      phone: a.phoneFull || a.phone,
    }))

    setLoading(true)
    try {
      const apiItems: VenueTierCartItem[] = [{ venueId: SIMPLE_VENUE_ID, tierId: SIMPLE_TIER_ID, quantity: ticketCount }]

      if (amountToCharge <= 0) {
        if (reservationToken) {
          await apiClient.confirmReservation(reservationToken).catch(() => {})
        }
        const res = await apiClient.bookVenueTierMatrix(event._id, {
          items: apiItems,
          attendees: bookingAttendees,
          reservationToken: reservationToken ?? undefined,
          couponCode: localCouponCode || undefined,
          couponDiscount: couponDiscount || undefined,
          earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
          pointsDiscount: reservedDiscount || undefined,
          amountPaid: 0,
          attributed_club: attributedClub || undefined,
          waitlistToken: waitlistToken || undefined,
        })
        if (res.success) {
          toast.success("Tickets booked!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          toast.error(res.error ?? "Booking failed")
          onFailure()
        }
        setLoading(false)
        return
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency ?? "INR",
          orderId: `EVT-${Date.now()}`,
          orderNumber: `EVT-${Date.now()}`,
        }),
      })
      if (!orderRes.ok) throw new Error("Failed to create payment order")
      const { razorpayOrderId, amount, currency: orderCurrency } = await orderRes.json()

      await apiClient.createPendingVenueTierBooking(event._id, {
        items: apiItems,
        attendees: bookingAttendees,
        razorpayOrderId,
        amountPaid: Math.round(amountToCharge),
        reservationToken: reservationToken ?? undefined,
        couponCode: localCouponCode || undefined,
        couponDiscount: couponDiscount || undefined,
        earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
        pointsDiscount: reservedDiscount || undefined,
        attributed_club: attributedClub || undefined,
      }).catch((err) => console.warn("[VenueTierCart] Pending booking failed:", err))

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency,
        name: "RallyUp",
        description: `${ticketCount} ticket(s) for ${event.title}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          const { razorpay_payment_id: paymentId, razorpay_order_id: orderId } = response
          try {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: response.razorpay_signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            }).catch(() => {})

            if (reservationToken) {
              await apiClient.confirmReservation(reservationToken, orderId).catch(() => {})
            }

            const res = await apiClient.bookVenueTierMatrix(event._id, {
              items: apiItems,
              attendees: bookingAttendees,
              razorpayOrderId: orderId,
              paymentId,
              amountPaid: Math.round(amountToCharge),
              reservationToken: reservationToken ?? undefined,
              couponCode: localCouponCode || undefined,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
              waitlistToken: waitlistToken || undefined,
            })
            if (res.success) {
              toast.success("Payment successful! Tickets confirmed.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error(`Payment received (ID: ${paymentId}) but booking failed — ${res.error ?? "contact support"}`)
              setRazorpayOpen(false)
            }
          } catch {
            toast.error(`Something went wrong after payment (ID: ${paymentId}). Contact support.`)
            setRazorpayOpen(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: bookingAttendees[0]?.name ?? userDefaultName,
          email: (user as any)?.email ?? "",
          contact: bookingAttendees[0]?.phone ?? userDefaultPhone,
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description ?? "Payment failed")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        router.push("/purchase/failure")
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate payment")
      setLoading(false)
    }
  }

  const handleGuestSimpleEventPayment = async () => {
    if (!event) return
    if (!refundPolicy.ensureAgreed()) {
      toast.error('Review the refund policy and tap "I Agree" before continuing.')
      return
    }
    if (ticketCount < 1) { toast.error("Select at least one ticket"); return }
    if (remainingSeats !== null && ticketCount > remainingSeats) {
      toast.error(remainingSeats === 0 ? "This event is now full" : `Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`)
      return
    }

    for (let i = 0; i < simpleAttendees.length; i++) {
      const a = simpleAttendees[i]
      if (!a.name || !a.name.trim()) {
        toast.error(`Please enter a name for attendee ${i + 1}`)
        return
      }
      if (!a.phoneCode || !a.phoneCode.trim()) {
        toast.error(`Please enter a country code for attendee ${i + 1}`)
        return
      }
      if (!phoneCodeRegex.test(a.phoneCode.trim())) {
        toast.error(`Invalid country code for attendee ${i + 1}`)
        return
      }
      if (!a.phone || !a.phone.trim()) {
        toast.error(`Please enter a phone number for attendee ${i + 1}`)
        return
      }
      const p = digitsOnly(a.phone)
      if (p.length < 6 || p.length > 15) {
        toast.error(`Phone number for attendee ${i + 1} must be 6-15 digits`)
        return
      }
      a.phoneFull = `${normalizeCountryCode(a.phoneCode)}${p}`
    }

    const phoneNumbers = simpleAttendees.map(a => a.phoneFull)
    const uniquePhones = new Set(phoneNumbers)
    if (uniquePhones.size !== phoneNumbers.length) {
      const duplicate = phoneNumbers.find((p, i) => phoneNumbers.indexOf(p) !== i)
      const dupIndex = phoneNumbers.lastIndexOf(duplicate)
      toast.error(`Attendee ${dupIndex + 1} has the same phone number as another attendee`)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!guestEmail.trim()) { setGuestEmailError("Email is required"); return }
    if (!emailRegex.test(guestEmail.trim())) { setGuestEmailError("Enter a valid email address"); return }
    setGuestEmailError("")

    const bookingAttendees = simpleAttendees.map((a) => ({
      name: a.name.trim(),
      phone: a.phoneFull || a.phone,
    }))

    setLoading(true)
    try {
      if (amountToCharge <= 0) {
        if (reservationToken) {
          await apiClient.confirmReservation(reservationToken).catch(() => {})
        }
        const res = await apiClient.registerForPublicEvent(event._id, {
          registrantName: bookingAttendees[0]?.name || 'Guest',
          registrantPhone: bookingAttendees[0]?.phone || '',
          registrantEmail: guestEmail.trim(),
          attendees: bookingAttendees,
          couponCode: localCouponCode || undefined,
          reservationToken: reservationToken ?? undefined,
          couponDiscount: couponDiscount || undefined,
          earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
          pointsDiscount: reservedDiscount || undefined,
          attributed_club: attributedClub || undefined,
        })
        if (res.success) {
          toast.success("Successfully registered for event!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          toast.error(res.error ?? "Registration failed")
          onFailure()
        }
        setLoading(false)
        return
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency ?? "INR",
          orderId: `EVT-${Date.now()}`,
          orderNumber: `EVT-${Date.now()}`,
        }),
      })
      if (!orderRes.ok) throw new Error("Failed to create payment order")
      const { razorpayOrderId, amount, currency: orderCurrency } = await orderRes.json()

      const pendingRes = await apiClient.createPendingPublicRegistration(event._id, {
        registrantName: bookingAttendees[0]?.name || 'Guest',
        registrantEmail: guestEmail.trim(),
        registrantPhone: bookingAttendees[0]?.phone || '',
        attendees: bookingAttendees,
        couponCode: localCouponCode || undefined,
        razorpayOrderId,
        amountPaid: Math.round(amountToCharge),
        reservationToken: reservationToken ?? undefined,
        couponDiscount: couponDiscount || undefined,
        earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
        pointsDiscount: reservedDiscount || undefined,
        attributed_club: attributedClub || undefined,
      })

      if (!pendingRes.success) {
        toast.error(pendingRes.message || pendingRes.error || "Unable to start checkout for this event. Please check your details or contact support.")
        if (reservationToken) {
          await apiClient.cancelReservation(reservationToken).catch(() => {})
        }
        setLoading(false)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency,
        name: "RallyUp",
        description: `Payment for ${event.title} - ${ticketCount} ticket(s)`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = response
          try {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            }).catch(() => {})

            if (reservationToken) {
              await apiClient.confirmReservation(reservationToken, orderId).catch(() => {})
            }

            const amountCharged = Math.round(amountToCharge)
            const res = await apiClient.registerForPublicEvent(event._id, {
              registrantName: bookingAttendees[0]?.name || 'Guest',
              registrantPhone: bookingAttendees[0]?.phone || '',
              registrantEmail: guestEmail.trim(),
              attendees: bookingAttendees,
              couponCode: localCouponCode || undefined,
              orderID: orderId,
              paymentID: paymentId,
              signature,
              reservationToken: reservationToken ?? undefined,
              amountPaid: amountCharged,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: simpleEarlyBirdDiscountTotal || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
            })

            if (res.success) {
              toast.success("Payment successful! You are now registered for the event.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error(`Payment received (ID: ${paymentId}) but registration failed — ${res.error ?? 'please contact support with your payment ID.'}`)
              setRazorpayOpen(false)
            }
          } catch {
            toast.error(`Something went wrong after payment (ID: ${paymentId}). Please contact support with your payment ID.`)
            setRazorpayOpen(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: bookingAttendees[0]?.name || '',
          email: guestEmail.trim() || '',
          contact: bookingAttendees[0]?.phone || '',
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description ?? "Payment processing failed. Please try again.")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        onClose()
        router.push("/purchase/failure")
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const handleGuestTierMatrixPayment = async () => {
    if (!event) return
    if (!refundPolicy.ensureAgreed()) {
      toast.error('Review the refund policy and tap "I Agree" before continuing.')
      return
    }
    if (cartItems.length === 0) { toast.error("Select at least one ticket"); return }

    for (let i = 0; i < attendeeSlots.length; i++) {
      const s = attendeeSlots[i]
      if (!s.name.trim()) {
        toast.error(`Enter name for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
      const phoneDigits = s.phone.replace(/\D/g, "")
      if (!phoneDigits) {
        toast.error(`Enter phone for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
      if (phoneDigits.length < 6 || phoneDigits.length > 15) {
        toast.error(`Enter a valid phone for Ticket ${i + 1}`)
        return
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!guestEmail.trim()) { setGuestEmailError("Email is required"); return }
    if (!emailRegex.test(guestEmail.trim())) { setGuestEmailError("Enter a valid email address"); return }
    setGuestEmailError("")

    const bookingAttendees = attendeeSlots.map((s) => ({
      name: s.name.trim(),
      phone: s.phone.replace(/\D/g, ""),
    }))

    setLoading(true)
    try {
      const fresh = await apiClient.getPublicEventById(event._id)
      const freshEvent = fresh.success ? fresh.data : null
      if (freshEvent?.venues?.length) {
        for (const item of cartItems) {
          const venue = freshEvent.venues.find((v) => v._id === item.venueId)
          const tier = (Array.isArray(venue?.tiers) ? venue.tiers : []).find((t) => t._id === item.tierId)
          if (!venue || !tier) {
            toast.error("Ticket matrix changed. Please review your cart and try again.")
            setLoading(false)
            return
          }
          let available = Math.max(0, (tier.allocation ?? 0) - (tier.sold ?? 0))
          if (attributedClub && tier.clubAllocations?.length) {
            const ca = tier.clubAllocations.find((ca) => ca.clubName === attributedClub)
            available = ca ? Math.max(0, (ca.allocation ?? 0) - (ca.sold ?? 0)) : 0
          }
          if (item.quantity > available) {
            toast.error(
              attributedClub && tier.clubAllocations?.length
                ? `Only ${available} seats left for ${attributedClub} in ${venue.name} - ${tier.name}`
                : `Only ${available} seats left in ${venue.name} - ${tier.name}`
            )
            setLoading(false)
            return
          }
        }
      }

      const apiItems = cartItems.map(({ venueId, tierId, quantity }) => ({ venueId, tierId, quantity }))

      if (amountToCharge <= 0) {
        if (reservationToken) {
          await apiClient.confirmReservation(reservationToken).catch(() => {})
        }
        const res = await apiClient.bookPublicVenueTierMatrix(event._id, {
          guestEmail: guestEmail.trim(),
          items: apiItems,
          attendees: bookingAttendees,
          reservationToken: reservationToken ?? undefined,
          couponCode: localCouponCode || undefined,
          couponDiscount: couponDiscount || undefined,
          earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
          pointsDiscount: reservedDiscount || undefined,
          amountPaid: 0,
          attributed_club: attributedClub || undefined,
        })
        if (res.success) {
          toast.success("Tickets booked!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          toast.error(res.error ?? "Booking failed")
          onFailure()
        }
        setLoading(false)
        return
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency ?? "INR",
          orderId: `EVT-MTX-${Date.now()}`,
          orderNumber: `EVT-MTX-${Date.now()}`,
        }),
      })
      if (!orderRes.ok) throw new Error("Failed to create payment order")
      const { razorpayOrderId, amount, currency: orderCurrency } = await orderRes.json()

      await apiClient.createPendingPublicVenueTierBooking(event._id, {
        guestEmail: guestEmail.trim(),
        guestName: bookingAttendees[0]?.name || 'Guest',
        items: apiItems,
        attendees: bookingAttendees,
        razorpayOrderId,
        amountPaid: Math.round(amountToCharge),
        reservationToken: reservationToken ?? undefined,
        couponCode: localCouponCode || undefined,
        couponDiscount: couponDiscount || undefined,
        earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
        pointsDiscount: reservedDiscount || undefined,
        attributed_club: attributedClub || undefined,
      }).catch((err) => console.warn("[VenueTierCart] Guest pending booking failed:", err))

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency,
        name: "RallyUp",
        description: `${cartItems.length} ticket type(s) for ${event.title}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          const { razorpay_payment_id: paymentId, razorpay_order_id: orderId } = response
          try {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: response.razorpay_signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            }).catch(() => {})

            if (reservationToken) {
              await apiClient.confirmReservation(reservationToken, orderId).catch(() => {})
            }

            const res = await apiClient.bookPublicVenueTierMatrix(event._id, {
              guestEmail: guestEmail.trim(),
              items: apiItems,
              attendees: bookingAttendees,
              razorpayOrderId: orderId,
              paymentId,
              amountPaid: Math.round(amountToCharge),
              reservationToken: reservationToken ?? undefined,
              couponCode: localCouponCode || undefined,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
            })
            if (res.success) {
              toast.success("Payment successful! Tickets confirmed.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error(`Payment received (ID: ${paymentId}) but booking failed — ${res.error ?? "contact support"}`)
              setRazorpayOpen(false)
            }
          } catch {
            toast.error(`Something went wrong after payment (ID: ${paymentId}). Contact support.`)
            setRazorpayOpen(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: bookingAttendees[0]?.name ?? "",
          email: guestEmail.trim(),
          contact: bookingAttendees[0]?.phone ?? "",
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description ?? "Payment failed")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        router.push("/purchase/failure")
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate payment")
      setLoading(false)
    }
  }

  const handleTierMatrixPayment = async () => {
    if (cartItems.length === 0) { toast.error("Select at least one ticket"); return }
    if (!user?._id) { toast.error("Please log in to purchase tickets"); return }

    for (let i = 0; i < attendeeSlots.length; i++) {
      const s = attendeeSlots[i]
      if (!s.name.trim()) {
        toast.error(`Enter name for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
      const phoneDigits = s.phone.replace(/\D/g, "")
      if (!phoneDigits) {
        toast.error(`Enter phone for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
      if (phoneDigits.length !== 10) {
        toast.error(`Enter a valid 10-digit phone for Ticket ${i + 1}`)
        return
      }
    }

    const bookingAttendees = attendeeSlots.map((s) => ({
      name: s.name.trim(),
      phone: s.phone.replace(/\D/g, "").slice(-10),
    }))

    setLoading(true)
    try {
      const fresh = await apiClient.getPublicEventById(event._id)
      const freshEvent = fresh.success ? fresh.data : null
      if (freshEvent?.venues?.length) {
        for (const item of cartItems) {
          const venue = freshEvent.venues.find((v) => v._id === item.venueId)
          const tier = (Array.isArray(venue?.tiers) ? venue.tiers : []).find((t) => t._id === item.tierId)
          if (!venue || !tier) {
            toast.error("Ticket matrix changed. Please review your cart and try again.")
            setLoading(false)
            return
          }

          let available = Math.max(0, (tier.allocation ?? 0) - (tier.sold ?? 0))
          if (attributedClub && tier.clubAllocations?.length) {
            const clubAllocation = tier.clubAllocations.find((ca) => ca.clubName === attributedClub)
            available = clubAllocation ? Math.max(0, (clubAllocation.allocation ?? 0) - (clubAllocation.sold ?? 0)) : 0
          }

          if (item.quantity > available) {
            toast.error(
              attributedClub && tier.clubAllocations?.length
                ? `Only ${available} seats left for ${attributedClub} in ${venue.name} - ${tier.name}`
                : `Only ${available} seats left in ${venue.name} - ${tier.name}`
            )
            setLoading(false)
            return
          }
        }
      }

      const apiItems = cartItems.map(({ venueId, tierId, quantity }) => ({ venueId, tierId, quantity }))

      if (amountToCharge <= 0) {
        if (reservationToken) {
          await apiClient.confirmReservation(reservationToken).catch(() => {})
        }
        const res = await apiClient.bookVenueTierMatrix(event._id, {
          items: apiItems,
          attendees: bookingAttendees,
          reservationToken: reservationToken ?? undefined,
          couponCode: localCouponCode || undefined,
          couponDiscount: couponDiscount || undefined,
          earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
          pointsDiscount: reservedDiscount || undefined,
          amountPaid: 0,
          attributed_club: attributedClub || undefined,
        })
        if (res.success) {
          toast.success("Tickets booked!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          toast.error(res.error ?? "Booking failed")
          onFailure()
        }
        setLoading(false)
        return
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency ?? "INR",
          orderId: `EVT-MTX-${Date.now()}`,
          orderNumber: `EVT-MTX-${Date.now()}`,
        }),
      })
      if (!orderRes.ok) throw new Error("Failed to create payment order")
      const { razorpayOrderId, amount, currency: orderCurrency } = await orderRes.json()

      await apiClient.createPendingVenueTierBooking(event._id, {
        items: apiItems,
        attendees: bookingAttendees,
        razorpayOrderId,
        amountPaid: Math.round(amountToCharge),
        reservationToken: reservationToken ?? undefined,
        couponCode: localCouponCode || undefined,
        couponDiscount: couponDiscount || undefined,
        earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
        pointsDiscount: reservedDiscount || undefined,
        attributed_club: attributedClub || undefined,
      }).catch((err) => console.warn("[VenueTierCart] Pending booking failed:", err))

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency,
        name: "RallyUp",
        description: `${cartItems.length} ticket type(s) for ${event.title}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          const { razorpay_payment_id: paymentId, razorpay_order_id: orderId } = response
          try {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: response.razorpay_signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            }).catch(() => {})

            if (reservationToken) {
              await apiClient.confirmReservation(reservationToken, orderId).catch(() => {})
            }

            const res = await apiClient.bookVenueTierMatrix(event._id, {
              items: apiItems,
              attendees: bookingAttendees,
              razorpayOrderId: orderId,
              paymentId,
              amountPaid: Math.round(amountToCharge),
              reservationToken: reservationToken ?? undefined,
              couponCode: localCouponCode || undefined,
              couponDiscount: couponDiscount || undefined,
              earlyBirdDiscountAmt: earlyBirdDiscountTotal || simpleEarlyBirdDiscountTotal || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
            })
            if (res.success) {
              toast.success("Payment successful! Tickets confirmed.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error(`Payment received (ID: ${paymentId}) but booking failed — ${res.error ?? "contact support"}`)
            }
          } catch {
            toast.error(`Something went wrong after payment (ID: ${paymentId}). Contact support.`)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: bookingAttendees[0]?.name ?? userDefaultName,
          email: (user as any)?.email ?? "",
          contact: bookingAttendees[0]?.phone ?? userDefaultPhone,
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description ?? "Payment failed")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        router.push("/purchase/failure")
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate payment")
      setLoading(false)
    }
  }

  const onPrimaryAction = () => {
    if (authStillLoading) return
    if (showGuestWizard && step !== 'attendees') return
    if (!isAuthenticated) {
      if (isSimpleEvent) {
        void handleGuestSimpleEventPayment()
      } else {
        void handleGuestTierMatrixPayment()
      }
    } else {
      void handlePayment()
    }
  }

  const currency = event.currency ?? "INR"
  const hasSelection = isSimpleEvent ? ticketCount > 0 : cartItems.length > 0

  const isCSREvent = event.category === 'csr-events'
  const titleByStep: Record<GuestStep, string> = {
    identify: isCSREvent ? 'Donate for Event' : 'Register for Event',
    'member-found': 'Existing member found',
    'guest-or-signup': 'Continue as guest or sign up',
    otp: 'Verify your WhatsApp number',
    attendees: 'Select Tickets',
  }
  const descriptionByStep: Record<GuestStep, string> = {
    identify: 'Enter your name and WhatsApp number to get started',
    'member-found': 'We found a member account with this number',
    'guest-or-signup': 'No member account found with this number',
    otp: 'Enter the verification code sent to your WhatsApp',
    attendees: event.title,
  }

  const showWizardStep = showGuestWizard && step !== 'attendees'

  return (
    <>
    <AlertDialog open={showClubAlert} onOpenChange={setShowClubAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select Your Club Affiliation</AlertDialogTitle>
          <AlertDialogDescription>
            This is a joint screening event. Please select which club you are supporting before proceeding to payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setShowClubAlert(false)}>OK, I'll select</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog
      open={isOpen}
      onOpenChange={() => { if (!razorpayOpen) onClose() }}
      modal={!razorpayOpen}
    >
      <DialogContent
        className={`max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 ${refundPolicy.policyModalOpen ? "pointer-events-none" : ""}`}
        onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {showWizardStep ? titleByStep[step] : 'Select Tickets'}
          </DialogTitle>
          <DialogDescription>{showWizardStep ? descriptionByStep[step] : event.title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          {showWizardStep ? (
            <>
              {step === 'identify' && (
                <div className="space-y-4 py-2">
                  {identifyError && (
                    <Alert variant="destructive">
                      <AlertDescription>{identifyError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="vtcPrimaryCountryCode">Code</Label>
                      <Input
                        id="vtcPrimaryCountryCode"
                        placeholder="+91"
                        value={primaryCountryCode}
                        onChange={(e) => { setPrimaryCountryCode(e.target.value); setIdentifyError(null) }}
                        className="w-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vtcPrimaryPhone">WhatsApp number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="vtcPrimaryPhone"
                          type="tel"
                          placeholder="9876543210"
                          value={primaryPhone}
                          onChange={(e) => { setPrimaryPhone(e.target.value); setIdentifyError(null) }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleIdentifyContinue()}
                    disabled={identifyChecking || !primaryPhone.trim()}
                    className="w-full"
                  >
                    {identifyChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              )}

              {step === 'member-found' && (
                <div className="space-y-4 py-2">
                  {checkedPhoneLabel && (
                    <p className="text-xs text-muted-foreground text-center">Checked: {checkedPhoneLabel}</p>
                  )}
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Existing member{guestMemberInfo?.memberName ? ` — ${guestMemberInfo.memberName}` : ''}</strong>
                      <br />
                      Verify your number to log in and unlock member pricing.
                    </AlertDescription>
                  </Alert>

                  {!memberLoginOtpSent ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => void handleMemberLoginSendOtp()}
                        disabled={memberLoginOtpSending}
                        className="w-full"
                      >
                        {memberLoginOtpSending
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP…</>
                          : 'Send OTP to Login'}
                      </Button>
                      <Button variant="outline" onClick={() => void handleContinueAsGuest()} className="w-full">
                        Continue as Guest
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="memberLoginOtp">Verification code</Label>
                        <Input
                          id="memberLoginOtp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="Enter 6-digit code"
                          value={memberLoginOtp}
                          maxLength={6}
                          onChange={(e) => setMemberLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                      </div>
                      <Button
                        onClick={() => void handleMemberLoginVerifyOtp()}
                        disabled={memberLoginOtpVerifying || memberLoginOtp.length < 6}
                        className="w-full"
                      >
                        {memberLoginOtpVerifying
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
                          : 'Verify & Login'}
                      </Button>
                      <Button variant="outline" onClick={() => void handleContinueAsGuest()} className="w-full">
                        Continue as Guest
                      </Button>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => { setStep('identify'); setMemberLoginOtpSent(false); setMemberLoginOtp('') }} className="w-full">
                    Use a different number
                  </Button>
                </div>
              )}

              {step === 'guest-or-signup' && (
                <div className="space-y-4 py-2">
                  {checkedPhoneLabel && (
                    <p className="text-xs text-muted-foreground text-center">Checked: {checkedPhoneLabel}</p>
                  )}
                  <Alert className="border-blue-200 bg-blue-50">
                    <Users className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>No member account found with this number</strong>
                      <br />
                      Continue as a guest, or create an account to track your tickets and unlock member pricing.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => void handleContinueAsGuest()} className="flex-1">Continue as Guest</Button>
                    <Button onClick={handleGuestSignup} className="flex-1">Sign Up</Button>
                  </div>
                  <Button variant="ghost" onClick={() => setStep('identify')} className="w-full">
                    Use a different number
                  </Button>
                </div>
              )}

              {step === 'otp' && (
                <div className="space-y-4 py-2">
                  {checkedPhoneLabel && (
                    <p className="text-xs text-muted-foreground text-center">Verifying: {checkedPhoneLabel}</p>
                  )}
                  <Alert className="border-blue-200 bg-blue-50">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Verify your WhatsApp number</strong>
                      <br />
                      We sent a one-time code via WhatsApp to confirm this number is valid.
                    </AlertDescription>
                  </Alert>

                  {otpSending && !otpSent ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Sending WhatsApp code…</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="vtcOtp">WhatsApp verification code</Label>
                        <Input
                          id="vtcOtp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="Enter 6-digit code"
                          value={otp}
                          maxLength={6}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                      </div>

                      <Button
                        onClick={() => void handleVerifyOtp()}
                        disabled={otpVerifying || otp.length < 6}
                        className="w-full"
                      >
                        {otpVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          'Verify code'
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => void handleResendOtp()}
                        disabled={otpSending || resendCountdown > 0}
                        className="w-full"
                      >
                        {otpSending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resending…
                          </>
                        ) : resendCountdown > 0 ? (
                          `Resend via WhatsApp (${resendCountdown}s)`
                        ) : (
                          'Resend via WhatsApp'
                        )}
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep(guestMemberInfo?.isMember ? 'member-found' : 'identify')
                      setOtp('')
                      setOtpSent(false)
                      setOtpSessionInfo(null)
                    }}
                    className="w-full"
                  >
                    Use a different number
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* {showGuestWizard && otpVerified && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    WhatsApp number verified{guestMemberInfo?.memberName ? ` — welcome back, ${guestMemberInfo.memberName}` : ''}. Your details have been pre-filled below.
                  </AlertDescription>
                </Alert>
              )} */}

              {isJointEvent && (
                <Card className={!attributedClub ? "border-destructive/60" : undefined}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Club Affiliation
                      <Badge variant="destructive" className="text-xs ml-1">Required</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {affiliationClubOptions.length > 0
                        ? `Select which club you are supporting — ${affiliationClubOptions.join(", ")}`
                        : "Select which club you are supporting"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={attributedClub}
                      onValueChange={(v) => {
                        setAttributedClub(v)
                        setCart({})
                      }}
                    >
                      <SelectTrigger className={!attributedClub ? "border-destructive/60" : undefined}>
                        <SelectValue placeholder="Select your club…" />
                      </SelectTrigger>
                      <SelectContent>
                        {affiliationClubOptions.map((club) => (
                          <SelectItem key={club} value={club}>{club}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!attributedClub && (
                      <p className="text-xs text-destructive mt-1.5">You must select a club before proceeding to payment.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {isSimpleEvent ? (
                <>
                  {simpleEarlyBirdDiscountTotal > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900 text-sm">
                            Early Bird Discount Applied!
                            {(event as any)?.earlyBirdDiscount?.membersOnly && " (Members Only)"}
                          </div>
                          <div className="text-xs text-green-700">
                            You're saving {fmt(simpleEarlyBirdDiscountTotal, currency)} on your order
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simpleMemberDiscountTotal > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900 text-sm">Member Discount Applied!</div>
                          <div className="text-xs text-blue-700">
                            You're saving {fmt(simpleMemberDiscountTotal, currency)} across your tickets as a club member
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simpleGroupDiscountTotal > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-purple-900 text-sm">Group Discount Applied!</div>
                          <div className="text-xs text-purple-700">
                            You're saving {fmt(simpleGroupDiscountTotal, currency)} for booking as a group
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="text-lg font-medium">{ticketCount}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (remainingSeats !== null && ticketCount >= remainingSeats) {
                            toast.error(remainingSeats === 0 ? "This event is now full" : `Only ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`)
                            return
                          }
                          setTicketCount(ticketCount + 1)
                        }}
                        disabled={remainingSeats !== null && ticketCount >= remainingSeats}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Number of tickets
                      {remainingSeats !== null && (
                        <span className={`ml-2 font-medium ${remainingSeats === 0 ? 'text-red-600' : remainingSeats <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                          ({remainingSeats === 0 ? 'No seats left' : `${remainingSeats} left`})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {simpleAttendees.map((att, i) => (
                      <div key={i} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSimpleAttendeeOpen(i)} className="p-1">
                              {att.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div className="font-medium">Attendee {i + 1}</div>
                            {i === 0 && <Badge variant="outline" className="ml-2">Primary</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[120px]">{att.name || 'No name yet'}</div>
                        </div>
                        {att.open && (
                          <div className="mt-3 space-y-2">
                            <Input placeholder={`Name for attendee ${i + 1}`} value={att.name} onChange={(e) => updateSimpleAttendee(i, 'name', e.target.value)} />
                            <div className="flex gap-2">
                              <Input placeholder="+91" value={att.phoneCode || ''} onChange={(e) => updateSimpleAttendee(i, 'phoneCode', e.target.value)} className="w-20 flex-shrink-0" />
                              <Input placeholder={`Phone for attendee ${i + 1}`} value={att.phone} onChange={(e) => updateSimpleAttendee(i, 'phone', e.target.value)} className="flex-1 min-w-0" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {venues.map((venue) => {
                    const tiers = Array.isArray(venue.tiers) ? venue.tiers : []
                    const available = tiers.some((t) => t.allocation - t.sold > 0)
                    return (
                      <Card key={venue._id} className={!available ? "opacity-60" : undefined}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {venue.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {tiers.map((tier) => {
                            const remaining = getClubRemaining(tier)
                            const hasClubSplit = Boolean(tier.clubAllocations?.length)
                            const clubNotSelected = isJointEvent && hasClubSplit && !attributedClub
                            const qty = cart[venue._id]?.[tier._id] ?? 0
                            return (
                              <div key={tier._id} className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-medium">{tier.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {fmt(tier.price, currency)}
                                    </Badge>
                                    {hasClubSplit && (
                                      <Badge variant="outline" className="text-xs">club-split</Badge>
                                    )}
                                  </div>
                                  <p className={`text-xs mt-0.5 ${remaining === 0 || clubNotSelected ? "text-muted-foreground" : remaining <= 5 ? "text-amber-600" : "text-muted-foreground"}`}>
                                    {clubNotSelected
                                      ? "Select your club above to see availability"
                                      : remaining === 0
                                      ? `Sold out${attributedClub && hasClubSplit ? ` for ${attributedClub}` : ""}`
                                      : `${remaining} remaining${attributedClub && hasClubSplit ? ` for ${attributedClub}` : ""}`
                                    }
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Button
                                    type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                                    onClick={() => setQty(venue._id, tier._id, -1)}
                                    disabled={qty === 0}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                  <Button
                                    type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                                    onClick={() => setQty(venue._id, tier._id, 1)}
                                    disabled={clubNotSelected || remaining === 0 || qty >= remaining}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    )
                  })}

                  {attendeeSlots.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Attendee Details</CardTitle>
                        <CardDescription className="text-xs">Enter name and phone for each ticket</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {attendeeSlots.map((slot, i) => (
                          <div key={`${slot.venueId}-${slot.tierId}-${i}`} className="space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-xs">Ticket {i + 1}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{slot.venueName}
                              </span>
                              <span className="text-xs text-muted-foreground">—</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" />{slot.tierName}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Full name"
                                  value={slot.name}
                                  onChange={e => updateSlot(i, "name", e.target.value)}
                                  className="pl-8 h-9 text-sm"
                                />
                              </div>
                              <div className="relative flex-1">
                                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Phone number"
                                  value={slot.phone}
                                  onChange={e => updateSlot(i, "phone", e.target.value)}
                                  className="pl-8 h-9 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {hasSelection && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {isSimpleEvent ? (
                      <>
                        <div className="flex justify-between">
                          <span>{event.venue || SIMPLE_TIER_NAME} — {SIMPLE_TIER_NAME} × {ticketCount}</span>
                          <span>{fmt(simpleTotalBasePrice, currency)}</span>
                        </div>
                        {simpleEarlyBirdDiscountTotal > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Early bird discount</span>
                            <span>-{fmt(simpleEarlyBirdDiscountTotal, currency)}</span>
                          </div>
                        )}
                        {simpleMemberDiscountTotal > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>Member discount</span>
                            <span>-{fmt(simpleMemberDiscountTotal, currency)}</span>
                          </div>
                        )}
                        {simpleGroupDiscountTotal > 0 && (
                          <div className="flex justify-between text-purple-600">
                            <span>Group discount</span>
                            <span>-{fmt(simpleGroupDiscountTotal, currency)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {cartItems.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.venueName} — {item.tierName} × {item.quantity}</span>
                            <span>{fmt(item.price * item.quantity, currency)}</span>
                          </div>
                        ))}
                        {earlyBirdDiscountTotal > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Early bird discount</span>
                            <span>-{fmt(earlyBirdDiscountTotal, currency)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span>{fmt(subtotal, currency)}</span>
                    </div>

                    {couponApplied && couponDiscount > 0 && (
                      <div className="flex justify-between items-start text-green-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Coupon ({couponName || localCouponCode})</span>
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
                        <span className="font-medium shrink-0">-{fmt(couponDiscount, currency)}</span>
                      </div>
                    )}

                    {reservedDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points discount</span>
                        <span>-{fmt(reservedDiscount, currency)}</span>
                      </div>
                    )}

                    {netAmount > 0 && (
                      <PriceBreakdown
                        baseAmount={netAmount}
                        pgFeeTotal={feeBreakdown ? feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst : 0}
                        platformFeeTotal={feeBreakdown ? feeBreakdown.platformFee + feeBreakdown.platformFeeGst : 0}
                        total={amountToCharge}
                        feeHandlingType={event?.feeHandlingType}
                        formatCurrency={(a) => fmt(a, currency)}
                      />
                    )}
                    {feesAbsorbed && netAmount > 0 && (
                      <p className="text-xs text-green-600">Platform &amp; gateway fees are covered by the organiser.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {user && hasSelection && payableBeforePoints > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Redeem Points
                    {availablePoints === null
                      ? <span className="ml-1 text-xs text-muted-foreground">(Loading…)</span>
                      : <span className="ml-1 text-xs text-muted-foreground">(Available: {availablePoints})</span>
                    }
                  </label>
                  {availablePoints === null ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching your points balance…
                    </div>
                  ) : availablePoints === 0 ? (
                    <p className="text-sm text-muted-foreground">You have no points available to redeem.</p>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          min={1}
                          max={availablePoints}
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.value === "" ? "" : Number(e.target.value))}
                          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                          placeholder="Points"
                          disabled={!!reservationToken || reserving}
                        />
                        <div className="flex gap-2">
                          {reservationToken ? (
                            <Button disabled size="sm" variant="outline" className="flex-1 sm:flex-none border-green-500 text-green-600">Applied</Button>
                          ) : (
                            <Button
                              onClick={reservePoints}
                              disabled={reserving || !redeemPoints || Number(redeemPoints) <= 0}
                              size="sm"
                              className="flex-1 sm:flex-none"
                            >
                              {reserving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Reserving...</> : "Reserve"}
                            </Button>
                          )}
                          {(redeemPoints !== "" || reservationToken) && (
                            <Button variant="ghost" onClick={clearReservation} disabled={reserving} size="sm">Clear</Button>
                          )}
                        </div>
                      </div>
                      {reservationToken && (
                        <p className="text-sm text-green-600">Reserved: {fmt(reservedDiscount, currency)}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {hasSelection && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    Coupon Code
                  </label>
                  {!couponApplied ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localCouponCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase()
                          setLocalCouponCode(val)
                          if (!val && autoCouponRemoved) {
                            setAutoCouponRemoved(false)
                            triggerAutoCouponApply(subtotal)
                          }
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                        disabled={validatingCoupon}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateCoupon() } }}
                      />
                      <Button onClick={validateCoupon} disabled={!localCouponCode.trim() || validatingCoupon} size="sm" variant="outline">
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500 rounded-lg">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                          <span>{couponName}</span>
                          {isAutoApplied && (
                            <span className="bg-green-100 text-green-800 text-[10px] leading-4 px-1.5 py-0.5 rounded font-medium border border-green-200">
                              Member Discount Auto-Applied
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">Code: {localCouponCode}</p>
                      </div>
                      {!isAutoApplied ? (
                        <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-destructive hover:text-destructive">
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
                </div>
              )}

              {showGuestWizard && (
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
              )}

              {checkoutEventId && isPaidCheckout && (
                <div className="flex flex-col gap-3 pb-2">
                  <RefundPolicyCheckoutLine eventId={checkoutEventId} />
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
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pb-2">
                Platform fees may be non-refundable per{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Global Platform Terms
                </a>
                .
              </p>
            </>
          )}
        </div>

        {!showWizardStep && (
          <div className="flex-shrink-0 pt-4 border-t bg-background shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] z-10">
            <div className="flex justify-between items-center font-bold text-lg px-1 mb-3">
              <span>Total:</span>
              <span className="text-primary">{fmt(amountToCharge, currency)}</span>
            </div>
            <Button
              onClick={onPrimaryAction}
              disabled={loading || !hasSelection || refundPolicy.payBlockedByPolicy || authStillLoading}
              className="w-full"
              size="lg"
            >
              {authStillLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading account...</>
              ) : loading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Processing...</>
              ) : !hasSelection ? (
                "Select tickets to continue"
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {amountToCharge <= 0 ? "Confirm Booking" : `${isCSREvent ? 'Donate' : 'Pay'} ${fmt(amountToCharge, currency)}`}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
    </>
  )
}
