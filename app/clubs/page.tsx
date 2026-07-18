"use client"

import React, { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryCodeSelect } from "@/components/country-code-select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Users,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  Tag,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  Star,
  Eye,
  Clock,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Users2,
  CalendarDays,
  CalendarClock,
  Newspaper,
  ExternalLink,
  Loader2,
  AlertTriangle,
  UserCheck,
  Info
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { calculateTransactionFees } from "@/lib/transactionFees"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Club {
  _id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  contactEmail: string
  contactPhone: string
  dev: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  status: 'active' | 'inactive' | 'suspended'
  membershipPlans: MembershipPlan[]
  memberInfo?: {
    currentCount: number
    maxLimit: number | null
    isLimitReached: boolean
  }
}

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
  bookingStartDate?: string
  bookingEndDate?: string
  features: {
    maxEvents: number
    maxNews: number
    maxMembers: number
    customBranding: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
    apiAccess: boolean
    customIntegrations: boolean
  }
  isActive: boolean
  referralReward?: { enabled: boolean; points: number }
}

type ReferralStatus = "idle" | "checking" | "found" | "not-found" | "not-member" | "self"

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
  name: ""
}

function ClubsPageContent() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)
  const [showClubDetails, setShowClubDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [registrationData, setRegistrationData] = useState({ ...EMPTY_REGISTRATION })
  const [referralPhone, setReferralPhone] = useState("")
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle")
  const [referralName, setReferralName] = useState<string | null>(null)
  const [pendingReferralPhone, setPendingReferralPhone] = useState<string | undefined>(undefined)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationErrors, setRegistrationErrors] = useState({ phoneNumber: "" })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string
    orderNumber: string
    total: number
    currency: string
    paymentMethod: string
  } | null>(null)
  const [pendingRegistrationData, setPendingRegistrationData] = useState<typeof registrationData | null>(null)
  const [userMemberships, setUserMemberships] = useState<Record<string, string>>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialSearch = searchParams?.get?.('search') || ''
    if (initialSearch) setSearchTerm(initialSearch)

    fetchClubs()
    fetchUserMemberships()
  }, [])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    let pending: { clubId: string; membershipPlanId: string } | null = null
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("clubs_pending_join") : null
      if (raw) pending = JSON.parse(raw) as { clubId: string; membershipPlanId: string }
    } catch (_) { }
    if (!token || !pending) return

    sessionStorage.removeItem("clubs_pending_join")
    const clubId = pending.clubId
    const membershipPlanId = pending.membershipPlanId

    const completePendingJoin = async () => {
      try {
        const res = await fetch(getApiUrl(API_ENDPOINTS.users.joinClubRequest), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clubId, membershipPlanId }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success("Successfully joined the club!")
          fetchClubs()
          router.push("/dashboard/user/my-clubs")
        } else {
          toast.error(data.message || "Failed to join club.")
        }
      } catch (_) {
        toast.error("Failed to complete club join.")
      }
    }
    completePendingJoin()
  }, [router])

  useEffect(() => {
    filterClubs()
  }, [clubs, searchTerm, statusFilter, priceFilter])

  useEffect(() => {
    const digits = referralPhone.replace(/\D/g, "")
    if (digits.length !== 10 || !selectedClub?._id) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }

    const refereeDigits = registrationData.phoneNumber.replace(/\D/g, "")
    const timer = setTimeout(async () => {
      setReferralStatus("checking")
      try {
        const res = await apiClient.checkReferralPhone(digits, {
          clubId: selectedClub._id,
          refereePhone: refereeDigits.length >= 9 ? refereeDigits : undefined,
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
  }, [referralPhone, selectedClub?._id, registrationData.phoneNumber])

  const resetReferralState = () => {
    setReferralPhone("")
    setReferralStatus("idle")
    setReferralName(null)
    setPendingReferralPhone(undefined)
  }

  const getValidReferralPhone = (): string | undefined => {
    if (referralStatus !== "found") return undefined
    const digits = referralPhone.replace(/\D/g, "")
    return digits.length === 10 ? digits : undefined
  }

  const resetRegistrationForm = () => {
    setRegistrationData({ ...EMPTY_REGISTRATION })
    resetReferralState()
  }

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(API_ENDPOINTS.clubs.public))
      const data = await response.json()

      if (response.ok) {
        setClubs((data.clubs || []) as unknown as Club[])
      } else {
        toast.error("Failed to load clubs")
      }
    } catch (error) {
      toast.error("Error loading clubs")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserMemberships = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(getApiUrl(API_ENDPOINTS.users.profile), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const membershipMap: Record<string, string> = {}
        for (const m of data.user?.memberships || []) {
          const clubId = m.club_id?._id || m.club_id
          if (clubId && m.start_date) {
            const existing = membershipMap[clubId]
            if (!existing || new Date(m.start_date).getTime() > new Date(existing).getTime()) {
              membershipMap[clubId] = m.start_date
            }
          }
        }
        setUserMemberships(membershipMap)
      }
    } catch (error) {
    }
  }

  const isClubJoined = (clubId: string) => {
    return Object.prototype.hasOwnProperty.call(userMemberships, clubId)
  }

  const getLastPurchaseDate = (clubId: string): string | undefined => {
    return userMemberships[clubId]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  const filterClubs = () => {
    let filtered = clubs.filter(club => club.dev !== 'true')

    if (searchTerm) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.address?.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(club => club.status === statusFilter)
    }
    if (priceFilter !== "all") {
      filtered = filtered.filter(club => {
        const plans = club.membershipPlans?.filter(plan => plan.isActive) || []
        if (priceFilter === "free") {
          return plans.some(plan => plan.price === 0)
        } else if (priceFilter === "paid") {
          return plans.some(plan => plan.price > 0)
        }
        return true
      })
    }

    setFilteredClubs(filtered)
  }

  const handleJoinClub = (club: Club, plan: MembershipPlan) => {
    const now = Date.now()
    const bookingStartMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
    const bookingEndMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
    if (bookingStartMs && now < bookingStartMs) {
      toast.error("Membership sales are not open yet for this plan")
      return
    }
    if (bookingEndMs && now > bookingEndMs) {
      toast.error("Membership Closed. Contact Club Admin")
      return
    }
    setSelectedClub(club)
    setSelectedPlan(plan)
    resetReferralState()
    setShowRegistrationDialog(true)
  }

  const handleViewClubDetails = (club: Club) => {
    setSelectedClub(club)
    setShowClubDetails(true)
  }

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return ""
    const phoneRegex = /^\d{9,15}$/
    if (!phoneRegex.test(phone)) {
      return "Phone number must be 9-15 digits"
    }
    return ""
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub || !selectedPlan) return
    const phoneError = validatePhoneNumber(registrationData.phoneNumber)
    setRegistrationErrors({ phoneNumber: phoneError })
    if (phoneError) {
      toast.error(phoneError)
      return
    }

    setIsRegistering(true)
    try {
      if (selectedPlan && selectedPlan.price > 0) {
        const checkResponse = await fetch(getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registrationData.email,
            phoneNumber: registrationData.phoneNumber,
            countryCode: registrationData.countryCode || "+91",
            clubId: selectedClub._id,
            membershipPlanId: selectedPlan._id,
          }),
        })
        const checkData = await checkResponse.json()
        if (checkResponse.ok && checkData.planValid) {
          toast.info("An account with this email or phone already exists. Please log in to join this club.")
          try {
            sessionStorage.setItem(
              "clubs_pending_join",
              JSON.stringify({ clubId: selectedClub._id, membershipPlanId: selectedPlan._id })
            )
          } catch (_) { }
          router.push("/login?redirect=/clubs")
          return
        }

        const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
        const orderId = `club-${Date.now()}`
        const total = selectedPlan.price
        const currency = selectedPlan.currency || 'INR'
        const paymentMethod = 'all'

        setPendingRegistrationData({ ...registrationData })
        setPendingReferralPhone(getValidReferralPhone())
        setPendingOrder({ orderId, orderNumber, total, currency, paymentMethod })
        setIsPaymentModalOpen(true)
        toast.info("Complete payment to create your account and activate membership.")
      } else {
        const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...registrationData,
          }),
        })

        const registerData = await registerResponse.json()

        if (registerResponse.ok) {
          if (registerData.token) {
            localStorage.setItem('token', registerData.token)
            localStorage.setItem('userType', 'member')

            const subscribeRes = await apiClient.subscribeMembershipPlan(
              selectedPlan._id,
              undefined,
              getValidReferralPhone()
            )

            if (subscribeRes.success) {
              toast.success("Successfully joined the club!")
              setShowRegistrationDialog(false)
              resetRegistrationForm()
              fetchClubs()
              router.push("/dashboard/user/my-clubs")
            } else {
              toast.error(subscribeRes.error || subscribeRes.message || "Failed to join club after registration")
            }
          } else {
            toast.error("Registration token missing")
          }
        }
        else {
          const isExistingEmail = registerData.message === "Email already exists"
          const isExistingPhone = registerData.message === "A user with this phone number and country code already exists"
          if (isExistingEmail || isExistingPhone) {
            const checkResponse = await fetch(getApiUrl(API_ENDPOINTS.users.checkExistingUserPlan), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: registrationData.email,
                phoneNumber: registrationData.phoneNumber,
                countryCode: registrationData.countryCode || "+91",
                clubId: selectedClub._id,
                membershipPlanId: selectedPlan._id,
              }),
            })
            const checkData = await checkResponse.json()
            if (checkResponse.ok && checkData.planValid) {
              toast.info("An account with this email or phone already exists. Please log in to join this club.")
              try {
                sessionStorage.setItem(
                  "clubs_pending_join",
                  JSON.stringify({ clubId: selectedClub._id, membershipPlanId: selectedPlan._id })
                )
              } catch (_) { }
              router.push("/login?redirect=/clubs")
            } else {
              toast.error(checkData.message || "This membership plan is no longer available for this club.")
            }
          } else {
            toast.error(registerData.message || "Registration failed")
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An error occurred during registration")
    } finally {
      setIsRegistering(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const getPlanSalesState = (plan: MembershipPlan) => {
    const now = Date.now()
    const bookingStartMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
    const bookingEndMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
    const notStarted = Boolean(bookingStartMs && now < bookingStartMs)
    const closed = Boolean(bookingEndMs && now > bookingEndMs)
    return { isOpen: !notStarted && !closed, closed, notStarted }
  }

  const formatPlanPeriod = (plan: MembershipPlan) => {
    if (plan.planStartDate && plan.planEndDate) {
      const start = new Date(plan.planStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      const end = new Date(plan.planEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/30'
      case 'inactive': return 'bg-secondary/30 text-secondary border-border'
      case 'suspended': return 'bg-primary/10 text-primary border-primary/30'
      default: return 'bg-secondary/30 text-secondary border-border'
    }
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'events': return <CalendarDays className="w-4 h-4" />
      case 'news': return <Newspaper className="w-4 h-4" />
      case 'members': return <Users2 className="w-4 h-4" />
      case 'analytics': return <TrendingUp className="w-4 h-4" />
      case 'support': return <Shield className="w-4 h-4" />
      case 'api': return <Zap className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const handlePaymentSuccess = async (
    orderId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    if (!selectedClub || !selectedPlan) return
    if (!pendingRegistrationData) {
      toast.error("Registration data missing. Please try again.")
      return
    }
    setIsRegistering(true)
    try {
      const registerResponse = await fetch(getApiUrl(API_ENDPOINTS.users.register), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pendingRegistrationData,
        }),
      })
      const registerData = await registerResponse.json()

      if (!registerResponse.ok || !registerData.token) {
        toast.error(registerData.message || "Payment succeeded, but account creation failed. Please contact support.")
        return
      }

      localStorage.setItem('token', registerData.token)
      localStorage.setItem('userType', 'member')

      const subscribeRes = await apiClient.subscribeMembershipPlan(
        selectedPlan._id,
        {
          razorpay_payment_id: paymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
        },
        pendingReferralPhone
      )

      if (subscribeRes.success) {
        toast.success("Payment successful — membership activated.")
        setShowRegistrationDialog(false)
        setIsPaymentModalOpen(false)
        setPendingOrder(null)
        setPendingRegistrationData(null)
        resetRegistrationForm()
        fetchClubs()
        router.push("/dashboard/user/my-clubs")
      } else {
        toast.error(subscribeRes.error || subscribeRes.message || "Failed to activate membership after payment.")
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
    toast.error('Payment failed or verification failed. Please try again or contact support.')
    setIsPaymentModalOpen(false)
    setPendingOrder(null)
    setPendingRegistrationData(null)
    setPendingReferralPhone(undefined)
  }

  return (
    <div className="min-h-screen bg-white public-theme">
      <SiteNavbar brandName="Wingman Pro" />
      <div className="relative overflow-hidden bg-primary py-24 md:py-32">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center text-white space-y-8 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-black leading-none text-white drop-shadow-sm">
              Join the Community
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-medium leading-relaxed">
              Discover and join supporter clubs to connect with fellow fans, attend exclusive events, and be part of something special.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 mb-12 border-2 border-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-6 h-6 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search clubs by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 rounded-2xl focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-14 border-2 rounded-2xl font-bold">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full sm:w-44 h-14 border-2 rounded-2xl font-bold">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border-2 rounded-2xl overflow-hidden p-1 bg-muted/30">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn("h-11 w-11 rounded-xl transition-all", viewMode === "grid" ? "shadow-md" : "")}
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn("h-11 w-11 rounded-xl transition-all", viewMode === "list" ? "shadow-md" : "")}
                >
                  <div className="flex flex-col gap-1 w-4 h-4">
                    <div className="bg-current rounded-[1px] h-1 w-full"></div>
                    <div className="bg-current rounded-[1px] h-1 w-full"></div>
                    <div className="bg-current rounded-[1px] h-1 w-full"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Showing {filteredClubs.length} of {clubs.length} clubs
            </div>
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="font-bold text-primary hover:text-primary">
                Clear search
              </Button>
            )}
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {filteredClubs.map((club) => (
              <Card key={club._id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 rounded-[2.5rem] shadow-xl flex flex-col">
                <div className="bg-primary p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3.5 shadow-inner ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <Badge className="border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-bold capitalize tracking-wider text-white backdrop-blur-sm">
                        {club.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 rounded-xl"
                      onClick={() => handleViewClubDetails(club)}
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight mb-3 relative z-10 group-hover:translate-x-1 transition-transform">{club.name}</h3>

                  {club.description && (
                    <p className="relative z-10 line-clamp-2 text-sm font-medium text-white/90">
                      {club.description}
                    </p>
                  )}
                </div>

                <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="grid gap-3">
                    {club.address && (
                      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{club.address.city}, {club.address.state}</span>
                      </div>
                    )}

                    {club.website && (
                      <div className="flex items-center gap-3 text-sm font-bold text-primary">
                        <Globe className="w-5 h-5" />
                        <a
                          href={club.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          Official Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mt-auto">
                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Membership Plans
                    </h4>
                    <div className="space-y-3">
                      {club.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed).slice(0, 2).map((plan) => {
                        const isJoined = isClubJoined(club._id)
                        const isLimitReached = club.memberInfo?.isLimitReached || false
                        const salesState = getPlanSalesState(plan)
                        const isDisabled = isJoined || isLimitReached || !salesState.isOpen
                        return (
                          <div key={plan._id} className={cn(
                            "border-2 rounded-2xl p-4 transition-all duration-300",
                            isJoined ? "border-primary bg-primary/10 shadow-sm" : isLimitReached ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" : "border-border hover:border-primary hover:bg-secondary-purple/50"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-black text-sm flex items-center gap-2">
                                {plan.name}
                                {isJoined && (
                                  <Badge className="bg-primary text-white border-0 text-[9px] h-4">
                                    Joined
                                  </Badge>
                                )}
                                {isLimitReached && !isJoined && (
                                  <Badge className="bg-primary text-white border-0 text-[9px] h-4">
                                    Full
                                  </Badge>
                                )}
                                {!salesState.isOpen && !isJoined && !isLimitReached && (
                                  <Badge className="bg-secondary text-secondary border-0 text-[9px] h-4">
                                    {salesState.closed ? "Membership Closed" : "Unavailable"}
                                  </Badge>
                                )}
                              </h5>
                              <span className="text-lg font-black text-primary">
                                {formatPrice(calculateTransactionFees(plan.price).finalAmount, plan.currency)}
                              </span>
                            </div>
                            {isJoined && getLastPurchaseDate(club._id) && (
                              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-primary">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Last membership purchase: {formatDate(getLastPurchaseDate(club._id))}</span>
                              </div>
                            )}
                            {isLimitReached && !isJoined && club.memberInfo && (
                              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/40">
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
                                  Maximum member limit reached ({club.memberInfo.currentCount}/{club.memberInfo.maxLimit})
                                </p>
                              </div>
                            )}
                            {!salesState.isOpen && !isJoined && !isLimitReached && (
                              <div className="mb-3 rounded-lg border border-border bg-muted p-2">
                                <p className="text-xs font-bold text-foreground">
                                  {salesState.closed ? "Membership Closed" : "Membership sales not started yet"}
                                </p>
                              </div>
                            )}
                            <div className="space-y-1.5 mt-4">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-muted-foreground/70">Member time:</span>
                                <span>{formatPlanPeriod(plan)}</span>
                              </div>
                              {plan.bookingStartDate && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-muted-foreground/70">Book from:</span>
                                  <span className="font-semibold">{formatDate(plan.bookingStartDate)}</span>
                                </div>
                              )}
                              {plan.bookingEndDate && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-muted-foreground/70">Book until:</span>
                                  <span className="font-semibold">{formatDate(plan.bookingEndDate)}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleJoinClub(club, plan)}
                              disabled={isDisabled}
                              className={cn(
                                "w-full mt-3 h-9 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95",
                                isJoined ? "bg-muted text-muted-foreground cursor-not-allowed" : isLimitReached ? "bg-secondary/30 text-secondary cursor-not-allowed" : "bg-primary text-white"
                              )}
                            >
                              {isJoined ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Already Joined
                                </>
                              ) : isLimitReached ? (
                                "Club Full"
                              ) : !salesState.isOpen ? (
                                salesState.closed ? "Membership Closed" : "Unavailable"
                              ) : (
                                <>Join <ArrowRight className="w-3 h-3 ml-1.5" /></>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {club.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed).length > 2 && (
                      <Button variant="ghost" size="sm" className="w-full font-bold text-muted-foreground hover:text-primary hover:bg-primary rounded-xl" onClick={() => handleViewClubDetails(club)}>
                        + {club.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed).length - 2} more plans
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {filteredClubs.map((club) => (
              <Card key={club._id} className="group hover:shadow-xl transition-all duration-300 border-2 rounded-[2rem] overflow-hidden shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-start gap-6 flex-1">
                      <div className="bg-primary rounded-[1.5rem] p-5 shadow-lg group-hover:scale-105 transition-transform duration-500 ring-4 ring-primary/20">
                        <Building2 className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <h3 className="text-3xl font-black tracking-tight">{club.name}</h3>
                          <Badge className={cn("px-3 py-1 text-[10px] font-bold capitalize tracking-wider", getStatusColor(club.status))}>
                            {club.status}
                          </Badge>
                        </div>

                        {club.description && (
                          <p className="text-muted-foreground text-lg leading-relaxed line-clamp-2 max-w-2xl font-medium">
                            {club.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-bold text-muted-foreground">
                          {club.address && (
                            <div className="flex items-center gap-2.5">
                              <MapPin className="w-5 h-5 text-primary" />
                              <span>{club.address.city}, {club.address.state}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2.5">
                            <Users className="w-5 h-5 text-primary" />
                            <span>{club.membershipPlans?.filter(plan => plan.isActive).length || 0} active plans</span>
                          </div>

                          {club.website && (
                            <a
                              href={club.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 text-primary hover:underline"
                            >
                              <Globe className="w-5 h-5" />
                              <span>Official Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 md:w-full h-14 border-2 rounded-2xl font-bold shadow-sm"
                        onClick={() => handleViewClubDetails(club)}
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View Details
                      </Button>

                      {club.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed).length > 0 && (() => {
                        const isJoined = isClubJoined(club._id)
                        const isLimitReached = club.memberInfo?.isLimitReached || false
                        const firstPlan = club.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed)[0]!
                        const salesState = getPlanSalesState(firstPlan)
                        const isDisabled = isJoined || isLimitReached || !salesState.isOpen
                        return (
                          <>
                            {isJoined && getLastPurchaseDate(club._id) && (
                              <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold text-primary">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Last membership purchase: {formatDate(getLastPurchaseDate(club._id))}</span>
                              </div>
                            )}
                            {isLimitReached && !isJoined && club.memberInfo && (
                              <div className="mb-2 p-2 bg-primary rounded-lg">
                                <p className="text-xs font-bold text-primary text-center">
                                  Maximum member limit reached ({club.memberInfo.currentCount}/{club.memberInfo.maxLimit})
                                </p>
                              </div>
                            )}
                            <Button
                              size="lg"
                              onClick={() => handleJoinClub(club, firstPlan)}
                              disabled={isDisabled}
                              className={cn(
                                "flex-1 md:w-full h-14 rounded-2xl font-black shadow-xl transition-all active:scale-95",
                                isJoined ? "bg-muted text-muted-foreground cursor-not-allowed" : isLimitReached ? "bg-secondary/30 text-secondary cursor-not-allowed" : "bg-primary text-white"
                              )}
                            >
                              {isJoined ? (
                                <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Already Joined
                                </>
                              ) : isLimitReached ? (
                                "Club Full"
                              ) : !salesState.isOpen ? (
                                salesState.closed ? "Membership Closed" : "Unavailable"
                              ) : (
                                'Join Now'
                              )}
                            </Button>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredClubs.length === 0 && (
          <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-border animate-scale-in">
            <div className="bg-white rounded-[2rem] p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-border/20">
              <Building2 className="w-16 h-16 text-secondary" />
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-4">No clubs found</h3>
            <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto font-medium">
              We couldn't find any clubs matching your criteria. Try adjusting your search or clearing the filters.
            </p>
            <Button size="lg" className="h-14 px-10 rounded-2xl font-black shadow-xl" onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setPriceFilter("all")
            }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showClubDetails} onOpenChange={setShowClubDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClub && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="bg-primary rounded-lg p-2">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedClub.name}</div>
                    <Badge className={cn("mt-2 capitalize", getStatusColor(selectedClub.status))}>
                      {selectedClub.status}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-lg">
                  {selectedClub.description}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="plans" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger className="whitespace-normal" value="plans">Membership Plans</TabsTrigger>
                  <TabsTrigger value="info">Club Info</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedClub.membershipPlans?.filter(plan => plan.isActive && !getPlanSalesState(plan).closed).map((plan) => {
                      const isJoined = isClubJoined(selectedClub._id)
                      const isLimitReached = selectedClub.memberInfo?.isLimitReached || false
                      const salesState = getPlanSalesState(plan)
                      const isDisabled = isJoined || isLimitReached || !salesState.isOpen
                      return (
                        <Card key={plan._id} className={cn(
                          "border-2 transition-colors",
                          isJoined ? "border-primary bg-primary/10" : isLimitReached ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" : "hover:border-primary"
                        )}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {plan.name}
                                {isJoined && (
                                  <Badge className="bg-primary text-primary-foreground border-0">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Joined
                                  </Badge>
                                )}
                                {isLimitReached && !isJoined && (
                                  <Badge className="bg-amber-600 text-white border-0">
                                    Full
                                  </Badge>
                                )}
                                {!salesState.isOpen && !isJoined && !isLimitReached && (
                                  <Badge className="bg-muted text-muted-foreground border border-border">
                                    {salesState.closed ? "Membership Closed" : "Unavailable"}
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="text-right space-y-1">
                                <div className="text-2xl font-bold text-primary">
                                  {formatPrice(calculateTransactionFees(plan.price).finalAmount, plan.currency)}
                                </div>
                                <div className="text-xs text-muted-foreground/70">all-inclusive</div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-xs text-muted-foreground/70">Member time: </span>
                                  {formatPlanPeriod(plan)}
                                </div>
                                {/* {(plan.planStartDate || plan.planEndDate) && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground justify-end">
                                    {plan.planStartDate && (
                                      <span>Starts: {formatDate(plan.planStartDate)}</span>
                                    )}
                                    {plan.planEndDate && (
                                      <span>Ends: {formatDate(plan.planEndDate)}</span>
                                    )}
                                  </div>
                                )} */}
                                {(plan.bookingStartDate || plan.bookingEndDate) && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground justify-end">
                                    {plan.bookingStartDate && (
                                      <span className="flex items-center gap-1">
                                        <CalendarClock className="w-3 h-3 shrink-0" />
                                        Book from: {formatDate(plan.bookingStartDate)}
                                      </span>
                                    )}
                                    {plan.bookingEndDate && (
                                      <span className="flex items-center gap-1">
                                        <CalendarClock className="w-3 h-3 shrink-0" />
                                        Book until: {formatDate(plan.bookingEndDate)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{plan.description}</p>

                            {isJoined && getLastPurchaseDate(selectedClub._id) && (
                              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <p className="text-sm font-bold text-primary">
                                  Last membership purchase: {formatDate(getLastPurchaseDate(selectedClub._id))}
                                </p>
                              </div>
                            )}

                            {isLimitReached && !isJoined && selectedClub.memberInfo && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                  Maximum member limit reached ({selectedClub.memberInfo.currentCount}/{selectedClub.memberInfo.maxLimit})
                                </p>
                              </div>
                            )}
                            {!salesState.isOpen && !isJoined && !isLimitReached && (
                              <div className="rounded-lg border border-border bg-muted p-3">
                                <p className="text-sm font-bold text-foreground">
                                  {salesState.closed ? "Membership Closed. Contact Club Admin" : "Membership sales are not open yet for this plan"}
                                </p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Features:</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  {getFeatureIcon('events')}
                                  <span>{plan.features.maxEvents} Events</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getFeatureIcon('news')}
                                  <span>{plan.features.maxNews} News Items</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getFeatureIcon('members')}
                                  <span>{plan.features.maxMembers} Members</span>
                                </div>
                                {plan.features.advancedAnalytics && (
                                  <div className="flex items-center gap-2">
                                    {getFeatureIcon('analytics')}
                                    <span>Analytics</span>
                                  </div>
                                )}
                                {plan.features.prioritySupport && (
                                  <div className="flex items-center gap-2">
                                    {getFeatureIcon('support')}
                                    <span>Priority Support</span>
                                  </div>
                                )}
                                {plan.features.apiAccess && (
                                  <div className="flex items-center gap-2">
                                    {getFeatureIcon('api')}
                                    <span>API Access</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              className={cn(
                                "w-full",
                                isJoined || isLimitReached ? "opacity-50 cursor-not-allowed bg-secondary/30 text-secondary" : "bg-primary hover:from-blue-700 hover:to-purple-700"
                              )}
                              onClick={() => handleJoinClub(selectedClub, plan)}
                              disabled={isDisabled}
                            >
                              {isJoined ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Already Joined
                                </>
                              ) : isLimitReached ? (
                                "Club Full"
                              ) : !salesState.isOpen ? (
                                salesState.closed ? "Membership Closed" : "Unavailable"
                              ) : (
                                <>
                                  Join with {plan.name}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{selectedClub.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{selectedClub.contactPhone}</span>
                        </div>
                        {selectedClub.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-primary" />
                            <a
                              href={selectedClub.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {selectedClub.website}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {selectedClub.address && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Location
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div>{selectedClub.address.street}</div>
                            <div>{selectedClub.address.city}, {selectedClub.address.state} {selectedClub.address.zipCode}</div>
                            <div>{selectedClub.address.country}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-primary" />
                          What You'll Get
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-primary" />
                          <span>Connect with fellow supporters</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span>Access to exclusive events</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Newspaper className="w-5 h-5 text-primary" />
                          <span>Latest news and updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-primary" />
                          <span>Special member benefits</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Member Benefits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span>Priority access to events</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span>Exclusive merchandise</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span>Member-only communications</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span>Community forums</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="flex max-h-[90vh] max-w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              {selectedPlan?.price ? `Register & Pay — Join ${selectedClub?.name}` : `Register & Join — ${selectedClub?.name}`}
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {selectedPlan?.price ? (
                <>
                  <span className="block font-medium">Step 1: Fill your details</span>
                  <span className="block text-muted-foreground">We collect your registration details.</span>
                  <span className="block font-medium mt-2">Step 2: Pay</span>
                  <span className="block text-muted-foreground">After Razorpay success, we create your account and activate the {selectedPlan?.name} membership.</span>
                </>
              ) : (
                <>
                  <span className="block font-medium">Step 1: Register</span>
                  <span className="block text-muted-foreground">We create your account first, then you join the club with the {selectedPlan?.name} plan (free).</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={registrationData.username}
                    onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={registrationData.first_name}
                    onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={registrationData.last_name}
                    onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={registrationData.date_of_birth}
                    onChange={(e) => setRegistrationData({ ...registrationData, date_of_birth: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={registrationData.gender}
                    onChange={(e) => setRegistrationData({ ...registrationData, gender: e.target.value })}
                    className="w-full h-12 rounded-md border px-3"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-[7rem_1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <CountryCodeSelect
                      id="countryCode"
                      value={registrationData.countryCode}
                      onValueChange={(value) => setRegistrationData({ ...registrationData, countryCode: value })}
                      className="h-12 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={registrationData.phoneNumber}
                      onChange={(e) => setRegistrationData({ ...registrationData, phoneNumber: e.target.value })}
                      required
                      className="h-12 w-full"
                    />
                    {registrationErrors.phoneNumber && (
                      <p className="text-destructive text-sm mt-1">{registrationErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={registrationData.address_line1}
                    onChange={(e) => setRegistrationData({ ...registrationData, address_line1: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={registrationData.address_line2}
                    onChange={(e) => setRegistrationData({ ...registrationData, address_line2: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={registrationData.city}
                    onChange={(e) => setRegistrationData({ ...registrationData, city: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state_province">State / Province</Label>
                  <Input
                    id="state_province"
                    value={registrationData.state_province}
                    onChange={(e) => setRegistrationData({ ...registrationData, state_province: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                  <Input
                    id="zip_code"
                    value={registrationData.zip_code}
                    onChange={(e) => setRegistrationData({ ...registrationData, zip_code: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={registrationData.country}
                    onChange={(e) => setRegistrationData({ ...registrationData, country: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_proof_type">ID Proof Type</Label>
                  <select
                    id="id_proof_type"
                    value={registrationData.id_proof_type}
                    onChange={(e) => setRegistrationData({ ...registrationData, id_proof_type: e.target.value })}
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
                    onChange={(e) => setRegistrationData({ ...registrationData, id_proof_number: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {selectedPlan?.referralReward?.enabled && (
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="referralPhone" className="text-sm font-medium">
                      Referral Mobile Number
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Enter the registered mobile number of the member who referred you to earn them points!
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="referralPhone"
                      type="tel"
                      placeholder="10-digit mobile number of referring member"
                      value={referralPhone}
                      onChange={(e) => setReferralPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={cn(
                        "h-12 pr-10",
                        referralStatus === "found" && "border-green-500",
                        (referralStatus === "not-found" || referralStatus === "not-member" || referralStatus === "self") && "border-amber-400"
                      )}
                      maxLength={10}
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
                    <p className="text-xs font-medium text-green-600">
                      {referralName}
                    </p>
                  )}
                  {referralStatus === "found" && !referralName && (
                    <p className="text-xs font-medium text-green-600">
                      Referral confirmed — your referrer will earn points when you join.
                    </p>
                  )}
                  {referralStatus === "not-found" && (
                    <p className="text-xs text-amber-600">
                      Member not found. Please check the number to ensure your friend gets their points.
                    </p>
                  )}
                  {referralStatus === "not-member" && (
                    <p className="text-xs text-amber-600">
                      {referralName
                        ? `${referralName} is registered but not an active member of ${selectedClub?.name}.`
                        : "This number is not an active member of this club."}
                    </p>
                  )}
                  {referralStatus === "self" && (
                    <p className="text-xs font-medium text-destructive">You cannot refer yourself.</p>
                  )}
                </div>
              )}

              {selectedPlan && (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-primary/30 bg-muted/70 p-4 shadow-sm dark:bg-muted/40">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Award className="h-4 w-4 shrink-0 text-primary" />
                      <span>
                        Selected Plan: <span className="text-primary">{selectedPlan.name}</span>
                      </span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold text-primary">{formatPrice(calculateTransactionFees(selectedPlan.price).finalAmount, selectedPlan.currency)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium text-foreground">{formatPlanPeriod(selectedPlan)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Features:</span>
                        <span className="text-right font-medium text-foreground">{selectedPlan.features.maxEvents} events, {selectedPlan.features.maxNews} news items</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-primary hover:from-blue-700 hover:to-purple-700"
              >
                {isRegistering
                  ? (selectedPlan?.price ? "Registering, then Pay…" : "Registering…")
                  : (selectedPlan?.price ? "Pay & Create Account" : "Register & Join")}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {pendingOrder && (() => {
        const feeBreakdown = pendingOrder.total > 0 ? calculateTransactionFees(pendingOrder.total) : null
        const amountToCharge = feeBreakdown ? feeBreakdown.finalAmount : pendingOrder.total
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
            platformFeeTotal={feeBreakdown ? feeBreakdown.platformFee + feeBreakdown.platformFeeGst : undefined}
            razorpayFeeTotal={feeBreakdown ? feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst : undefined}
            dialogTitle="Pay Now — Complete Your Membership"
            dialogDescription="You're registered. Complete payment to activate your membership."
            payButtonLabel={`Pay ${formatPrice(amountToCharge, pendingOrder.currency)} Now`}
          />
        )
      })()}

      <SiteFooter brandName="Wingman Pro" />
    </div>
  )
}

export default function ClubsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center public-theme">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading clubs...</p>
        </div>
      </div>
    }>
      <ClubsPageContent />
    </Suspense>
  )
} 