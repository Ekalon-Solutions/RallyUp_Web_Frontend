"use client"

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Ticket,
  Tag,
  Bell,
  BarChart2,
  Image as ImageIcon,
  Star,
  X,
  Loader2,
  ChevronDown,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react"
import { apiClient, type PublicMembershipCardDisplay } from "@/lib/api"
import { MembershipCard } from "@/components/membership-card"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { calculateTransactionFees, computeMembershipPlanCharge } from "@/lib/transactionFees"
import { useAuth } from "@/contexts/auth-context"
import { resolveRazorpayDismiss } from "@/lib/razorpay-dismiss"
import { LoginModal } from "@/components/login-modal"
import { cn } from "@/lib/utils"
import {
  validateFieldValue,
  type PlanAttributes,
  type PlanCustomField,
  type PublicPlanConfig,
} from "@/lib/membershipPlanConfig"

export interface JoinablePlan extends PublicPlanConfig {
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
  attributes?: PlanAttributes
}

interface Club {
  _id: string
  name: string
  logo?: string
  platformFeePercent?: number
}

interface ClubSettings {
  websiteSetup?: { isPublished: boolean }
  designSettings?: { primaryColor?: string; logo?: string | null }
}

interface AppliedCoupon {
  code: string
  name: string
  discountType: "flat" | "percentage"
  discountValue: number
  discount: number
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  username: "",
  date_of_birth: "",
  gender: "",
  email: "",
  countryCode: "+91",
  phoneNumber: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state_province: "",
  zip_code: "",
  country: "",
  id_proof_type: "",
  id_proof_number: "",
}

function formatPrice(price: number, currency: string = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}

function formatPlanPeriod(plan?: JoinablePlan | null): string {
  if (!plan) return "1 year"
  if (plan.planStartDate && plan.planEndDate) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `${new Date(plan.planStartDate).toLocaleDateString(undefined, opts)} – ${new Date(plan.planEndDate).toLocaleDateString(undefined, opts)}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime"
  if (months === 12) return "1 year"
  if (months === 1) return "1 month"
  return `${months} months`
}

function computeExpiryIso(plan?: JoinablePlan | null): string {
  if (plan?.planEndDate) {
    try {
      return new Date(plan.planEndDate).toISOString()
    } catch {
      // Fall through to relative date
    }
  }
  const months = plan?.duration ?? 12
  const d = new Date()
  d.setMonth(d.getMonth() + (months === 0 ? 120 : months))
  return d.toISOString()
}

function computeValidThru(plan?: JoinablePlan | null): string {
  if (!plan) return "Aug 31, 2027"
  if (plan.planEndDate) {
    return new Date(plan.planEndDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  const months = plan.duration ?? 12
  if (months === 0) return "Lifetime"
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const requestedPlanId = searchParams.get("planId")
  const { user, checkAuth } = useAuth()
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [plans, setPlans] = useState<JoinablePlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>(requestedPlanId || "")
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [isAutoAppliedCoupon, setIsAutoAppliedCoupon] = useState(false)
  const [autoCouponRemoved, setAutoCouponRemoved] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false)
  const [templateCard, setTemplateCard] = useState<PublicMembershipCardDisplay | null>(null)
  const [loadingCard, setLoadingCard] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load Razorpay checkout script
  useEffect(() => {
    if (typeof window === "undefined") return
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => setRazorpayScriptLoaded(true)
    document.body.appendChild(script)
    return () => {
      try {
        document.body.removeChild(script)
      } catch (_) {}
    }
  }, [])

  // Load club details, settings & plans
  useEffect(() => {
    if (!slug) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const clubRes = await apiClient.getClubById(slug, true)
        if (!active || !clubRes.success || !clubRes.data) return
        setClub(clubRes.data)

        const settingsRes = await apiClient.getClubSettings(slug, true)
        if (active && settingsRes.success && settingsRes.data) {
          setSettings((settingsRes.data as any).data || settingsRes.data)
        }

        const plansRes = await apiClient.getPublicClubs()
        if (active && plansRes.success && plansRes.data) {
          const match = (plansRes.data.clubs || []).find(
            (c: any) => c._id === clubRes.data!._id || c.slug === slug
          )
          const activePlans = ((match as any)?.membershipPlans || []).filter((p: any) => p.isActive)
          setPlans(activePlans as JoinablePlan[])
          if (requestedPlanId && activePlans.some((p: any) => p._id === requestedPlanId)) {
            setSelectedPlanId(requestedPlanId)
          } else if (activePlans.length > 0) {
            setSelectedPlanId(activePlans[0]._id)
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug, requestedPlanId])

  // Prefill user data if logged in
  useEffect(() => {
    if (!user) return
    const nameParts = (user.name || "").trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    setFormData((prev) => ({
      ...prev,
      first_name: prev.first_name || firstName,
      last_name: prev.last_name || lastName,
      email: prev.email || user.email || "",
      phoneNumber: prev.phoneNumber || (user.phoneNumber ? user.phoneNumber.replace(/^\+91/, "").replace(/\D/g, "") : ""),
    }))
  }, [user])

  const primaryColor = settings?.designSettings?.primaryColor || "#3b82f6"

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId]
  )

  const planCustomFields: PlanCustomField[] = useMemo(
    () => selectedPlan?.attributes?.customFields ?? [],
    [selectedPlan]
  )

  useEffect(() => {
    setCustomFieldValues({})
  }, [selectedPlan?._id])

  const updateCustomField = (label: string, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [label]: value }))
  }

  // Fetch saved template card for the selected plan
  useEffect(() => {
    if (!selectedPlan?._id) {
      setTemplateCard(null)
      return
    }
    let active = true
    setLoadingCard(true)
    ;(async () => {
      try {
        const res = await apiClient.getPlanTemplateCard(selectedPlan._id)
        if (active) {
          if (res.success && res.data) {
            setTemplateCard(res.data)
          } else {
            setTemplateCard(null)
          }
        }
      } catch {
        if (active) setTemplateCard(null)
      } finally {
        if (active) setLoadingCard(false)
      }
    })()
    return () => {
      active = false
    }
  }, [selectedPlan?._id])

  const activeCardData: PublicMembershipCardDisplay | null = useMemo(() => {
    if (!selectedPlan) return null
    if (templateCard) {
      const cardCustomization = templateCard.card?.customization
      return {
        ...templateCard,
        card: {
          ...templateCard.card,
          expiryDate: computeExpiryIso(selectedPlan),
          status: "active" as const,
          membershipId: cardCustomization?.idPrefix
            ? `${cardCustomization.idPrefix}-2026-123456`
            : "UM-2026-123456",
          customization: cardCustomization
            ? {
                ...cardCustomization,
                primaryColor: cardCustomization.primaryColor || primaryColor,
              }
            : undefined,
        },
        club: {
          ...templateCard.club,
          name: club?.name || templateCard.club?.name || "Demo Club",
          logo: club?.logo || templateCard.club?.logo,
        },
        membershipPlan: {
          ...templateCard.membershipPlan,
          name: selectedPlan.name,
          price: selectedPlan.price,
          currency: selectedPlan.currency || "INR",
        },
      }
    }
    return null
  }, [templateCard, selectedPlan, club, primaryColor])

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate pricing & discount
  const originalCharge = useMemo(() => {
    if (!selectedPlan) return { baseAmount: 0, finalAmount: 0 }
    return computeMembershipPlanCharge({
      planPrice: selectedPlan.price,
      currentPlanPrice: 0,
      isUpgradeEligible: false,
      platformFeePercent: Number.isFinite(Number(club?.platformFeePercent))
        ? Number(club?.platformFeePercent)
        : undefined,
    })
  }, [selectedPlan, club?.platformFeePercent])

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || !originalCharge.baseAmount) return 0
    return Math.min(appliedCoupon.discount, originalCharge.baseAmount)
  }, [appliedCoupon, originalCharge.baseAmount])

  const feeBreakdown = useMemo(() => {
    const discountedBase = Math.max(originalCharge.baseAmount - discountAmount, 0)
    return calculateTransactionFees(
      discountedBase,
      Number.isFinite(Number(club?.platformFeePercent)) ? Number(club?.platformFeePercent) : undefined
    )
  }, [originalCharge.baseAmount, discountAmount, club?.platformFeePercent])

  // Auto-apply highest eligible coupon
  useEffect(() => {
    if (!selectedPlan || !club?._id || appliedCoupon || autoCouponRemoved) return
    const chargeAmount = originalCharge.baseAmount
    if (chargeAmount <= 0) return

    const rawPhone = formData.phoneNumber ? `${formData.countryCode}${formData.phoneNumber}` : user?.phoneNumber
    const email = formData.email || user?.email

    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.getHighestEligibleAutoCoupon({
          clubId: club._id,
          phone: rawPhone,
          email,
          cartSubtotal: chargeAmount,
          purchaseType: "membership",
        })
        if (response.success && response.data?.coupon) {
          const coupon = response.data.coupon
          setAppliedCoupon({
            ...coupon,
            code: coupon.code ?? "",
            discount: Math.min(coupon.discount, chargeAmount),
          })
          setCouponCode(coupon.code ?? "")
          setIsAutoAppliedCoupon(true)
        }
      } catch {
        // Auto-apply is best effort
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [
    selectedPlan,
    club?._id,
    appliedCoupon,
    autoCouponRemoved,
    originalCharge.baseAmount,
    formData.phoneNumber,
    formData.countryCode,
    formData.email,
    user?.phoneNumber,
    user?.email,
  ])

  const handleValidateCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    const chargeAmount = originalCharge.baseAmount
    if (chargeAmount <= 0) {
      toast.error("Coupons are not applicable to this plan")
      return
    }
    setValidatingCoupon(true)
    try {
      const rawPhone = formData.phoneNumber ? `${formData.countryCode}${formData.phoneNumber}` : user?.phoneNumber
      const email = formData.email || user?.email
      const response = await apiClient.validateCoupon(couponCode.trim().toUpperCase(), {
        ticketPrice: chargeAmount,
        clubId: club?._id,
        purchaseType: "membership",
        email,
        phone: rawPhone,
      })
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

  const handleCancel = () => {
    router.push(`/clubs/${slug}/membership`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !club?._id) return

    if (!formData.first_name.trim()) {
      toast.error("First name is required")
      return
    }
    if (!formData.last_name.trim()) {
      toast.error("Last name is required")
      return
    }
    if (!formData.email.trim()) {
      toast.error("Email address is required")
      return
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!/^\d{7,15}$/.test(formData.phoneNumber.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 7-15 digit phone number")
      return
    }

    // Validate plan custom fields
    for (const field of planCustomFields) {
      const val = (customFieldValues[field.label] ?? "").trim()
      if (field.mandatory && !val) {
        toast.error(`${field.label} is required`)
        return
      }
      if (val) {
        if (field.type === "dropdown" && !(field.options ?? []).includes(val)) {
          toast.error(`${field.label} must be one of the configured options`)
          return
        }
        const err = validateFieldValue(field.type, val, field.label)
        if (err) {
          toast.error(err)
          return
        }
      }
    }

    setIsProcessing(true)

    try {
      // 1. Check if user already exists
      const checkResponse = await fetch(getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          countryCode: formData.countryCode || "+91",
          clubId: club._id,
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

      // 2. Register account if not already logged in
      let authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!authToken) {
        const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            membershipPlanId: selectedPlan._id,
            customFieldValues: Object.keys(customFieldValues).length ? customFieldValues : undefined,
          }),
        })
        const registerData = await registerResponse.json()
        if (!registerResponse.ok || !registerData.token) {
          toast.error(registerData.message || "Registration failed")
          setIsProcessing(false)
          return
        }
        authToken = registerData.token
        localStorage.setItem("token", registerData.token)
        localStorage.setItem("userType", "member")
      }

      // 3. If zero payment required (100% coupon or free plan)
      if (feeBreakdown.finalAmount <= 0) {
        const subscribeRes = await apiClient.subscribeMembershipPlan(
          selectedPlan._id,
          undefined,
          undefined,
          undefined,
          appliedCoupon?.code,
          undefined,
          Object.keys(customFieldValues).length ? customFieldValues : undefined
        )
        if (subscribeRes.success) {
          toast.success("Membership activated successfully!")
          await checkAuth()
          router.push(`/dashboard/user/my-clubs`)
        } else {
          toast.error(subscribeRes.error || "Failed to activate membership")
        }
        setIsProcessing(false)
        return
      }

      // 4. Create Razorpay order
      if (!razorpayScriptLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Payment system is initializing. Please try again.")
        setIsProcessing(false)
        return
      }

      const orderId = `membership-${Date.now()}`
      const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" }
      if (authToken) authHeaders["Authorization"] = `Bearer ${authToken}`

      const createOrderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          amount: feeBreakdown.finalAmount,
          currency: selectedPlan.currency || "INR",
          orderId,
          orderNumber,
        }),
      })

      if (!createOrderRes.ok) {
        const err = await createOrderRes.json().catch(() => null)
        throw new Error(err?.error || err?.details || "Failed to create payment order")
      }

      const { razorpayOrderId, amount, currency: orderCurrency } = await createOrderRes.json()

      const pendingRes = await apiClient.createPendingMembershipPurchase(
        selectedPlan._id,
        razorpayOrderId,
        undefined,
        undefined,
        appliedCoupon?.code,
        undefined,
        Object.keys(customFieldValues).length ? customFieldValues : undefined
      )

      if (!pendingRes.success) {
        toast.error(pendingRes.error || "Unable to prepare membership purchase")
        setIsProcessing(false)
        return
      }

      // 5. Trigger Razorpay Checkout
      let checkoutSettled = false
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency || "INR",
        name: club.name || "Club Membership",
        description: `Membership for ${selectedPlan.name}`,
        order_id: razorpayOrderId,
        prefill: {
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          email: formData.email,
          contact: `${formData.countryCode}${formData.phoneNumber}`,
        },
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
        handler: async function (paymentResponse: any) {
          if (checkoutSettled) return
          checkoutSettled = true
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId,
              }),
            })

            if (!verifyRes.ok) throw new Error("Payment verification failed")

            const subscribeRes = await apiClient.subscribeMembershipPlan(
              selectedPlan._id,
              {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              undefined,
              undefined,
              appliedCoupon?.code,
              undefined,
              Object.keys(customFieldValues).length ? customFieldValues : undefined
            )

            if (!subscribeRes.success) {
              throw new Error(subscribeRes.error || "Failed to activate membership")
            }

            toast.success(`Membership activated! Welcome to ${club.name}.`)
            await checkAuth()
            router.push("/dashboard/user/my-clubs")
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed")
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: async function () {
            if (checkoutSettled) return
            const result = await resolveRazorpayDismiss(razorpayOrderId)
            if (checkoutSettled) return
            if (result.outcome === "paid") {
              await options.handler(result.payment)
              return
            }
            if (result.outcome === "unconfirmed") {
              setIsProcessing(false)
              toast.info("We're confirming your payment. Your membership will activate shortly.")
              return
            }
            checkoutSettled = true
            toast.info("Payment cancelled.")
            setIsProcessing(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (resp: any) {
        toast.error(resp.error?.description || "Payment failed")
        setIsProcessing(false)
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
      setIsProcessing(false)
    }
  }

  // Display card values live
  const displayName = useMemo(() => {
    const full = `${formData.first_name} ${formData.last_name}`.trim()
    return full || (user?.name ? user.name : "John Doe")
  }, [formData.first_name, formData.last_name, user?.name])

  const displayValidThru = useMemo(() => computeValidThru(selectedPlan), [selectedPlan])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: primaryColor }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background text-foreground antialiased pb-12">
      {/* Top Navigation Bar with Back button & Theme toggle */}
      <div className="border-b border-border bg-background relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push(`/clubs/${slug}/membership`)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back to {club?.name || "Plans"}</span>
          </button>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            {!user?._id && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-8 rounded-lg border-border"
                onClick={() => setLoginModalOpen(true)}
              >
                Member Login
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Page Title & Subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Register & Pay
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Fill your details, then complete payment to create your account and activate membership.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-6 lg:gap-8 items-start">
          {/* Left Column: Card Preview + Benefits */}
          <div className="space-y-5 w-full">
            {/* Membership Card Preview (Renders plan's saved template card if available, else reference fallback) */}
            <div className="w-full">
              {loadingCard ? (
                <div className="w-full min-h-[230px] rounded-2xl border border-border bg-card/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                </div>
              ) : activeCardData ? (
                <div className="w-full flex justify-center">
                  <div className="w-full">
                    <MembershipCard
                      cardData={activeCardData}
                      userName={displayName}
                      membershipId={activeCardData.card.membershipId || "UM-2026-123456"}
                      showLogo={true}
                    />
                  </div>
                </div>
              ) : (
                /* Fallback sleek reference dark card */
                <div className="bg-[#1f2228] dark:bg-[#14161b] text-white rounded-2xl p-6 shadow-sm border border-white/10 dark:border-white/15 flex flex-col justify-between min-h-[225px] relative overflow-hidden transition-all">
                  {/* Subtle top primary accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: primaryColor }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-300 tracking-wide">
                      {club?.name || "Demo Club"}
                    </div>
                    {club?.logo && (
                      <img
                        src={club.logo}
                        alt={club.name}
                        className="w-6 h-6 object-contain rounded-full"
                      />
                    )}
                  </div>

                  <div className="text-center my-3">
                    <div className="text-xl font-bold text-white tracking-tight">
                      {displayName}
                    </div>
                    <div className="text-[10px] uppercase font-medium text-gray-400 mt-2 tracking-wider">
                      Membership ID
                    </div>
                    <div className="text-xs font-semibold text-gray-200 tracking-wider font-mono">
                      UM-2026-123456
                    </div>
                    <div className="text-[10px] uppercase font-medium text-gray-400 mt-2 tracking-wider">
                      Plan
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: primaryColor }}
                    >
                      {selectedPlan?.name || "Basic Member"}
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400">
                        Valid thru
                      </div>
                      <div className="text-xs font-bold text-white">
                        {displayValidThru}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                        Status
                      </div>
                      <div className="bg-[#0f1114] text-white text-[11px] font-medium px-3 py-0.5 rounded-full border border-white/10">
                        active
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Membership benefits Card */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-4">Membership benefits</h3>
              <div className="space-y-3.5">
                {/* Matchday tickets */}
                <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      Matchday tickets
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Priority access and exclusive member rates.
                    </div>
                  </div>
                </div>

                {/* Events & store discounts */}
                <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      Events & store discounts
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Special rates on events, merch and partner offers.
                    </div>
                  </div>
                </div>

                {/* News & updates */}
                <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      News & updates
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Stay informed on the latest club announcements.
                    </div>
                  </div>
                </div>

                {/* Polls */}
                <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      Polls
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Vote in member polls and have your say in club decisions.
                    </div>
                  </div>
                </div>

                {/* Gallery Access */}
                <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      Gallery Access
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Access exclusive photo galleries and behind -the scene content.
                    </div>
                  </div>
                </div>

                {/* Additional perks */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">
                      Additional perks
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      List all custom fields added by the Admin.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form Container */}
          <form
            onSubmit={handleSubmit}
            className="bg-card text-card-foreground rounded-2xl border border-border p-6 sm:p-8 shadow-sm flex-1 w-full"
          >
            {/* Section 1: Personal details */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                1
              </div>
              <h2 className="text-sm font-bold text-foreground">Personal details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">
                  First name{" "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    *
                  </span>
                </label>
                <Input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  required
                  className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">
                  Last name{" "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    *
                  </span>
                </label>
                <Input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  required
                  className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Username</label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Date of birth</label>
                <div className="relative">
                  <Input
                    type="date"
                    placeholder="mm/dd/yyyy"
                    value={formData.date_of_birth}
                    onChange={(e) => updateField("date_of_birth", e.target.value)}
                    className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground dark:[color-scheme:dark] focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Gender</label>
                <div className="relative">
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="w-full h-10 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">
                  Email address{" "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    *
                  </span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>
            </div>

            <div className="my-6 border-t border-border" />

            {/* Section 2: Contact & address */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                2
              </div>
              <h2 className="text-sm font-bold text-foreground">Contact & address</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">
                  Phone number{" "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    *
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="relative w-[88px] shrink-0">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => updateField("countryCode", e.target.value)}
                      className="w-full h-10 appearance-none rounded-lg border border-input bg-background pl-3 pr-7 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+61">+61</option>
                      <option value="+971">+971</option>
                      <option value="+65">+65</option>
                      <option value="+60">+60</option>
                      <option value="+49">+49</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value.replace(/\D/g, ""))}
                    required
                    placeholder=""
                    className="h-10 flex-1 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Address line 1</label>
                <Input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => updateField("address_line1", e.target.value)}
                  className="h-10 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">
                  Address line 2 <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => updateField("address_line2", e.target.value)}
                  className="h-10 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90">City</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90">State / province</label>
                  <Input
                    type="text"
                    value={formData.state_province}
                    onChange={(e) => updateField("state_province", e.target.value)}
                    className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90">ZIP / postal code</label>
                  <Input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => updateField("zip_code", e.target.value)}
                    className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/90">Country</label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 (if additional fields exist): Additional fields */}
            {planCustomFields.length > 0 && (
              <>
                <div className="my-6 border-t border-border" />

                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    3
                  </div>
                  <h2 className="text-sm font-bold text-foreground">Additional fields</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {planCustomFields.map((field) => (
                    <div key={field.label} className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/90">
                        {field.label}{" "}
                        {field.mandatory && (
                          <span className="font-semibold" style={{ color: primaryColor }}>
                            *
                          </span>
                        )}
                      </label>
                      {field.type === "dropdown" ? (
                        <div className="relative">
                          <select
                            value={customFieldValues[field.label] ?? ""}
                            onChange={(e) => updateCustomField(field.label, e.target.value)}
                            required={field.mandatory}
                            className="w-full h-10 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                          >
                            <option value="">{field.mandatory ? "Select" : "Optional"}</option>
                            {(field.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      ) : (
                        <Input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "date"
                              ? "date"
                              : field.type === "email"
                              ? "email"
                              : "text"
                          }
                          value={customFieldValues[field.label] ?? ""}
                          onChange={(e) => updateCustomField(field.label, e.target.value)}
                          required={field.mandatory}
                          className={cn(
                            "h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors",
                            field.type === "date" && "dark:[color-scheme:dark]"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="my-6 border-t border-border" />

            {/* Last Step: Identity & payment (Step 4 if additional fields exist, otherwise Step 3) */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {planCustomFields.length > 0 ? 4 : 3}
              </div>
              <h2 className="text-sm font-bold text-foreground">Identity & payment</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">ID proof type</label>
                <div className="relative">
                  <select
                    value={formData.id_proof_type}
                    onChange={(e) => updateField("id_proof_type", e.target.value)}
                    className="w-full h-10 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="Aadhar">Aadhaar</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN">PAN</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">ID proof number</label>
                <Input
                  type="text"
                  value={formData.id_proof_number}
                  onChange={(e) => updateField("id_proof_number", e.target.value)}
                  className="h-10 rounded-lg border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 transition-colors"
                />
              </div>
            </div>

            {/* Coupon Box */}
            <div className="rounded-xl border border-border p-4 mt-5 bg-muted/20 dark:bg-muted/10">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Coupon or promo code
              </label>
              {appliedCoupon ? (
                <div className="rounded-lg border border-border bg-card p-3.5 flex justify-between items-center shadow-xs">
                  <div>
                    <div className="font-bold text-sm text-foreground tracking-wide">
                      {appliedCoupon.name || appliedCoupon.code}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {appliedCoupon.code} · {isAutoAppliedCoupon ? "Auto-applied" : "Applied"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-10 rounded-lg uppercase border-input bg-background px-3 text-sm text-foreground focus-visible:ring-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleValidateCoupon()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{ backgroundColor: primaryColor, color: "#ffffff" }}
                    className="h-10 px-5 rounded-lg text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity"
                  >
                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Plan Summary Card */}
            <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/15 p-4 sm:p-5 mt-5 space-y-2.5">
              <div className="font-bold text-sm text-foreground">
                Selected plan —{" "}
                <span style={{ color: primaryColor }}>
                  {selectedPlan?.name || "Basic Member"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price</span>
                <span className={appliedCoupon ? "line-through opacity-70" : "text-foreground"}>
                  {formatPrice(originalCharge.finalAmount, selectedPlan?.currency || "INR")}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-medium">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−{formatPrice(discountAmount, selectedPlan?.currency || "INR")}</span>
                </div>
              )}
              <div className="border-t border-border my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-foreground">Total after discount</span>
                <span
                  className="font-bold text-base sm:text-lg"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(feeBreakdown.finalAmount, selectedPlan?.currency || "INR")}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-0.5">
                <span>Duration</span>
                <span className="text-foreground font-medium">
                  {formatPlanPeriod(selectedPlan)}
                </span>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex justify-end items-center gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-2.5 h-10 rounded-lg border-border bg-background text-foreground hover:bg-muted text-xs font-semibold shadow-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                style={{ backgroundColor: primaryColor, color: "#ffffff" }}
                className="px-6 py-2.5 h-10 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay & create account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSuccess={() => {
          checkAuth()
          setLoginModalOpen(false)
        }}
      />
    </div>
  )
}

export default function MembershipCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
