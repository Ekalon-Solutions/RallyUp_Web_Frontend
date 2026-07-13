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
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { calculateTransactionFees } from "@/lib/transactionFees"
import { useAuth } from "@/contexts/auth-context"
import { formatDisplayDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

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
  clubName: string
  plans: JoinablePlan[]
  primaryColor?: string
  returnPath?: string
  initialPlanId?: string
}

type ReferralStatus = "idle" | "checking" | "found" | "not-found" | "not-member" | "self"
type ModalMode = "register" | "subscribe" | "upgrade"

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
}

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
  clubName,
  plans,
  primaryColor = "#3b82f6",
  returnPath,
  initialPlanId,
}: JoinMembershipModalProps) {
  const router = useRouter()
  const { user, checkAuth } = useAuth()
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?._id ?? "")
  const [isProcessing, setIsProcessing] = useState(false)
  const [registrationData, setRegistrationData] = useState({ ...EMPTY_REGISTRATION })
  const [registrationErrors, setRegistrationErrors] = useState({ phoneNumber: "" })
  const [referralPhone, setReferralPhone] = useState("")
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle")
  const [referralName, setReferralName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingPayment, setPendingPayment] = useState<{
    planId: string
    planName: string
    orderId: string
    orderNumber: string
    total: number
    subtotal?: number
    platformFeeTotal?: number
    razorpayFeeTotal?: number
    currency: string
    paymentMethod: string
    referralPhone?: string
    isUpgrade?: boolean
    isRegistration?: boolean
    prefillPhone?: string
    prefillEmail?: string
  } | null>(null)
  const [pendingRegistrationData, setPendingRegistrationData] = useState<typeof registrationData | null>(null)

  const isLoggedIn = Boolean(user?._id && typeof window !== "undefined" && localStorage.getItem("token"))

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
        initialPlanId &&
        upgradeCandidates.some((p) => p._id === initialPlanId) &&
        String(initialPlanId) !== currentPlanId
          ? initialPlanId
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
    if (initialPlanId && plans.some((p) => p._id === initialPlanId)) {
      setSelectedPlanId(initialPlanId)
      return
    }
    if (plans.length > 0 && !plans.some((p) => p._id === selectedPlanId)) {
      setSelectedPlanId(plans[0]._id)
    }
  }, [open, plans, initialPlanId, mode, currentPlanId, currentPlanDetails?.price])

  useEffect(() => {
    if (!open) {
      setRegistrationData({ ...EMPTY_REGISTRATION })
      setRegistrationErrors({ phoneNumber: "" })
      setReferralPhone("")
      setReferralStatus("idle")
      setReferralName(null)
      setPendingPayment(null)
      setPendingRegistrationData(null)
    }
  }, [open])

  useEffect(() => {
    const digits = referralPhone.replace(/\D/g, "")
    if (digits.length !== 10) {
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
    if (currentMembership && !isMembershipExpired() && isDowngradePlan(plan)) return true
    return false
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
    if (selectedPlan.price > 0) return mode === "register" ? "Pay & Create Account" : `Pay & Join — ${selectedPlan.name}`
    return mode === "register" ? "Register & Join" : `Join with ${selectedPlan.name}`
  }

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return "Phone number is required"
    if (!/^\d{9,15}$/.test(phone)) return "Phone number must be 9-15 digits"
    return ""
  }

  const startPayment = (opts: {
    plan: JoinablePlan
    baseAmount: number
    isUpgrade?: boolean
    isRegistration?: boolean
    registrationSnapshot?: typeof registrationData
  }) => {
    const { plan, baseAmount, isUpgrade, isRegistration, registrationSnapshot } = opts
    const feeBreakdown = calculateTransactionFees(baseAmount)
    const orderId = isRegistration
      ? `club-${Date.now()}`
      : `membership-${plan._id}-${user?._id ?? "guest"}-${Date.now()}`
    const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`

    if (isRegistration && registrationSnapshot) {
      setPendingRegistrationData({ ...registrationSnapshot })
    }

    const prefillPhone = isRegistration && registrationSnapshot 
      ? `${registrationSnapshot.countryCode || "+91"}${registrationSnapshot.phoneNumber}`
      : user?.phoneNumber || ""
    const prefillEmail = isRegistration && registrationSnapshot
      ? registrationSnapshot.email
      : user?.email || ""

    setPendingPayment({
      planId: plan._id,
      planName: plan.name,
      orderId,
      orderNumber,
      total: feeBreakdown.finalAmount,
      subtotal: feeBreakdown.baseAmount,
      platformFeeTotal: feeBreakdown.platformFee + feeBreakdown.platformFeeGst,
      razorpayFeeTotal: feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst,
      currency: plan.currency || "INR",
      paymentMethod: "all",
      referralPhone: validReferral,
      isUpgrade,
      isRegistration,
      prefillPhone,
      prefillEmail,
    })
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

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
        try {
          sessionStorage.setItem(
            "clubs_pending_join",
            JSON.stringify({ clubId, membershipPlanId: selectedPlan._id, returnPath: returnPath || window.location.pathname })
          )
        } catch (_) {}
        const utm = typeof window !== "undefined" ? sessionStorage.getItem("utm_source") : null
        const nextUrl = utm
          ? `/login?next=${encodeURIComponent(returnPath || window.location.pathname)}&utm_source=${encodeURIComponent(utm)}`
          : `/login?next=${encodeURIComponent(returnPath || window.location.pathname)}`
        router.push(nextUrl)
        return
      }

      if (selectedPlan.price > 0) {
        startPayment({ plan: selectedPlan, baseAmount: selectedPlan.price, isRegistration: true, registrationSnapshot: registrationData })
        toast.info("Complete payment to create your account and activate membership.")
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
        const subscribeRes = await apiClient.subscribeMembershipPlan(selectedPlan._id, undefined, validReferral)
        if (subscribeRes.success) {
          toast.success("Successfully joined the club!")
          onOpenChange(false)
          await checkAuth()
          const utm = typeof window !== "undefined" ? sessionStorage.getItem("utm_source") : null
          const dest = utm
            ? `/dashboard/user/my-clubs?utm_source=${encodeURIComponent(utm)}`
            : "/dashboard/user/my-clubs"
          router.push(dest)
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

    const currentPlanPrice = currentPlanDetails?.price ?? 0
    const isUpgrade = Boolean(mode === "upgrade" && currentMembership && !isMembershipExpired() && selectedPlan.price > currentPlanPrice)
    const baseAmount = isUpgrade ? Math.max(0, selectedPlan.price - currentPlanPrice) : selectedPlan.price

    if (baseAmount > 0) {
      startPayment({ plan: selectedPlan, baseAmount, isUpgrade })
      return
    }

    setIsProcessing(true)
    try {
      const response = await apiClient.subscribeMembershipPlan(selectedPlan._id, undefined, validReferral)
      if (response.success) {
        const upgraded = response.data && "isUpgrade" in response.data && response.data.isUpgrade
        toast.success(upgraded ? "Membership upgraded successfully!" : "Membership activated successfully!")
        onOpenChange(false)
        await checkAuth()
        const utm = typeof window !== "undefined" ? sessionStorage.getItem("utm_source") : null
        const dest = utm
          ? `/dashboard/user/my-clubs?utm_source=${encodeURIComponent(utm)}`
          : "/dashboard/user/my-clubs"
        router.push(dest)
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
    const { planId, referralPhone: pendingReferral, isRegistration } = pendingPayment
    setIsProcessing(true)
    try {
      if (isRegistration && pendingRegistrationData) {
        const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingRegistrationData }),
        })
        const registerData = await registerResponse.json()
        if (!registerResponse.ok || !registerData.token) {
          toast.error(registerData.message || "Payment succeeded, but account creation failed. Please contact support.")
          return
        }
        localStorage.setItem("token", registerData.token)
        localStorage.setItem("userType", "member")
      }

      const response = await apiClient.subscribeMembershipPlan(
        planId,
        { razorpay_payment_id: paymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature },
        pendingReferral
      )
      if (response.success) {
        const upgraded = response.data && "isUpgrade" in response.data && response.data.isUpgrade
        toast.success(upgraded ? "Payment successful — membership upgraded!" : "Payment successful — membership activated!")
        setPendingPayment(null)
        setPendingRegistrationData(null)
        onOpenChange(false)
        await checkAuth()
        const utm = typeof window !== "undefined" ? sessionStorage.getItem("utm_source") : null
        const dest = utm
          ? `/dashboard/user/my-clubs?utm_source=${encodeURIComponent(utm)}`
          : "/dashboard/user/my-clubs"
        router.push(dest)
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

  const handlePaymentFailure = () => {
    toast.error("Payment failed or was cancelled. Please try again.")
    setPendingPayment(null)
    setPendingRegistrationData(null)
  }

  const renderReferralField = () => {
    const selectedPlan = plans.find(p => p._id === selectedPlanId)
    if (!selectedPlan?.referralReward?.enabled) return null
    return (
    <div className="rounded-xl border border-secondary/20 bg-slate-50/50 p-4 space-y-2 text-slate-800">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="join-referralPhone" className="text-secondary text-[10px] font-bold tracking-widest uppercase">
          Referral Mobile Number
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-secondary cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-secondary text-white border-none rounded-xl">
              Enter the registered mobile number of the member who referred you to earn them points!
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-slate-500">(Optional)</span>
      </div>
      <div className="relative">
        <Input
          id="join-referralPhone"
          type="tel"
          placeholder="10-digit mobile number of referring member"
          value={referralPhone}
          onChange={(e) => setReferralPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={cn(
            "h-12 pr-10 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary",
            referralStatus === "found" && "border-green-500",
            (referralStatus === "not-found" || referralStatus === "not-member" || referralStatus === "self") && "border-amber-400"
          )}
          maxLength={10}
          inputMode="numeric"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {referralStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
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

  const renderCurrentMembershipBanner = () => {
    if (mode !== "upgrade" || !currentMembership || !currentPlanDetails) return null
    return (
      <div className="shrink-0 px-6 pb-4 pt-4 bg-white">
        <Card className="border-green-200 bg-green-50 text-green-900 rounded-xl">
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold text-green-900">
                Current Plan: {currentPlanDetails.name} — {formatPrice(currentPlanDetails.price, currentPlanDetails.currency)}
              </span>
            </div>
            {getMembershipStartDate(currentMembership) && (
              <p className="text-xs text-green-800 ml-6">
                Member since {formatDisplayDate(getMembershipStartDate(currentMembership))}
              </p>
            )}
            {getMembershipEndDate(currentMembership) ? (
              <p className="text-xs text-green-800 ml-6">
                Active until {formatDisplayDate(getMembershipEndDate(currentMembership))}. Choose a higher-tier plan below to upgrade.
              </p>
            ) : (
              <p className="text-xs text-green-800 ml-6">
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
      <Label htmlFor="membership-plan" className="text-secondary text-[10px] font-bold tracking-widest uppercase">
        {mode === "upgrade" ? "Upgrade To" : "Membership Plan"}
      </Label>
      {mode === "upgrade" && selectablePlans.length === 0 ? (
        <p className="text-sm text-slate-500 rounded-xl border border-dashed border-secondary/30 p-4 text-center">
          No higher-tier plans are available right now. You are already on the best available plan.
        </p>
      ) : (
      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
        <SelectTrigger id="membership-plan" className="border-secondary rounded-xl bg-white text-black focus:ring-0 focus:ring-offset-0 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0">
          <SelectValue placeholder="Select a plan" />
        </SelectTrigger>
        <SelectContent className="bg-white text-black border-secondary">
          {selectablePlans.map((plan) => {
            const disabled = isPlanDisabled(plan)
            const salesState = getPlanSalesState(plan)
            return (
              <SelectItem key={plan._id} value={plan._id} disabled={disabled || !salesState.isOpen}>
                {plan.name} — {formatPrice(plan.price, plan.currency)}
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
    return (
      <div className="rounded-xl border border-secondary/20 bg-slate-50/50 p-4 shadow-sm space-y-2 text-slate-800">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-secondary">
          <Award className="h-4 w-4 shrink-0 text-primary" />
          Selected Plan: <span className="text-primary">{selectedPlan.name}</span>
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Price:</span>
            <span className="font-semibold text-primary">
              {formatPrice(selectedPlan.price, selectedPlan.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Duration:</span>
            <span className="font-medium text-slate-700">{formatPlanPeriod(selectedPlan)}</span>
          </div>
        </div>
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[92vw] max-w-[360px] sm:w-full sm:max-w-2xl flex-col overflow-hidden p-0 !rounded-2xl sm:!rounded-2xl border-0 shadow-2xl bg-white public-theme">
          <DialogHeader className="shrink-0 px-6 py-6 bg-secondary text-white relative rounded-t-2xl">
            <DialogTitle className="flex items-center gap-2 text-white font-black text-2xl">
              <div className="rounded-lg p-2 bg-white/10">
                <Users className="w-5 h-5 text-white" />
              </div>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
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

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-white space-y-5 text-slate-800">
            {mode === "register" ? (
              <form onSubmit={handleRegistration} className="space-y-4">
                {renderPlanSelector()}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Username <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="username" value={registrationData.username} onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-secondary text-[10px] font-bold tracking-widest uppercase">First Name <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="first_name" value={registrationData.first_name} onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Last Name <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="last_name" value={registrationData.last_name} onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Date of Birth <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="date_of_birth" type="date" value={registrationData.date_of_birth} onChange={(e) => setRegistrationData({ ...registrationData, date_of_birth: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Gender <span className="text-primary ml-0.5">*</span></Label>
                    <select id="gender" value={registrationData.gender} onChange={(e) => setRegistrationData({ ...registrationData, gender: e.target.value })} required className="w-full h-12 rounded-xl border border-secondary px-3 bg-white text-black focus:outline-none focus:border-primary">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Email Address <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="email" type="email" value={registrationData.email} onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-[7rem_1fr] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="countryCode" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Country Code <span className="text-primary ml-0.5">*</span></Label>
                      <CountryCodeSelect id="countryCode" value={registrationData.countryCode} onValueChange={(value) => setRegistrationData({ ...registrationData, countryCode: value })} className="h-12 rounded-xl border-secondary bg-white text-black focus:ring-0 focus:ring-offset-0 focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Phone Number <span className="text-primary ml-0.5">*</span></Label>
                      <Input id="phoneNumber" type="tel" value={registrationData.phoneNumber} onChange={(e) => setRegistrationData({ ...registrationData, phoneNumber: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                      {registrationErrors.phoneNumber && <p className="text-destructive text-sm">{registrationErrors.phoneNumber}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Address Line 1 <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="address_line1" value={registrationData.address_line1} onChange={(e) => setRegistrationData({ ...registrationData, address_line1: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Address Line 2</Label>
                    <Input id="address_line2" value={registrationData.address_line2} onChange={(e) => setRegistrationData({ ...registrationData, address_line2: e.target.value })} className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-secondary text-[10px] font-bold tracking-widest uppercase">City <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="city" value={registrationData.city} onChange={(e) => setRegistrationData({ ...registrationData, city: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state_province" className="text-secondary text-[10px] font-bold tracking-widest uppercase">State / Province <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="state_province" value={registrationData.state_province} onChange={(e) => setRegistrationData({ ...registrationData, state_province: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-secondary text-[10px] font-bold tracking-widest uppercase">ZIP / Postal Code <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="zip_code" value={registrationData.zip_code} onChange={(e) => setRegistrationData({ ...registrationData, zip_code: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-secondary text-[10px] font-bold tracking-widest uppercase">Country <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="country" value={registrationData.country} onChange={(e) => setRegistrationData({ ...registrationData, country: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_proof_type" className="text-secondary text-[10px] font-bold tracking-widest uppercase">ID Proof Type <span className="text-primary ml-0.5">*</span></Label>
                    <select id="id_proof_type" value={registrationData.id_proof_type} onChange={(e) => setRegistrationData({ ...registrationData, id_proof_type: e.target.value })} required className="w-full h-12 rounded-xl border border-secondary px-3 bg-white text-black focus:outline-none focus:border-primary">
                      <option value="Aadhar">Aadhar</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="PAN">PAN Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_proof_number" className="text-secondary text-[10px] font-bold tracking-widest uppercase">ID Proof Number <span className="text-primary ml-0.5">*</span></Label>
                    <Input id="id_proof_number" value={registrationData.id_proof_number} onChange={(e) => setRegistrationData({ ...registrationData, id_proof_number: e.target.value })} required className="h-12 rounded-xl border-secondary bg-white text-black placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                  </div>
                </div>
                {selectedPlan?.referralReward?.enabled && renderReferralField()}
                {renderPlanSummary()}
                <Button type="submit" disabled={isProcessing} className="w-full h-12 font-bold bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white rounded-xl transition-all duration-300 active:scale-95 mt-4">
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : getActionLabel()}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {renderPlanSelector()}
                {renderPlanSummary()}
                {selectedPlan?.referralReward?.enabled && renderReferralField()}
                <Button
                  className="w-full h-12 font-bold bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white rounded-xl transition-all duration-300 active:scale-95"
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

      {pendingPayment && (
        <PaymentSimulationModal
          isOpen={!!pendingPayment}
          onClose={() => {
            setPendingPayment(null)
            setPendingRegistrationData(null)
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          orderId={pendingPayment.orderId}
          orderNumber={pendingPayment.orderNumber}
          total={pendingPayment.total}
          subtotal={pendingPayment.subtotal}
          platformFeeTotal={pendingPayment.platformFeeTotal}
          razorpayFeeTotal={pendingPayment.razorpayFeeTotal}
          currency={pendingPayment.currency}
          paymentMethod={pendingPayment.paymentMethod}
          dialogTitle={pendingPayment.isUpgrade ? "Pay upgrade difference" : "Pay for membership"}
          dialogDescription={
            pendingPayment.isUpgrade
              ? `Pay the difference for ${pendingPayment.planName} (incl. GST & fees)`
              : pendingPayment.isRegistration
                ? "You're registered. Complete payment to activate your membership."
                : `Complete payment for ${pendingPayment.planName}`
          }
          payButtonLabel="Pay & activate"
          prefillPhone={pendingPayment.prefillPhone}
          prefillEmail={pendingPayment.prefillEmail}
        />
      )}
    </>
  )
}
