"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCodeSelect } from "@/components/country-code-select"
import {
  CreditCard,
  Info,
  Loader2,
  AlertTriangle,
  UserCheck,
  Users,
  Check,
  ArrowUp,
  Award,
  Tag,
  X,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { calculateTransactionFees, computeMembershipPlanCharge } from "@/lib/transactionFees"
import { useAuth } from "@/contexts/auth-context"
import { formatDisplayDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { LoginModal } from "@/components/login-modal"

export interface JoinablePlan {
  _id: string
  name: string
  description?: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
  bookingStartDate?: string
  bookingEndDate?: string
  referralReward?: {
    enabled: boolean
    points: number
  }
}

interface JoinMembershipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  clubName?: string
  platformFeePercent?: number
  plans?: JoinablePlan[]
  primaryColor?: string
  returnPath?: string
  initialPlanId?: string
  mode?: "register" | "subscribe" | "upgrade"
  selectedPlanId?: string
  isDashboard?: boolean
}

type ReferralStatus = "idle" | "checking" | "found" | "not-found" | "not-member" | "self"
type ModalMode = "register" | "subscribe" | "upgrade"

interface AppliedMembershipCoupon {
  code: string
  name: string
  discountType: "flat" | "percentage"
  discountValue: number
  discount: number
}

const EMPTY_REGISTRATION = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  date_of_birth: "",
  gender: "male",
  phoneNumber: "",
  countryCode: "+91",
  address_line1: "",
  address_line2: "",
  city: "",
  state_province: "",
  zip_code: "",
  country: "",
  level_name: "",
  id_proof_type: "Aadhar",
  id_proof_number: "",
  name: "",
  tshirtSize: "",
  tshirtColor: "",
  club_member_id: "",
}

export const CLUB_MEMBER_ID_MANDATORY_TEAM_ID = "133604"

export function extractClubTeamId(source?: any): string {
  if (!source) return ""
  const teamId =
    source.sports?.teamId ??
    source.data?.sports?.teamId ??
    source.data?.data?.sports?.teamId ??
    source.teamId ??
    ""
  return String(teamId).trim()
}

export const isClubMemberIdMandatory = (teamId?: string | number | null) =>
  String(teamId ?? "").trim() === CLUB_MEMBER_ID_MANDATORY_TEAM_ID

// ponytail: name-based single-club check — swap for a clubId/feature-flag lookup if more clubs need this.
// Substring match (not exact equality) survives curly quotes / spacing / suffix tweaks in the club name.
const TSHIRT_FIELD_CLUB_NAME_MATCH = "arsenal hyderabad"
const TSHIRT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
const TSHIRT_COLOR_OPTIONS = ["Red", "White"]
const TSHIRT_REFERENCE_IMAGES = [
  { src: "/arsenal-hyderabad/tshirt-white.jpeg", alt: "White T-Shirt" },
  { src: "/arsenal-hyderabad/tshirt-red.jpeg", alt: "Red T-Shirt" },
  { src: "/arsenal-hyderabad/tshirt-size-chart.jpeg", alt: "Size Chart" },
]

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "INR" }).format(price)

const formatPlanPeriod = (plan: JoinablePlan) => {
  if (plan.planStartDate && plan.planEndDate) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `${new Date(plan.planStartDate).toLocaleDateString(undefined, opts)} – ${new Date(plan.planEndDate).toLocaleDateString(undefined, opts)}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime"
  if (months === 12) return "1 Year"
  return `${months} Month${months > 1 ? "s" : ""}`
}

const getMembershipStartDate = (m: any) => m?.start_date ?? m?.startDate ?? ""
const getMembershipEndDate = (m: any) => m?.end_date ?? m?.endDate ?? ""

const resolveMembershipPlanId = (membership: any): string | null => {
  const level = membership?.membership_level_id
  if (!level) return null
  if (typeof level === "string") return level
  if (typeof level === "object" && level._id) return String(level._id)
  return null
}

const getPlanSalesState = (plan: JoinablePlan) => {
  const now = Date.now()
  const bookingStartMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
  const bookingEndMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
  const notStarted = Boolean(bookingStartMs && now < bookingStartMs)
  const closed = Boolean(bookingEndMs && now > bookingEndMs)
  return { isOpen: !notStarted && !closed, closed, notStarted }
}

export function JoinMembershipModal({
  open,
  onOpenChange,
  clubId,
  clubName: propClubName = "",
  platformFeePercent,
  plans: propPlans = [],
  primaryColor = "#3b82f6",
  returnPath,
  initialPlanId,
  selectedPlanId: propSelectedPlanId,
  isDashboard = false,
}: JoinMembershipModalProps) {
  const router = useRouter()
  const { user, checkAuth, isAdmin } = useAuth()
  const [internalPlans, setInternalPlans] = useState<JoinablePlan[]>([])
  const [internalClubName, setInternalClubName] = useState<string>("")
  const [clubTeamId, setClubTeamId] = useState<string>("")

  useEffect(() => {
    if (!open || !clubId) return
    if (propPlans && propPlans.length > 0) return

    apiClient.getMembershipPlans(clubId).then((res: any) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || []
        setInternalPlans(list.filter((p: any) => p.isActive))
      }
    })
  }, [open, clubId, propPlans])

  useEffect(() => {
    if (!open || !clubId) return

    let cancelled = false

    const loadClubTeam = async () => {
      try {
        setClubTeamId("")
        const clubRes: any = await apiClient.getClubById(clubId, true)
        if (cancelled) return
        const club = clubRes?.data?.data || clubRes?.data || clubRes
        if (!propClubName && club?.name) setInternalClubName(club.name)
        let teamId = extractClubTeamId(club)
        if (!teamId) {
          const settingsRes: any = await apiClient.getClubSettings(clubId, true)
          if (cancelled) return
          teamId = extractClubTeamId(settingsRes?.data?.data || settingsRes?.data || settingsRes)
        }
        setClubTeamId(teamId)
      } catch {
        if (!cancelled) setClubTeamId("")
      }
    }

    loadClubTeam()
    return () => {
      cancelled = true
    }
  }, [open, clubId, propClubName])

  const plans = propPlans && propPlans.length > 0 ? propPlans : internalPlans
  const clubName = propClubName || internalClubName || "Club"
  const effectiveInitialPlanId = propSelectedPlanId || initialPlanId

  const showTshirtFields = clubName.toLowerCase().includes(TSHIRT_FIELD_CLUB_NAME_MATCH)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(effectiveInitialPlanId || plans[0]?._id || "")
  const [isProcessing, setIsProcessing] = useState(false)
  const [registrationData, setRegistrationData] = useState({ ...EMPTY_REGISTRATION })
  const [registrationErrors, setRegistrationErrors] = useState({ phoneNumber: "" })
  const [referralPhone, setReferralPhone] = useState("")
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle")
  const [referralName, setReferralName] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedMembershipCoupon | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [isAutoAppliedCoupon, setIsAutoAppliedCoupon] = useState(false)
  const [autoCouponRemoved, setAutoCouponRemoved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingPayment, setPendingPayment] = useState<{
    planId: string
    planName: string
    orderId: string
    orderNumber: string
    total: number
    subtotal?: number
    platformFeeTotal?: number
    platformFeePercent?: number
    razorpayFeeTotal?: number
    currency: string
    paymentMethod: string
    referralPhone?: string
    isUpgrade?: boolean
    isRegistration?: boolean
    prefillPhone?: string
    prefillEmail?: string
    couponCode?: string
    couponDiscount?: number
  } | null>(null)
  const [pendingRegistrationData, setPendingRegistrationData] = useState<typeof registrationData | null>(null)
  const [razorpayOpen, setRazorpayOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const isLoggedIn = Boolean(user?._id && typeof window !== "undefined" && localStorage.getItem("token"))

  const handlePostSubscriptionRedirect = async (targetClubId?: string) => {
    const cid = targetClubId || clubId
    const isAppRedirect = typeof window !== "undefined" && sessionStorage.getItem("appRedirect") === "true"
    if (isAppRedirect) {
      sessionStorage.removeItem("appRedirect")
      try {
        const ssoRes = await apiClient.createSsoTicket()
        if (ssoRes.success && ssoRes.data?.ssoTicket) {
          window.location.href = `wingmanpro://sso-callback?ssoTicket=${encodeURIComponent(ssoRes.data.ssoTicket)}&clubId=${encodeURIComponent(cid)}&status=success`
          return
        }
      } catch (err) {
        console.error("Failed to generate SSO ticket for app redirect:", err)
      }
    }

    const utm = typeof window !== "undefined" ? sessionStorage.getItem("utm_source") : null
    const dest = utm
      ? `/dashboard/user/my-clubs?utm_source=${encodeURIComponent(utm)}`
      : "/dashboard/user/my-clubs"
    router.push(dest)
  }

  const currentMembership = useMemo(() => {
    if (!user || !("memberships" in user) || !user.memberships) return null
    const clubMemberships = (user.memberships as any[]).filter(
      (m) => (m.club_id?._id === clubId || m.club_id === clubId) && m.status === "active"
    )
    if (clubMemberships.length === 0) return null
    return clubMemberships.reduce((latest: any, current: any) => {
      const latestDate = new Date(getMembershipStartDate(latest))
      const currentDate = new Date(getMembershipStartDate(current))
      return currentDate > latestDate ? current : latest
    })
  }, [user, clubId])

  const currentPlanId = useMemo(
    () => (currentMembership ? resolveMembershipPlanId(currentMembership) : null),
    [currentMembership]
  )

  const currentPlanDetails = useMemo(() => {
    if (!currentMembership) return null
    const level = currentMembership.membership_level_id
    if (level && typeof level === "object" && level.name) {
      return {
        _id: String(level._id ?? currentPlanId),
        name: level.name,
        price: level.price ?? 0,
        currency: level.currency || "INR",
      }
    }
    const fromList = currentPlanId ? plans.find((p) => String(p._id) === currentPlanId) : null
    if (fromList) {
      return {
        _id: fromList._id,
        name: fromList.name,
        price: fromList.price,
        currency: fromList.currency || "INR",
      }
    }
    return currentPlanId
      ? { _id: currentPlanId, name: "Current Plan", price: 0, currency: "INR" }
      : null
  }, [currentMembership, currentPlanId, plans])

  const isMembershipExpired = () => {
    const endDateStr = getMembershipEndDate(currentMembership)
    if (!endDateStr) return false
    return new Date(endDateStr) <= new Date()
  }

  const mode: ModalMode = useMemo(() => {
    if (!isLoggedIn) return "register"
    if (currentMembership && !isMembershipExpired()) return "upgrade"
    return "subscribe"
  }, [isLoggedIn, currentMembership, open])

  useEffect(() => {
    if (!open) return
    if (mode === "upgrade" && currentPlanId) {
      const upgradeCandidates = plans.filter((plan) => {
        if (String(plan._id) === currentPlanId) return false
        if (!getPlanSalesState(plan).isOpen) return false
        const currentPrice = currentPlanDetails?.price ?? 0
        return plan.price > currentPrice
      })
      const preferredId =
        effectiveInitialPlanId &&
        upgradeCandidates.some((p) => p._id === effectiveInitialPlanId) &&
        String(effectiveInitialPlanId) !== currentPlanId
          ? effectiveInitialPlanId
          : upgradeCandidates[0]?._id
      if (preferredId) {
        setSelectedPlanId(preferredId)
        return
      }
      if (String(selectedPlanId) === currentPlanId) {
        const fallback = plans.find((p) => String(p._id) !== currentPlanId)
        if (fallback) setSelectedPlanId(fallback._id)
      }
      return
    }
    if (effectiveInitialPlanId && plans.some((p) => p._id === effectiveInitialPlanId)) {
      setSelectedPlanId(effectiveInitialPlanId)
      return
    }
    if (plans.length > 0 && !plans.some((p) => p._id === selectedPlanId)) {
      setSelectedPlanId(plans[0]._id)
    }
  }, [open, plans, effectiveInitialPlanId, mode, currentPlanId, currentPlanDetails?.price])

  useEffect(() => {
    if (!open) {
      setRegistrationData({ ...EMPTY_REGISTRATION })
      setRegistrationErrors({ phoneNumber: "" })
      setReferralPhone("")
      setReferralStatus("idle")
      setReferralName(null)
      setPendingPayment(null)
      setPendingRegistrationData(null)
    } else if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const urlEmail = params.get("email")
      const urlPhone = params.get("phone")
      if (urlEmail || urlPhone) {
        setRegistrationData((prev) => ({
          ...prev,
          email: prev.email || urlEmail || "",
          phoneNumber: prev.phoneNumber || urlPhone || "",
        }))
      }
    }
  }, [open])

  useEffect(() => {
    const digits = referralPhone.replace(/\D/g, "")
    if (digits.length !== 8) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }
    const refereePhone =
      mode === "register"
        ? registrationData.phoneNumber.replace(/\D/g, "")
        : user?.phoneNumber?.replace(/\D/g, "")

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setReferralStatus("checking")
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.checkReferralPhone(digits, {
          clubId,
          refereePhone: refereePhone && refereePhone.length >= 9 ? refereePhone : undefined,
        })
        if (res.success && res.data) {
          if (res.data.isSelf) {
            setReferralStatus("self")
            setReferralName(null)
          } else if (res.data.exists && res.data.isMember === false) {
            setReferralStatus("not-member")
            setReferralName(res.data.name ?? null)
          } else if (res.data.exists) {
            setReferralStatus("found")
            setReferralName(res.data.name ?? null)
          } else {
            setReferralStatus("not-found")
            setReferralName(null)
          }
        } else {
          setReferralStatus("idle")
        }
      } catch {
        setReferralStatus("idle")
      }
    }, 600)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [referralPhone, clubId, user?.phoneNumber, registrationData.phoneNumber, mode])

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) ?? plans[0]
  const validReferral = referralStatus === "found" ? referralPhone.replace(/\D/g, "") : undefined

  const isCurrentPlan = (plan: JoinablePlan) =>
    currentPlanId != null && String(plan._id) === currentPlanId

  const isUpgradePlan = (plan: JoinablePlan) => {
    const currentPrice = currentPlanDetails?.price ?? 0
    return plan.price > currentPrice
  }

  const isDowngradePlan = (plan: JoinablePlan) => {
    const currentPrice = currentPlanDetails?.price ?? 0
    return plan.price < currentPrice
  }

  const isPlanDisabled = (plan: JoinablePlan) => {
    const salesState = getPlanSalesState(plan)
    if (!salesState.isOpen) return true
    if (mode !== "upgrade") return false
    if (isCurrentPlan(plan)) return true
    if (currentMembership && !isMembershipExpired() && (isDowngradePlan(plan) || !isUpgradePlan(plan))) return true
    return false
  }

  /** Single source of truth for what a plan actually costs — the same calculation feeds the
   *  price shown in the plan selector/summary and the amount handed to Razorpay in startPayment. */
  const getPlanCharge = (plan: JoinablePlan) => {
    const currentPlanPrice = currentPlanDetails?.price ?? 0
    const isUpgradeEligible = mode === "upgrade" && Boolean(currentMembership) && !isMembershipExpired()
    const resolvedPlatformFeePercent = Number(platformFeePercent)
    return computeMembershipPlanCharge({
      planPrice: plan.price,
      currentPlanPrice,
      isUpgradeEligible,
      platformFeePercent: Number.isFinite(resolvedPlatformFeePercent) ? resolvedPlatformFeePercent : undefined,
    })
  }

  const getDiscountedPlanCharge = (plan: JoinablePlan) => {
    const charge = getPlanCharge(plan)
    const discount = plan._id === selectedPlanId
      ? Math.min(appliedCoupon?.discount ?? 0, charge.baseAmount)
      : 0
    const resolvedPlatformFeePercent = Number(platformFeePercent)
    return {
      ...calculateTransactionFees(
        Math.max(charge.baseAmount - discount, 0),
        Number.isFinite(resolvedPlatformFeePercent) ? resolvedPlatformFeePercent : undefined,
      ),
      isUpgrade: charge.isUpgrade,
      originalBaseAmount: charge.baseAmount,
      couponDiscount: discount,
    }
  }

  useEffect(() => {
    setCouponCode("")
    setAppliedCoupon(null)
    setIsAutoAppliedCoupon(false)
    setAutoCouponRemoved(false)
  }, [selectedPlanId])

  const hasAppliedCoupon = Boolean(appliedCoupon)
  useEffect(() => {
    if (!open || !selectedPlan || hasAppliedCoupon || autoCouponRemoved) return
    const chargeAmount = getPlanCharge(selectedPlan).baseAmount
    if (chargeAmount <= 0) return

    const rawPhone = mode === "register"
      ? (registrationData.phoneNumber ? `${registrationData.countryCode || "+91"}${registrationData.phoneNumber}` : "")
      : user?.phoneNumber || ""
    const phone = rawPhone && rawPhone !== "+91" ? rawPhone : undefined
    const email = (mode === "register" ? registrationData.email : user?.email) || undefined
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.getHighestEligibleAutoCoupon({
          clubId,
          phone,
          email,
          cartSubtotal: chargeAmount,
          purchaseType: "membership",
        })
        const coupon = response.success ? response.data?.coupon : null
        if (!coupon) return
        setAppliedCoupon({ ...coupon, discount: Math.min(coupon.discount, chargeAmount) })
        setCouponCode(coupon.code)
        setIsAutoAppliedCoupon(true)
      } catch {
        // Auto-apply is best effort; manual coupon entry remains available.
      }
    }, mode === "register" ? 500 : 0)
    return () => clearTimeout(timer)
  }, [
    open,
    selectedPlanId,
    mode,
    clubId,
    registrationData.countryCode,
    registrationData.phoneNumber,
    registrationData.email,
    user?.phoneNumber,
    user?.email,
    hasAppliedCoupon,
    autoCouponRemoved,
  ])

  const handleValidateCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    const chargeAmount = getPlanCharge(selectedPlan).baseAmount
    if (chargeAmount <= 0) {
      toast.error("Coupons are not applicable to this plan")
      return
    }
    setValidatingCoupon(true)
    try {
      const rawPhone = mode === "register"
        ? (registrationData.phoneNumber ? `${registrationData.countryCode || "+91"}${registrationData.phoneNumber}` : "")
        : user?.phoneNumber || ""
      const phone = rawPhone && rawPhone !== "+91" ? rawPhone : undefined
      const email = (mode === "register" ? registrationData.email : user?.email) || undefined

      const response = await apiClient.validateCoupon(
        couponCode.trim().toUpperCase(),
        {
          ticketPrice: chargeAmount,
          clubId,
          purchaseType: "membership",
          email,
          phone,
        }
      )
      if (response.success && response.data?.coupon) {
        setAppliedCoupon({
          ...response.data.coupon,
          discount: Math.min(response.data.coupon.discount, chargeAmount),
        })
        setCouponCode(response.data.coupon.code)
        setIsAutoAppliedCoupon(false)
        setAutoCouponRemoved(false)
        toast.success("Coupon applied successfully!")
      } else {
        setAppliedCoupon(null)
        toast.error(response.error || response.message || "Invalid coupon code")
      }
    } catch {
      setAppliedCoupon(null)
      toast.error("Unable to validate coupon. Please try again.")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode("")
    setAppliedCoupon(null)
    setAutoCouponRemoved(true)
    setIsAutoAppliedCoupon(false)
  }

  const getActionLabel = () => {
    if (!selectedPlan) return "Continue"
    const salesState = getPlanSalesState(selectedPlan)
    if (!salesState.isOpen) return salesState.closed ? "Membership Closed" : "Unavailable"
    if (mode === "upgrade") {
      if (isCurrentPlan(selectedPlan)) return "Your Current Plan"
      if (upgradeSelectablePlans.length === 0) return "No Upgrades Available"
      if (isUpgradePlan(selectedPlan)) return "Upgrade to This Plan"
      return "Upgrade Required"
    }
    if (getDiscountedPlanCharge(selectedPlan).baseAmount > 0) return mode === "register" ? "Pay & Create Account" : `Pay & Join — ${selectedPlan.name}`
    return mode === "register" ? "Register & Join" : `Join with ${selectedPlan.name}`
  }

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return "Phone number is required"
    if (!/^\d{7,15}$/.test(phone)) return "Phone number must be 7-15 digits"
    return ""
  }

  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setRazorpayScriptLoaded(true)
    document.body.appendChild(script)
    return () => {
      try { document.body.removeChild(script) } catch (_) {}
    }
  }, [])

  const startPayment = async (opts: {
    plan: JoinablePlan
    baseAmount: number
    isUpgrade?: boolean
    isRegistration?: boolean
    registrationSnapshot?: typeof registrationData
  }) => {
    const { plan, baseAmount, isUpgrade, isRegistration, registrationSnapshot } = opts
    const resolvedPlatformFeePercent = Number(platformFeePercent)
    const couponDiscount = Math.min(appliedCoupon?.discount ?? 0, baseAmount)
    const feeBreakdown = calculateTransactionFees(
      Math.max(baseAmount - couponDiscount, 0),
      Number.isFinite(resolvedPlatformFeePercent) ? resolvedPlatformFeePercent : undefined,
    )
    const orderId = isRegistration
      ? `club-${Date.now()}`
      : `membership-${plan._id}-${user?._id ?? "guest"}-${Date.now()}`
    const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`

    const prefillPhone = isRegistration && registrationSnapshot 
      ? `${registrationSnapshot.countryCode || "+91"}${registrationSnapshot.phoneNumber}`
      : user?.phoneNumber || ""
    const prefillEmail = isRegistration && registrationSnapshot
      ? registrationSnapshot.email
      : user?.email || ""

    if (!razorpayScriptLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
      toast.error("Payment system is loading. Please try again in a moment.")
      return
    }

    setIsProcessing(true)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) authHeaders['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          amount: feeBreakdown.finalAmount,
          currency: plan.currency || "INR",
          orderId,
          orderNumber,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.error || errBody?.details || 'Failed to create payment order')
      }

      const { razorpayOrderId, amount, currency: orderCurrency } = await response.json()

      const pendingRes = await apiClient.createPendingMembershipPurchase(
        plan._id,
        razorpayOrderId,
        validReferral,
        { tshirtSize: registrationData.tshirtSize, tshirtColor: registrationData.tshirtColor },
        appliedCoupon?.code,
        registrationData.club_member_id?.trim() || undefined
      )

      if (!pendingRes.success) {
        toast.error(pendingRes.error || "Unable to prepare membership purchase")
        setIsProcessing(false)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: orderCurrency || "INR",
        name: clubName || 'RallyUp',
        description: isUpgrade ? `Pay upgrade difference for ${plan.name}` : `Payment for ${plan.name}`,
        order_id: razorpayOrderId,
        prefill: {
          name: registrationSnapshot ? `${registrationSnapshot.first_name} ${registrationSnapshot.last_name}` : user?.name || '',
          email: prefillEmail,
          contact: prefillPhone,
        },
        method: {
          netbanking: true, card: true, wallet: true, upi: true, paylater: true, cardless_emi: true, emi: true, bank_transfer: true,
        },
        handler: async function (paymentResponse: any) {
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: orderId,
              }),
            })

            if (!verifyResponse.ok) throw new Error('Payment verification failed')

            const subscribeRes = await apiClient.subscribeMembershipPlan(
              plan._id,
              {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              validReferral || undefined,
              { tshirtSize: registrationData.tshirtSize, tshirtColor: registrationData.tshirtColor },
              appliedCoupon?.code,
              registrationSnapshot?.club_member_id?.trim() || registrationData.club_member_id?.trim() || undefined,
            )

            if (!subscribeRes.success) {
              throw new Error(subscribeRes.error || subscribeRes.message || 'Failed to activate membership subscription')
            }

            const upgraded = subscribeRes.data && "isUpgrade" in subscribeRes.data && (subscribeRes.data as any).isUpgrade
            toast.success(upgraded ? `Membership upgraded! Welcome to ${clubName || 'the club'}.` : `Membership activated! Welcome to ${clubName || 'the club'}.`)
            setRazorpayOpen(false)
            onOpenChange(false)
            await checkAuth()
            await handlePostSubscriptionRedirect(clubId)
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed')
            setRazorpayOpen(false)
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled.")
            setRazorpayOpen(false)
            setIsProcessing(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        toast.error(resp.error?.description || "Payment failed")
        setRazorpayOpen(false)
        setIsProcessing(false)
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment")
      setRazorpayOpen(false)
      setIsProcessing(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    const isMandatoryClubMemberId = isClubMemberIdMandatory(clubTeamId)
    if (isMandatoryClubMemberId && !registrationData.club_member_id?.trim()) {
      toast.error(`Club Membership ID is required for ${clubName}`)
      return
    }

    const phoneError = validatePhoneNumber(registrationData.phoneNumber)
    setRegistrationErrors({ phoneNumber: phoneError })
    if (phoneError) {
      toast.error(phoneError)
      return
    }

    const salesState = getPlanSalesState(selectedPlan)
    if (!salesState.isOpen) {
      toast.error(salesState.closed ? "Membership Closed" : "Membership sales are not open yet for this plan")
      return
    }

    setIsProcessing(true)
    try {
      // Guard against duplicate accounts for BOTH paid and free plans — a guest
      // typing in an email/phone that already belongs to a registered user must
      // be sent to log in rather than allowed to attempt registration again.
      const checkResponse = await fetch(getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registrationData.email,
          phoneNumber: registrationData.phoneNumber,
          countryCode: registrationData.countryCode || "+91",
          clubId,
          membershipPlanId: selectedPlan._id,
        }),
      })
      const checkData = await checkResponse.json()
      if (checkResponse.ok && checkData.planValid) {
        toast.info("An account with this email or phone already exists. Please log in to continue.")
        setIsProcessing(false)
        setLoginModalOpen(true)
        return
      }

      if (selectedPlan.price > 0) {
        const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...registrationData }),
        })
        const registerData = await registerResponse.json()
        if (!registerResponse.ok || !registerData.token) {
          toast.error(registerData.message || "Registration failed")
          return
        }
        localStorage.setItem("token", registerData.token)
        localStorage.setItem("userType", "member")

        if (getDiscountedPlanCharge(selectedPlan).baseAmount > 0) {
          startPayment({ plan: selectedPlan, baseAmount: selectedPlan.price, isRegistration: true, registrationSnapshot: registrationData })
          toast.info("Account created. Complete payment to activate your membership.")
        } else {
          const subscribeRes = await apiClient.subscribeMembershipPlan(
            selectedPlan._id,
            undefined,
            validReferral,
            { tshirtSize: registrationData.tshirtSize, tshirtColor: registrationData.tshirtColor },
            appliedCoupon?.code,
            registrationData.club_member_id?.trim() || undefined
          )
          if (!subscribeRes.success) {
            toast.error(subscribeRes.error || "Failed to activate discounted membership")
            return
          }
          toast.success("Coupon applied — membership activated!")
          onOpenChange(false)
          await checkAuth()
          await handlePostSubscriptionRedirect(clubId)
        }
        return
      }

      const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...registrationData }),
      })
      const registerData = await registerResponse.json()

      if (registerResponse.ok && registerData.token) {
        localStorage.setItem("token", registerData.token)
        localStorage.setItem("userType", "member")
        const subscribeRes = await apiClient.subscribeMembershipPlan(selectedPlan._id, undefined, validReferral, {
          tshirtSize: registrationData.tshirtSize,
          tshirtColor: registrationData.tshirtColor,
        }, appliedCoupon?.code, registrationData.club_member_id?.trim() || undefined)
        if (subscribeRes.success) {
          toast.success("Successfully joined the club!")
          onOpenChange(false)
          await checkAuth()
          await handlePostSubscriptionRedirect(clubId)
        } else {
          toast.error(subscribeRes.error || "Failed to join club after registration")
        }
      } else {
        toast.error(registerData.message || "Registration failed")
      }
    } catch {
      toast.error("An error occurred during registration")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubscribeOrUpgrade = async () => {
    if (!selectedPlan || !user?._id) return
    const isMandatoryClubMemberId = isClubMemberIdMandatory(clubTeamId)
    if (isMandatoryClubMemberId && !registrationData.club_member_id?.trim()) {
      toast.error(`Club Membership ID is required for ${clubName}`)
      return
    }
    if (isAdmin) {
      toast.error("Admin accounts cannot purchase memberships. Please log in as a member.")
      return
    }

    const salesState = getPlanSalesState(selectedPlan)
    if (!salesState.isOpen) {
      toast.error(salesState.closed ? "Membership Closed" : "Membership sales are not open yet for this plan")
      return
    }

    if (mode === "upgrade") {
      if (isCurrentPlan(selectedPlan)) {
        toast.info("This is already your current plan.")
        return
      }
      if (isPlanDisabled(selectedPlan) || !isUpgradePlan(selectedPlan)) {
        toast.error("You can only upgrade to a higher-tier plan while your membership is active.")
        return
      }
    }

    const { isUpgrade, baseAmount } = getPlanCharge(selectedPlan)

    if (getDiscountedPlanCharge(selectedPlan).baseAmount > 0) {
      startPayment({ plan: selectedPlan, baseAmount, isUpgrade })
      return
    }

    setIsProcessing(true)
    try {
      const response = await apiClient.subscribeMembershipPlan(selectedPlan._id, undefined, validReferral, {
        tshirtSize: registrationData.tshirtSize,
        tshirtColor: registrationData.tshirtColor,
      }, appliedCoupon?.code, registrationData.club_member_id?.trim() || undefined)
      if (response.success) {
        const upgraded = response.data && "isUpgrade" in response.data && response.data.isUpgrade
        toast.success(upgraded ? "Membership upgraded successfully!" : "Membership activated successfully!")
        onOpenChange(false)
        await checkAuth()
        await handlePostSubscriptionRedirect(clubId)
      } else {
        toast.error(response.error || "Failed to activate membership")
      }
    } catch {
      toast.error("Failed to activate membership. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = async (
    _orderId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    if (!pendingPayment) return
    const { planId, referralPhone: pendingReferral } = pendingPayment
    setIsProcessing(true)
    try {
      const response = await apiClient.subscribeMembershipPlan(
        planId,
        { razorpay_payment_id: paymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature },
        pendingReferral,
        {
          tshirtSize: pendingRegistrationData?.tshirtSize ?? registrationData.tshirtSize,
          tshirtColor: pendingRegistrationData?.tshirtColor ?? registrationData.tshirtColor,
        },
        pendingPayment.couponCode,
        pendingRegistrationData?.club_member_id ?? registrationData.club_member_id
      )
      if (response.success) {
        const upgraded = response.data && "isUpgrade" in response.data && response.data.isUpgrade
        toast.success(upgraded ? "Payment successful — membership upgraded!" : "Payment successful — membership activated!")
        setPendingPayment(null)
        setPendingRegistrationData(null)
        onOpenChange(false)
        await checkAuth()
        await handlePostSubscriptionRedirect(clubId)
      } else {
        toast.error(response.error || "Failed to activate membership after payment")
      }
    } catch {
      toast.error("Failed to activate membership after payment")
    } finally {
      setIsProcessing(false)
      setPendingPayment(null)
      setPendingRegistrationData(null)
    }
  }

  const handlePaymentFailure = async (
    _orderId: string,
    _paymentId: string,
    razorpayOrderId: string,
    _razorpaySignature: string,
    error?: any,
  ) => {
    if (razorpayOrderId && pendingPayment) {
      await apiClient.cancelPendingMembershipPurchase(pendingPayment.planId, razorpayOrderId).catch(() => undefined)
    }
    toast.error("Payment failed or was cancelled. Please try again.")
    setPendingPayment(null)
    setPendingRegistrationData(null)
  }

  const renderReferralField = () => {
    const selectedPlan = plans.find(p => p._id === selectedPlanId)
    if (!selectedPlan?.referralReward?.enabled) return null
    return (
    <div className={cn(
      "rounded-xl border p-4 space-y-2",
      isDashboard ? "border-border bg-card text-card-foreground shadow-sm" : "border-secondary/20 bg-slate-50/50 text-slate-800"
    )}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor="join-referralPhone" className={cn(
          "text-[10px] font-bold tracking-widest uppercase",
          isDashboard ? "text-muted-foreground" : "text-secondary"
        )}>
          Referral Mobile Number
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className={cn("h-3.5 w-3.5 cursor-help", isDashboard ? "text-muted-foreground" : "text-secondary")} />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-secondary text-white border-none rounded-xl">
              Enter the registered mobile number of the member who referred you to earn them points!
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={cn("text-xs", isDashboard ? "text-muted-foreground" : "text-slate-500")}>(Optional)</span>
      </div>
      <div className="relative">
        <Input
          id="join-referralPhone"
          type="tel"
          placeholder="8-digit mobile number of referring member"
          value={referralPhone}
          onChange={(e) => setReferralPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className={cn(
            "h-12 pr-10 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary",
            isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400",
            referralStatus === "found" && "border-green-500",
            (referralStatus === "not-found" || referralStatus === "not-member" || referralStatus === "self") && "border-amber-400"
          )}
          maxLength={8}
          inputMode="numeric"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {referralStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {referralStatus === "found" && <UserCheck className="h-4 w-4 text-green-600" />}
          {(referralStatus === "not-found" || referralStatus === "not-member" || referralStatus === "self") && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </div>
      {referralStatus === "found" && referralName && (
        <p className="text-xs font-medium text-green-600">{referralName}</p>
      )}
      {referralStatus === "found" && !referralName && (
        <p className="text-xs font-medium text-green-600">Referral confirmed — your referrer will earn points when you join.</p>
      )}
      {referralStatus === "not-found" && (
        <p className="text-xs text-amber-600">Member not found. Please check the number to ensure your friend gets their points.</p>
      )}
      {referralStatus === "not-member" && (
        <p className="text-xs text-amber-600">
          {referralName ? `${referralName} is registered but not an active member of ${clubName}.` : "This number is not an active member of this club."}
        </p>
      )}
      {referralStatus === "self" && (
        <p className="text-xs font-medium text-destructive">You cannot refer yourself.</p>
      )}
    </div>
    )
  }

  const renderClubMemberIdField = () => {
    const isMandatory = isClubMemberIdMandatory(clubTeamId)
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="club_member_id" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>
          Club Membership ID{isMandatory ? " *" : <span className="text-muted-foreground text-xs ml-1">(Optional)</span>}
        </Label>
        <Input
          id="club_member_id"
          type="text"
          value={registrationData.club_member_id}
          onChange={(e) => setRegistrationData({ ...registrationData, club_member_id: e.target.value })}
          required={isMandatory}
          placeholder={isMandatory ? "As registered on official site" : "Optional — as registered on official site"}
          className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")}
        />
      </div>
    )
  }

  const renderTshirtFields = () => {
    if (!showTshirtFields) return null
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="tshirtSize" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Choose T-Shirt Size:</Label>
          <select id="tshirtSize" value={registrationData.tshirtSize} onChange={(e) => setRegistrationData({ ...registrationData, tshirtSize: e.target.value })} className={cn("w-full h-12 rounded-xl border px-3 focus:outline-none focus:border-primary", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")}>
            <option value="">Select size</option>
            {TSHIRT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tshirtColor" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Choose T-Shirt Colour:</Label>
          <select id="tshirtColor" value={registrationData.tshirtColor} onChange={(e) => setRegistrationData({ ...registrationData, tshirtColor: e.target.value })} className={cn("w-full h-12 rounded-xl border px-3 focus:outline-none focus:border-primary", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")}>
            <option value="">Select colour</option>
            {TSHIRT_COLOR_OPTIONS.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      </>
    )
  }

  const renderTshirtGallery = () => {
    if (!showTshirtFields) return null
    return (
      <div className="space-y-2">
        <Label className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>T-Shirt Reference</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TSHIRT_REFERENCE_IMAGES.map((img) => (
            <a key={img.src} href={img.src} target="_blank" rel="noopener noreferrer" className={cn("block overflow-hidden rounded-xl border", isDashboard ? "border-border" : "border-secondary/30")}>
              <img src={img.src} alt={img.alt} className="h-auto w-full object-cover" />
              <span className={cn("block px-2 py-1 text-center text-xs", isDashboard ? "text-muted-foreground" : "text-slate-500")}>{img.alt}</span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  const renderCurrentMembershipBanner = () => {
    if (mode !== "upgrade" || !currentMembership || !currentPlanDetails) return null
    return (
      <div className={cn("shrink-0 px-6 pb-4 pt-4", isDashboard ? "bg-background" : "bg-white")}>
        <Card className={cn("rounded-xl", isDashboard ? "border-green-500/30 bg-green-500/10 text-foreground" : "border-green-200 bg-green-50 text-green-900")}>
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold">
                Current Plan: {currentPlanDetails.name} — {formatPrice(currentPlanDetails.price, currentPlanDetails.currency)}
              </span>
            </div>
            {getMembershipStartDate(currentMembership) && (
              <p className="text-xs opacity-90 ml-6">
                Member since {formatDisplayDate(getMembershipStartDate(currentMembership))}
              </p>
            )}
            {getMembershipEndDate(currentMembership) ? (
              <p className="text-xs opacity-90 ml-6">
                Active until {formatDisplayDate(getMembershipEndDate(currentMembership))}. Choose a higher-tier plan below to upgrade.
              </p>
            ) : (
              <p className="text-xs opacity-90 ml-6">
                Active (lifetime). Choose a higher-tier plan below to upgrade.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPlanSelector = () => {
    const selectablePlans =
      mode === "upgrade" ? plans.filter((plan) => !isCurrentPlan(plan)) : plans

    return (
    <div className="space-y-2">
      <Label htmlFor="membership-plan" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>
        {mode === "upgrade" ? "Upgrade To" : "Membership Plan"}
      </Label>
      {mode === "upgrade" && selectablePlans.length === 0 ? (
        <p className={cn("text-sm rounded-xl border border-dashed p-4 text-center", isDashboard ? "border-border text-muted-foreground" : "border-secondary/30 text-slate-500")}>
          No higher-tier plans are available right now. You are already on the best available plan.
        </p>
      ) : (
      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
        <SelectTrigger id="membership-plan" className={cn("rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")}>
          <SelectValue placeholder="Select a plan" />
        </SelectTrigger>
        <SelectContent className={cn(isDashboard ? "bg-popover text-popover-foreground border-border" : "bg-white text-black border-secondary")}>
          {selectablePlans.map((plan) => {
            const disabled = isPlanDisabled(plan)
            const salesState = getPlanSalesState(plan)
            return (
              <SelectItem key={plan._id} value={plan._id} disabled={disabled || !salesState.isOpen}>
                {plan.name} — {formatPrice(getPlanCharge(plan).finalAmount, plan.currency)}
                {mode === "upgrade" && isUpgradePlan(plan) ? " (Upgrade)" : ""}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      )}
    </div>
  )}

  const renderPlanSummary = () => {
    if (!selectedPlan || (mode === "upgrade" && isCurrentPlan(selectedPlan))) return null
    const originalCharge = getPlanCharge(selectedPlan)
    const discountedCharge = getDiscountedPlanCharge(selectedPlan)
    return (
      <div className={cn(
        "rounded-xl border p-4 shadow-sm space-y-2",
        isDashboard ? "border-border bg-card text-card-foreground" : "border-secondary/20 bg-slate-50/50 text-slate-800"
      )}>
        <h4 className={cn("flex items-center gap-2 text-sm font-semibold", isDashboard ? "text-foreground" : "text-secondary")}>
          <Award className="h-4 w-4 shrink-0 text-primary" />
          Selected Plan: <span className="text-primary">{selectedPlan.name}</span>
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className={isDashboard ? "text-muted-foreground" : "text-slate-500"}>{getPlanCharge(selectedPlan).isUpgrade ? "Upgrade price:" : "Price:"}</span>
            <span className={cn("font-semibold text-primary", appliedCoupon && (isDashboard ? "line-through text-muted-foreground" : "line-through text-slate-400"))}>
              {formatPrice(originalCharge.finalAmount, selectedPlan.currency)}
            </span>
          </div>
          {appliedCoupon && (
            <>
              <div className="flex justify-between gap-4 text-green-600">
                <span>Coupon ({appliedCoupon.code}):</span>
                <span>-{formatPrice(discountedCharge.couponDiscount, selectedPlan.currency)}</span>
              </div>
              <div className={cn("flex justify-between gap-4 border-t pt-1 font-semibold", isDashboard ? "border-border" : "border-slate-200")}>
                <span>Total after discount:</span>
                <span className="text-primary">{formatPrice(discountedCharge.finalAmount, selectedPlan.currency)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-4">
            <span className={isDashboard ? "text-muted-foreground" : "text-slate-500"}>Duration:</span>
            <span className={cn("font-medium", isDashboard ? "text-foreground" : "text-slate-700")}>{formatPlanPeriod(selectedPlan)}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderCouponField = () => {
    if (!selectedPlan || getPlanCharge(selectedPlan).baseAmount <= 0) return null
    return (
      <div className={cn(
        "rounded-xl border p-4 space-y-3",
        isDashboard ? "border-border bg-card text-card-foreground" : "border-secondary/20 bg-slate-50/50 text-slate-800"
      )}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <Label htmlFor="membership-coupon" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>
            Coupon or promo code
          </Label>
        </div>
        {appliedCoupon ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-green-600">{appliedCoupon.name}</p>
              <p className="text-xs text-green-600/80">
                {appliedCoupon.code}{isAutoAppliedCoupon ? " · Auto-applied" : " · Applied"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={removeCoupon} aria-label="Remove coupon" className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-500/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              id="membership-coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleValidateCoupon()
                }
              }}
              placeholder="Enter coupon code"
              className={cn(
                "h-10 rounded-lg uppercase",
                isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black"
              )}
            />
            <Button
              type="button"
              onClick={() => void handleValidateCoupon()}
              disabled={validatingCoupon || !couponCode.trim()}
              className={cn(
                "h-10 rounded-lg px-5 font-bold transition-all duration-300",
                isDashboard
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  : "bg-primary text-white hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] active:scale-95 disabled:bg-primary/50 disabled:text-white"
              )}
            >
              {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!selectedPlan && mode !== "upgrade") return null

  const upgradeSelectablePlans =
    mode === "upgrade" ? plans.filter((plan) => !isCurrentPlan(plan) && isUpgradePlan(plan) && getPlanSalesState(plan).isOpen) : []

  const dialogTitle =
    mode === "register"
      ? selectedPlan.price > 0
        ? `Register & Pay — Join ${clubName}`
        : `Register & Join — ${clubName}`
      : mode === "upgrade"
        ? `Upgrade Membership — ${clubName}`
        : `Join ${clubName}`

  const actionDisabled =
    isProcessing ||
    (mode === "upgrade" &&
      (upgradeSelectablePlans.length === 0 ||
        !selectedPlan ||
        isCurrentPlan(selectedPlan) ||
        isPlanDisabled(selectedPlan) ||
        !isUpgradePlan(selectedPlan)))

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!razorpayOpen) onOpenChange(o) }} modal={!razorpayOpen}>
        <DialogContent
          className={cn(
            "flex max-h-[90vh] w-[92vw] max-w-[360px] sm:w-full sm:max-w-2xl flex-col overflow-hidden p-0 sm:p-0 rounded-2xl shadow-2xl",
            isDashboard
              ? "border border-border bg-background text-foreground"
              : "!rounded-2xl sm:!rounded-2xl border-0 bg-white public-theme"
          )}
          onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
          onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
        >
          <DialogHeader className={cn(
            "shrink-0 px-6 py-6 relative rounded-t-2xl",
            isDashboard
              ? "bg-card border-b border-border text-card-foreground"
              : "bg-secondary text-white"
          )}>
            <DialogTitle className={cn(
              "flex items-center gap-2 text-2xl font-bold",
              isDashboard ? "text-foreground" : "text-white font-black"
            )}>
              <div className={cn("rounded-lg p-2", isDashboard ? "bg-primary/10 text-primary" : "bg-white/10 text-white")}>
                <Users className="w-5 h-5" />
              </div>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className={cn("text-sm mt-1", isDashboard ? "text-muted-foreground" : "text-white/80")}>
              {mode === "register" ? (
                selectedPlan.price > 0
                  ? "Fill your details, then complete payment to create your account and activate membership."
                  : "Create your account and join with the selected plan."
              ) : mode === "upgrade" ? (
                "Choose a higher-tier plan to upgrade your membership."
              ) : (
                "Select a membership plan and complete your subscription."
              )}
            </DialogDescription>
          </DialogHeader>

          {renderCurrentMembershipBanner()}

          <div className={cn(
            "flex-1 overflow-y-auto px-6 pb-6 pt-6 space-y-5",
            isDashboard ? "bg-background text-foreground" : "bg-white text-slate-800"
          )}>
            {mode === "register" ? (
              <form onSubmit={handleRegistration} className="space-y-4">
                {renderPlanSelector()}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Username</Label>
                    <Input id="username" value={registrationData.username} onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })} className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>First Name <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="first_name" value={registrationData.first_name} onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Last Name <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="last_name" value={registrationData.last_name} onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Date of Birth <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="date_of_birth" type="date" value={registrationData.date_of_birth} onChange={(e) => setRegistrationData({ ...registrationData, date_of_birth: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Gender <span className="text-primary ml-0.5">*</span></Label>
                    <select id="gender" value={registrationData.gender} onChange={(e) => setRegistrationData({ ...registrationData, gender: e.target.value })} required className={cn("w-full h-12 rounded-xl border px-3 focus:outline-none focus:border-primary", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Email Address <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="email" type="email" value={registrationData.email} onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-[7rem_1fr] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="countryCode" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Country Code <span className="text-primary ml-0.5">*</span></Label>
                      <CountryCodeSelect id="countryCode" value={registrationData.countryCode} onValueChange={(value) => setRegistrationData({ ...registrationData, countryCode: value })} className={cn("h-12 rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Phone Number <span className="text-primary ml-0.5">*</span></Label>
                      <Input id="phoneNumber" type="tel" inputMode="numeric" minLength={7} maxLength={15} pattern="\d{7,15}" value={registrationData.phoneNumber} onChange={(e) => setRegistrationData({ ...registrationData, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 15) })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                      {registrationErrors.phoneNumber && <p className="text-destructive text-sm">{registrationErrors.phoneNumber}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Address Line 1 <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="address_line1" value={registrationData.address_line1} onChange={(e) => setRegistrationData({ ...registrationData, address_line1: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Address Line 2</Label>
                    <Input id="address_line2" value={registrationData.address_line2} onChange={(e) => setRegistrationData({ ...registrationData, address_line2: e.target.value })} className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>City <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="city" value={registrationData.city} onChange={(e) => setRegistrationData({ ...registrationData, city: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state_province" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>State / Province <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="state_province" value={registrationData.state_province} onChange={(e) => setRegistrationData({ ...registrationData, state_province: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>ZIP / Postal Code <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="zip_code" value={registrationData.zip_code} onChange={(e) => setRegistrationData({ ...registrationData, zip_code: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>Country <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="country" value={registrationData.country} onChange={(e) => setRegistrationData({ ...registrationData, country: e.target.value })} required className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_proof_type" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>ID Proof Type</Label>
                    <select id="id_proof_type" value={registrationData.id_proof_type} onChange={(e) => setRegistrationData({ ...registrationData, id_proof_type: e.target.value })} className={cn("w-full h-12 rounded-xl border px-3 focus:outline-none focus:border-primary", isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black")}>
                      <option value="Aadhar">Aadhar</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="PAN">PAN Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_proof_number" className={cn("text-[10px] font-bold tracking-widest uppercase", isDashboard ? "text-muted-foreground" : "text-secondary")}>ID Proof Number</Label>
                    <Input id="id_proof_number" value={registrationData.id_proof_number} onChange={(e) => setRegistrationData({ ...registrationData, id_proof_number: e.target.value })} className={cn("h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary", isDashboard ? "border-input bg-background text-foreground placeholder:text-muted-foreground" : "border-secondary bg-white text-black placeholder:text-slate-400")} />
                  </div>
                  {renderClubMemberIdField()}
                  {renderTshirtFields()}
                </div>
                {renderTshirtGallery()}
                {selectedPlan?.referralReward?.enabled && renderReferralField()}
                {renderCouponField()}
                {renderPlanSummary()}
                <Button type="submit" disabled={isProcessing} className={cn("w-full h-12 font-bold rounded-xl transition-all duration-300 active:scale-95 mt-4", isDashboard ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" : "bg-primary text-white hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B]")}>
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : getActionLabel()}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {renderPlanSelector()}
                {renderClubMemberIdField()}
                {renderCouponField()}
                {renderPlanSummary()}
                {showTshirtFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{renderTshirtFields()}</div>
                )}
                {renderTshirtGallery()}
                {selectedPlan?.referralReward?.enabled && renderReferralField()}
                <Button
                  className={cn(
                    "w-full h-12 font-bold rounded-xl transition-all duration-300 active:scale-95",
                    isDashboard
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white"
                  )}
                  onClick={handleSubscribeOrUpgrade}
                  disabled={actionDisabled}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : mode === "upgrade" && isUpgradePlan(selectedPlan) ? (
                    <><ArrowUp className="w-4 h-4 mr-2" />{getActionLabel()}</>
                  ) : mode === "upgrade" && isCurrentPlan(selectedPlan) ? (
                    <><Check className="w-4 h-4 mr-2" />{getActionLabel()}</>
                  ) : (
                    <><CreditCard className="w-4 h-4 mr-2" />{getActionLabel()}</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSuccess={() => {
          checkAuth()
          setLoginModalOpen(false)
        }}
      />
    </>
  )
}
