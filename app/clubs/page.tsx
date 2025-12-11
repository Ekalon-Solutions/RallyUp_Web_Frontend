"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Search,
  Filter,
  Star,
  Heart,
  Share2,
  Eye,
  Clock,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Users2,
  CalendarDays,
  Newspaper,
  Settings,
  ExternalLink
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"

interface Club {
  _id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  contactEmail: string
  contactPhone: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  status: 'active' | 'inactive' | 'suspended'
  membershipPlans: MembershipPlan[]
}

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration: number
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
}

export default function ClubsPage() {
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
  const [registrationData, setRegistrationData] = useState({
    // Lightweight registration fields (expanded below)
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    gender: "male",
    phone_number: "",
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
    // Keep legacy name for compatibility where used elsewhere
    name: ""
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationErrors, setRegistrationErrors] = useState({ phone_number: "" })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string
    orderNumber: string
    total: number
    currency: string
    paymentMethod: string
  } | null>(null)
  const [registeredToken, setRegisteredToken] = useState<string | null>(null)
  const [userMemberships, setUserMemberships] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If a `search` query param is present, pre-populate searchTerm so
    // initial filtering happens based on the URL.
    const initialSearch = searchParams?.get?.('search') || ''
    if (initialSearch) setSearchTerm(initialSearch)

    fetchClubs()
    fetchUserMemberships()
  }, [])

  useEffect(() => {
    filterClubs()
  }, [clubs, searchTerm, statusFilter, priceFilter])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(API_ENDPOINTS.clubs.public))
      const data = await response.json()
      
      if (response.ok) {
        // Cast API response to local Club[] to satisfy local UI types
        setClubs((data.clubs || []) as unknown as Club[])
      } else {
        toast.error("Failed to load clubs")
      }
    } catch (error) {
      // console.error("Error fetching clubs:", error)
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
        const clubIds = data.user?.memberships?.map((m: any) => m.club_id?._id || m.club_id) || []
        setUserMemberships(clubIds)
      }
    } catch (error) {
      // Silently fail - user might not be logged in
      console.log("Could not fetch user memberships:", error)
    }
  }

  const isClubJoined = (clubId: string) => {
    return userMemberships.includes(clubId)
  }

  const filterClubs = () => {
    let filtered = clubs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.address?.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(club => club.status === statusFilter)
    }

    // Price filter
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
    setSelectedClub(club)
    setSelectedPlan(plan)
    setShowRegistrationDialog(true)
  }

  const handleViewClubDetails = (club: Club) => {
    setSelectedClub(club)
    setShowClubDetails(true)
  }

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return ""
    const phoneRegex = /^\d{10,15}$/
    if (!phoneRegex.test(phone)) {
      return "Phone number must be 10-15 digits"
    }
    return ""
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub || !selectedPlan) return
    // Validate phone number before proceeding
    const phoneError = validatePhoneNumber(registrationData.phone_number)
    setRegistrationErrors({ phone_number: phoneError })
    if (phoneError) {
      toast.error(phoneError)
      return
    }

    setIsRegistering(true)
    try {
      // First, register the user
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
        // Save token temporarily (do not set in localStorage until payment succeeds)
        setRegisteredToken(registerData.token || null)

        // Show success message for registration
        toast.success("User registered successfully. Proceed to payment to activate membership.")

        // Prepare a temporary order and open payment modal (for paid plans)
        if (selectedPlan && selectedPlan.price > 0) {
          const orderId = `temp-${Date.now()}`
          const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
          const total = selectedPlan.price
          const currency = selectedPlan.currency || 'INR'
          const paymentMethod = 'all'

          setPendingOrder({ orderId, orderNumber, total, currency, paymentMethod })
          setIsPaymentModalOpen(true)
        } else {
          // Free plan fallback: store token and route immediately
          if (registerData.token) {
            localStorage.setItem('token', registerData.token)
            localStorage.setItem('userType', 'member')
          }
          // Close dialog and reset form
          setShowRegistrationDialog(false)
          setRegistrationData({
            username: "",
            first_name: "",
            last_name: "",
            email: "",
            date_of_birth: "",
            gender: "male",
            phone_number: "",
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
          })

          router.push("/dashboard/user/my-clubs")
        }
      } else {
        toast.error(registerData.message || "Registration failed")
      }
    } catch (error) {
      // console.error("Registration error:", error)
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

  const formatDuration = (months: number) => {
    if (months === 1) return "1 Month"
    if (months === 3) return "3 Months"
    if (months === 6) return "6 Months"
    if (months === 12) return "1 Year"
    return `${months} Months`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
    setIsRegistering(true)
    try {
      // Store token now that payment succeeded
      if (registeredToken) {
        localStorage.setItem('token', registeredToken)
        localStorage.setItem('userType', 'member')
      }

      // Finalize join including payment details
      const response = await fetch(getApiUrl(API_ENDPOINTS.users.joinClubRequest), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(registeredToken ? { 'Authorization': `Bearer ${registeredToken}` } : {})
        },
        body: JSON.stringify({
          clubId: selectedClub._id,
          membershipPlanId: selectedPlan._id,
          payment: {
            orderId,
            paymentId,
            razorpayOrderId,
            razorpaySignature
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Payment successful — membership activated.")
        setShowRegistrationDialog(false)
        setIsPaymentModalOpen(false)
        setPendingOrder(null)
        setRegistrationData({
          username: "",
          first_name: "",
          last_name: "",
          email: "",
          date_of_birth: "",
          gender: "male",
          phone_number: "",
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
        })

        router.push("/dashboard/user/my-clubs")
      } else {
        toast.error(data.message || "Failed to activate membership after payment.")
      }
    } catch (error) {
      // console.error("Finalize join error:", error)
      toast.error("An error occurred while finalizing membership after payment.")
    } finally {
      setIsRegistering(false)
      setIsPaymentModalOpen(false)
      setPendingOrder(null)
    }
  }

  const handlePaymentFailure = (
    orderId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
    error: any
  ) => {
    toast.error('Payment failed or verification failed. Please try again or contact support.')
    setIsPaymentModalOpen(false)
    setPendingOrder(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Discovering amazing clubs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Join the Community
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Discover and join supporter clubs to connect with fellow fans, attend exclusive events, and be part of something special.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search clubs by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-40 h-12">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <div className="flex flex-col gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredClubs.length} of {clubs.length} clubs
          </div>
        </div>

        {/* Clubs Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <Card key={club._id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg">
                <div className="relative">
                  {/* Club Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{club.name}</h3>
                          <Badge className={`mt-2 ${getStatusColor(club.status)}`}>
                            {club.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => handleViewClubDetails(club)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {club.description && (
                      <p className="text-blue-100 line-clamp-2">
                        {club.description}
                      </p>
                    )}
                  </div>
              
                  <CardContent className="p-6 space-y-4">
                {/* Club Info */}
                <div className="space-y-2">
                  {club.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                          <span>{club.address.city}, {club.address.state}</span>
                    </div>
                  )}
                  
                  {club.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-blue-600" />
                      <a 
                        href={club.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Website
                            <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Membership Plans */}
                <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        Membership Plans
                      </h4>
                      {club.membershipPlans?.filter(plan => plan.isActive).slice(0, 2).map((plan) => {
                        const isJoined = isClubJoined(club._id)
                        return (
                        <div key={plan._id} className={`border rounded-lg p-4 space-y-3 transition-colors ${isJoined ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-sm flex items-center gap-2">
                              {plan.name}
                              {isJoined && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Joined
                                </Badge>
                              )}
                            </h5>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                      </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                        {plan.description}
                      </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(plan.duration)}</span>
                            </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleJoinClub(club, plan)}
                              disabled={isJoined}
                              className={`flex items-center gap-1 ${isJoined ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
                        >
                              {isJoined ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Already Joined
                                </>
                              ) : (
                                <>
                                  Join Club
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                        </Button>
                      </div>
                    </div>
                        )
                      })}
                      
                      {club.membershipPlans?.filter(plan => plan.isActive).length > 2 && (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewClubDetails(club)}>
                          View All Plans ({club.membershipPlans?.filter(plan => plan.isActive).length})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClubs.map((club) => (
              <Card key={club._id} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{club.name}</h3>
                          <Badge className={getStatusColor(club.status)}>
                            {club.status}
                          </Badge>
                        </div>
                        
                        {club.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {club.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {club.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{club.address.city}, {club.address.state}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{club.membershipPlans?.filter(plan => plan.isActive).length || 0} plans</span>
                          </div>
                          
                          {club.website && (
                            <a 
                              href={club.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Globe className="w-4 h-4" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClubDetails(club)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      
                      {club.membershipPlans?.filter(plan => plan.isActive).length > 0 && (() => {
                        const isJoined = isClubJoined(club._id)
                        return (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinClub(club, club.membershipPlans?.filter(plan => plan.isActive)[0]!)}
                            disabled={isJoined}
                            className={isJoined ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}
                        >
                            {isJoined ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Already Joined
                              </>
                            ) : (
                              'Join Now'
                            )}
                        </Button>
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
          <div className="text-center py-16">
            <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No clubs found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or check back later for new clubs.
            </p>
            <Button onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setPriceFilter("all")
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Club Details Modal */}
      <Dialog open={showClubDetails} onOpenChange={setShowClubDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClub && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedClub.name}</div>
                    <Badge className={`mt-2 ${getStatusColor(selectedClub.status)}`}>
                      {selectedClub.status}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-lg">
                  {selectedClub.description}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="plans" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plans">Membership Plans</TabsTrigger>
                  <TabsTrigger value="info">Club Info</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedClub.membershipPlans?.filter(plan => plan.isActive).map((plan) => {
                      const isJoined = isClubJoined(selectedClub._id)
                      return (
                      <Card key={plan._id} className={`border-2 transition-colors ${isJoined ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'hover:border-blue-300'}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {plan.name}
                              {isJoined && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Joined
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {formatPrice(plan.price, plan.currency)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDuration(plan.duration)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-muted-foreground">{plan.description}</p>
                          
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
                            className={`w-full ${isJoined ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
                            onClick={() => handleJoinClub(selectedClub, plan)}
                            disabled={isJoined}
                          >
                            {isJoined ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Already Joined
                              </>
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
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>{selectedClub.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{selectedClub.contactPhone}</span>
                        </div>
                        {selectedClub.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-purple-600" />
                            <a 
                              href={selectedClub.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
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
                          <Star className="w-5 h-5 text-yellow-500" />
                          What You'll Get
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span>Connect with fellow supporters</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <span>Access to exclusive events</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Newspaper className="w-5 h-5 text-purple-600" />
                          <span>Latest news and updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <span>Special member benefits</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-500" />
                          Member Benefits
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span>Priority access to events</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span>Exclusive merchandise</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span>Member-only communications</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
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

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-2xl max-w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              Join {selectedClub?.name}
            </DialogTitle>
            <DialogDescription>
              Complete your registration to join the club with the {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto pr-2">
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

              <div className="space-y-2"></div>
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

              <div className="sm:col-span-2 space-y-2">
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

              <div className="col-span-2 sm:col-span-2 flex gap-2">
                <div className="w-1/3 space-y-2">
                  <Label htmlFor="countryCode">Country Code</Label>
                  <Input
                    id="countryCode"
                    value={registrationData.countryCode}
                    onChange={(e) => setRegistrationData({ ...registrationData, countryCode: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="w-2/3 space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={registrationData.phone_number}
                    onChange={(e) => setRegistrationData({ ...registrationData, phone_number: e.target.value })}
                    required
                    className="h-12"
                  />
                  {registrationErrors.phone_number && (
                    <p className="text-destructive text-sm mt-1">{registrationErrors.phone_number}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={registrationData.address_line1}
                  onChange={(e) => setRegistrationData({ ...registrationData, address_line1: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
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

            {selectedPlan && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Selected Plan: {selectedPlan.name}
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-semibold text-primary">{formatPrice(selectedPlan.price, selectedPlan.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{formatDuration(selectedPlan.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Features:</span>
                      <span>{selectedPlan.features.maxEvents} events, {selectedPlan.features.maxNews} news items</span>
                    </div>
                  </div>
                </div>

                {/* Payment section removed from UI */}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isRegistering} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isRegistering ? "Registering..." : "Register User"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRegistrationDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {pendingOrder && (
        <PaymentSimulationModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setPendingOrder(null)
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          orderId={pendingOrder.orderId}
          orderNumber={pendingOrder.orderNumber}
          total={pendingOrder.total}
          currency={pendingOrder.currency}
          paymentMethod={pendingOrder.paymentMethod}
        />
      )}

    </div>
  )
} 