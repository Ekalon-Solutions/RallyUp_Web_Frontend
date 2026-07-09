"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CountryCodeSelect } from "@/components/country-code-select"
import {
  Award,
  Users,
  Info,
  Loader2,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { apiClient } from "@/lib/api"
import { calculateTransactionFees } from "@/lib/transactionFees"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { CheckoutClub, CheckoutPlan } from "./CheckoutLanding"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${currency} ${price}`
  }
}

function formatPlanPeriod(plan: CheckoutPlan): string {
  if (plan.planStartDate && plan.planEndDate) {
    const start = new Date(plan.planStartDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const end = new Date(plan.planEndDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${start} – ${end}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime"
  if (months === 1) return "1 Month"
  if (months === 3) return "3 Months"
  if (months === 6) return "6 Months"
  if (months === 12) return "1 Year"
  return `${months} Months`
}

type ReferralStatus =
  | "idle"
  | "checking"
  | "found"
  | "not-found"
  | "not-member"
  | "self"

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GuestRegistrationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  club: CheckoutClub
  planId: string
  plan?: CheckoutPlan
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuestRegistrationForm({
  open,
  onOpenChange,
  club,
  planId,
  plan: initialPlan,
}: GuestRegistrationFormProps) {
  const router = useRouter()

  const [plan, setPlan] = useState<CheckoutPlan | undefined>(initialPlan)
  const [planLoading, setPlanLoading] = useState(false)

  const [registrationData, setRegistrationData] = useState({
    ...EMPTY_REGISTRATION,
    name: "",
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationErrors, setRegistrationErrors] = useState({
    phoneNumber: "",
  })

  // referral state
  const [referralPhone, setReferralPhone] = useState("")
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle")
  const [referralName, setReferralName] = useState<string | null>(null)

  // payment state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string
    orderNumber: string
    total: number
    currency: string
    paymentMethod: string
  } | null>(null)
  const [pendingRegistrationData, setPendingRegistrationData] =
    useState<typeof registrationData | null>(null)
  const [pendingReferralPhone, setPendingReferralPhone] = useState<
    string | undefined
  >(undefined)

  // -----------------------------------------------------------------------
  // Reset form on open
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (open) {
      setRegistrationData({ ...EMPTY_REGISTRATION, name: "" })
      setReferralPhone("")
      setReferralStatus("idle")
      setReferralName(null)
      setRegistrationErrors({ phoneNumber: "" })
      setIsRegistering(false)
      setIsPaymentModalOpen(false)
      setPendingOrder(null)
      setPendingRegistrationData(null)
      setPendingReferralPhone(undefined)
      if (!initialPlan) {
        setPlan(undefined)
        setPlanLoading(true)
        apiClient.getMembershipPlanById(planId).then((res) => {
          if (res.success && res.data) {
            const d = res.data as any
            setPlan({
              _id: d._id,
              name: d.name,
              description: d.description || "",
              price: d.price,
              currency: d.currency || 'INR',
              isActive: d.isActive,
              duration: d.duration,
              planStartDate: d.planStartDate,
              planEndDate: d.planEndDate,
              referralReward: d.referralReward,
            })
          }
        }).catch(() => {
          // silent — will show planId-based summary
        }).finally(() => setPlanLoading(false))
      }
    }
  }, [open, initialPlan, planId])

  // -----------------------------------------------------------------------
  // Referral phone lookup
  // -----------------------------------------------------------------------

  useEffect(() => {
    const digits = referralPhone.replace(/\D/g, "")
    if (digits.length !== 10 || !club._id) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }

    const refereeDigits = registrationData.phoneNumber.replace(/\D/g, "")
    const timer = setTimeout(async () => {
      setReferralStatus("checking")
      try {
        const res = await apiClient.checkReferralPhone(digits, {
          clubId: club._id,
          refereePhone:
            refereeDigits.length >= 9 ? refereeDigits : undefined,
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

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralPhone, club._id, registrationData.phoneNumber])

  const getValidReferralPhone = (): string | undefined => {
    if (referralStatus !== "found") return undefined
    const digits = referralPhone.replace(/\D/g, "")
    return digits.length === 10 ? digits : undefined
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return ""
    const phoneRegex = /^\d{9,15}$/
    if (!phoneRegex.test(phone)) return "Phone number must be 9-15 digits"
    return ""
  }

  // -----------------------------------------------------------------------
  // Registration handler
  // -----------------------------------------------------------------------

  const resolvePlan = useCallback(async (): Promise<CheckoutPlan> => {
    if (plan) return plan
    if (planLoading) throw new Error("Plan details are loading, please wait.")
    try {
      setPlanLoading(true)
      const res = await apiClient.getMembershipPlanById(planId)
      if (res.success && res.data) {
        const d = res.data as any
        const p: CheckoutPlan = {
          _id: d._id,
          name: d.name,
          description: d.description || "",
          price: d.price,
          currency: d.currency || 'INR',
          isActive: d.isActive,
          duration: d.duration,
          planStartDate: d.planStartDate,
          planEndDate: d.planEndDate,
          referralReward: d.referralReward,
        }
        setPlan(p)
        return p
      }
      throw new Error("Could not fetch plan details.")
    } finally {
      setPlanLoading(false)
    }
  }, [plan, planLoading, planId])

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    const phoneError = validatePhoneNumber(registrationData.phoneNumber)
    setRegistrationErrors({ phoneNumber: phoneError })
    if (phoneError) {
      toast.error(phoneError)
      return
    }

    setIsRegistering(true)
    try {
      const resolvedPlan = await resolvePlan()

      if (resolvedPlan.price > 0) {
        // ---- Paid plan: check existing, then open payment modal ----
        const checkResponse = await fetch(
          getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: registrationData.email,
              phoneNumber: registrationData.phoneNumber,
              countryCode: registrationData.countryCode || "+91",
              clubId: club._id,
              membershipPlanId: resolvedPlan._id,
            }),
          }
        )
        const checkData = await checkResponse.json()
        if (checkResponse.ok && checkData.planValid) {
          toast.info(
            "An account with this email or phone already exists. Please log in."
          )
          onOpenChange(false)
          return
        }

        const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
        const orderId = `club-${Date.now()}`
        const total = resolvedPlan.price
        const currency = resolvedPlan.currency || "INR"
        const paymentMethod = "all"

        setPendingRegistrationData({ ...registrationData })
        setPendingReferralPhone(getValidReferralPhone())
        setPendingOrder({ orderId, orderNumber, total, currency, paymentMethod })
        setIsPaymentModalOpen(true)
        toast.info("Complete payment to create your account and activate membership.")
      } else {
        // ---- Free plan: register directly ----
        const registerResponse = await fetch(
          getApiUrl(API_ENDPOINTS.users.register),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...registrationData }),
          }
        )
        const registerData = await registerResponse.json()

        if (registerResponse.ok) {
          if (registerData.token) {
            localStorage.setItem("token", registerData.token)
            localStorage.setItem("userType", "member")

            const subscribeRes = await apiClient.subscribeMembershipPlan(
              resolvedPlan._id,
              undefined,
              getValidReferralPhone()
            )

            if (subscribeRes.success) {
              toast.success("Successfully joined the club!")
              onOpenChange(false)
              router.refresh()
            } else {
              toast.error(
                subscribeRes.error ||
                  subscribeRes.message ||
                  "Failed to join club after registration"
              )
            }
          } else {
            toast.error("Registration token missing")
          }
        } else {
          handleRegistrationError(registerData, registerResponse)
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An error occurred during registration")
    } finally {
      setIsRegistering(false)
    }
  }

  // -----------------------------------------------------------------------
  // Registration error handler (duplicated from clubs page pattern)
  // -----------------------------------------------------------------------

  const handleRegistrationError = async (
    registerData: any,
    registerResponse: Response
  ) => {
    const isExistingEmail =
      registerData.message === "Email already exists"
    const isExistingPhone =
      registerData.message ===
      "A user with this phone number and country code already exists"

    if (isExistingEmail || isExistingPhone) {
      const checkResponse = await fetch(
        getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registrationData.email,
            phoneNumber: registrationData.phoneNumber,
            countryCode: registrationData.countryCode || "+91",
            clubId: club._id,
            membershipPlanId: planId,
          }),
        }
      )
      const checkData = await checkResponse.json()
      if (checkResponse.ok && checkData.planValid) {
        toast.info(
          "An account with this email or phone already exists. Please log in."
        )
        onOpenChange(false)
      } else {
        toast.error(
          checkData.message ||
            "This membership plan is no longer available for this club."
        )
      }
    } else {
      toast.error(registerData.message || "Registration failed")
    }
  }

  // -----------------------------------------------------------------------
  // Payment success handler
  // -----------------------------------------------------------------------

  const handlePaymentSuccess = async (
    orderId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    if (!pendingRegistrationData) {
      toast.error("Registration data missing. Please try again.")
      return
    }

    setIsRegistering(true)
    try {
      const registerResponse = await fetch(
        getApiUrl(API_ENDPOINTS.users.register),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingRegistrationData }),
        }
      )
      const registerData = await registerResponse.json()

      if (!registerResponse.ok || !registerData.token) {
        toast.error(
          registerData.message ||
            "Payment succeeded, but account creation failed. Please contact support."
        )
        return
      }

      localStorage.setItem("token", registerData.token)
      localStorage.setItem("userType", "member")

      const subscribeRes = await apiClient.subscribeMembershipPlan(
        planId,
        {
          razorpay_payment_id: paymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
        },
        pendingReferralPhone
      )

      if (subscribeRes.success) {
        toast.success("Payment successful — membership activated.")
        setIsPaymentModalOpen(false)
        setPendingOrder(null)
        setPendingRegistrationData(null)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(
          subscribeRes.error ||
            subscribeRes.message ||
            "Failed to activate membership after payment."
        )
      }
    } catch (error) {
      toast.error("An error occurred while finalizing membership after payment.")
    } finally {
      setIsRegistering(false)
      setIsPaymentModalOpen(false)
      setPendingOrder(null)
      setPendingRegistrationData(null)
      setPendingReferralPhone(undefined)
    }
  }

  const handlePaymentFailure = () => {
    toast.error(
      "Payment failed or verification failed. Please try again or contact support."
    )
    setIsPaymentModalOpen(false)
    setPendingOrder(null)
    setPendingRegistrationData(null)
    setPendingReferralPhone(undefined)
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              {plan?.price
                ? `Register & Pay — Join ${club.name}`
                : `Register & Join — ${club.name}`}
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {planLoading ? (
                <span className="block text-muted-foreground">
                  Loading plan details…
                </span>
              ) : plan?.price ? (
                <>
                  <span className="block font-medium">
                    Step 1: Fill your details
                  </span>
                  <span className="block text-muted-foreground">
                    We collect your registration details.
                  </span>
                  <span className="block font-medium mt-2">Step 2: Pay</span>
                  <span className="block text-muted-foreground">
                    After Razorpay success, we create your account and activate
                    the {plan.name} membership.
                  </span>
                </>
              ) : (
                <>
                  <span className="block font-medium">Step 1: Register</span>
                  <span className="block text-muted-foreground">
                    {plan
                      ? `We create your account first, then you join the club with the ${plan.name} plan (free).`
                      : "We create your account and activate the membership."}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={registrationData.username}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        username: e.target.value,
                      })
                    }
                    required
                    className="h-12"
                  />
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={registrationData.first_name}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        first_name: e.target.value,
                      })
                    }
                    required
                    className="h-12"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={registrationData.last_name}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        last_name: e.target.value,
                      })
                    }
                    required
                    className="h-12"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={registrationData.date_of_birth}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        date_of_birth: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={registrationData.gender}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full h-12 rounded-md border px-3"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registrationData.email}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        email: e.target.value,
                      })
                    }
                    required
                    className="h-12"
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-2 grid grid-cols-[7rem_1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <CountryCodeSelect
                      id="countryCode"
                      value={registrationData.countryCode}
                      onValueChange={(value) =>
                        setRegistrationData({
                          ...registrationData,
                          countryCode: value,
                        })
                      }
                      className="h-12 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={registrationData.phoneNumber}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          phoneNumber: e.target.value,
                        })
                      }
                      required
                      className="h-12 w-full"
                    />
                    {registrationErrors.phoneNumber && (
                      <p className="text-destructive text-sm mt-1">
                        {registrationErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={registrationData.address_line1}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        address_line1: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={registrationData.address_line2}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        address_line2: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={registrationData.city}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        city: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state_province">State / Province</Label>
                  <Input
                    id="state_province"
                    value={registrationData.state_province}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        state_province: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                  <Input
                    id="zip_code"
                    value={registrationData.zip_code}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        zip_code: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={registrationData.country}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        country: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>

                {/* ID Proof */}
                <div className="space-y-2">
                  <Label htmlFor="id_proof_type">ID Proof Type</Label>
                  <select
                    id="id_proof_type"
                    value={registrationData.id_proof_type}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        id_proof_type: e.target.value,
                      })
                    }
                    className="w-full h-12 rounded-md border px-3"
                  >
                    <option value="Aadhar">Aadhar</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver License</option>
                    <option value="PAN">PAN Card</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_proof_number">ID Proof Number</Label>
                  <Input
                    id="id_proof_number"
                    value={registrationData.id_proof_number}
                    onChange={(e) =>
                      setRegistrationData({
                        ...registrationData,
                        id_proof_number: e.target.value,
                      })
                    }
                    className="h-12"
                  />
                </div>
              </div>

              {plan?.referralReward?.enabled && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="referralPhone"
                    className="text-sm font-medium"
                  >
                    Referral Mobile Number
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Enter the registered mobile number of the member who
                        referred you to earn them points!
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-xs text-muted-foreground">
                    (Optional)
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="referralPhone"
                    type="tel"
                    placeholder="10-digit mobile number of referring member"
                    value={referralPhone}
                    onChange={(e) =>
                      setReferralPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    className={cn(
                      "h-12 pr-10",
                      referralStatus === "found" && "border-green-500",
                      (referralStatus === "not-found" ||
                        referralStatus === "not-member" ||
                        referralStatus === "self") &&
                        "border-amber-400"
                    )}
                    maxLength={10}
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {referralStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {referralStatus === "found" && (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                    {(referralStatus === "not-found" ||
                      referralStatus === "not-member" ||
                      referralStatus === "self") && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
                {referralStatus === "found" && referralName && (
                  <p className="text-xs font-medium text-green-600">
                    {referralName}
                  </p>
                )}
                {referralStatus === "found" && !referralName && (
                  <p className="text-xs font-medium text-green-600">
                    Referral confirmed — your referrer will earn points when you
                    join.
                  </p>
                )}
                {referralStatus === "not-found" && (
                  <p className="text-xs text-amber-600">
                    Member not found. Please check the number to ensure your
                    friend gets their points.
                  </p>
                )}
                {referralStatus === "not-member" && (
                  <p className="text-xs text-amber-600">
                    {referralName
                      ? `${referralName} is registered but not an active member of ${club.name}.`
                      : "This number is not an active member of this club."}
                  </p>
                )}
                {referralStatus === "self" && (
                  <p className="text-xs font-medium text-destructive">
                    You cannot refer yourself.
                  </p>
                )}
              </div>
              )}

              {/* Plan Summary */}
              <div className="rounded-lg border-2 border-primary/30 bg-muted/70 p-4 shadow-sm dark:bg-muted/40">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Award className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Selected Plan:{" "}
                    <span className="text-primary">
                      {plan?.name ?? planId}
                    </span>
                  </span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold text-primary">
                      {plan
                        ? formatPrice(plan.price, plan.currency)
                        : planLoading
                          ? "Loading…"
                          : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium text-foreground">
                      {plan
                        ? formatPlanPeriod(plan)
                        : planLoading
                          ? "Loading…"
                          : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isRegistering || planLoading}
                className="w-full bg-primary hover:from-blue-700 hover:to-purple-700"
              >
                {planLoading
                  ? "Loading plan…"
                  : isRegistering
                    ? plan?.price
                      ? "Registering, then Pay…"
                      : "Registering…"
                    : plan?.price
                      ? "Pay & Create Account"
                      : "Register & Join"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {pendingOrder &&
        (() => {
          const feeBreakdown =
            pendingOrder.total > 0
              ? calculateTransactionFees(pendingOrder.total)
              : null
          const amountToCharge = feeBreakdown
            ? feeBreakdown.finalAmount
            : pendingOrder.total
          return (
            <PaymentSimulationModal
              isOpen={isPaymentModalOpen}
              onClose={() => {
                setIsPaymentModalOpen(false)
                setPendingOrder(null)
                setPendingRegistrationData(null)
                setPendingReferralPhone(undefined)
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              orderId={pendingOrder.orderId}
              orderNumber={pendingOrder.orderNumber}
              total={amountToCharge}
              subtotal={pendingOrder.total}
              currency={pendingOrder.currency}
              paymentMethod={pendingOrder.paymentMethod}
              platformFeeTotal={
                feeBreakdown
                  ? feeBreakdown.platformFee + feeBreakdown.platformFeeGst
                  : undefined
              }
              razorpayFeeTotal={
                feeBreakdown
                  ? feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst
                  : undefined
              }
              dialogTitle="Pay Now — Complete Your Membership"
              dialogDescription="You're registered. Complete payment to activate your membership."
              payButtonLabel={`Pay ${formatPrice(
                amountToCharge,
                pendingOrder.currency
              )} Now`}
            />
          )
        })()}
    </>
  )
}
