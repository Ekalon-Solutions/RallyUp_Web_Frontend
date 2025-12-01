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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"

interface Club {
  _id: string
  name: string
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
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1"
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchClubs()
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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub || !selectedPlan) return

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
          clubId: selectedClub._id,
          membershipPlanId: selectedPlan._id,
          // Add membership info
          membership: {
            type: 'free',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + selectedPlan.duration * 30 * 24 * 60 * 60 * 1000).toISOString(), // Convert months to milliseconds
            status: 'active',
            paymentStatus: 'free'
          }
        }),
      })

      const registerData = await registerResponse.json()

      if (registerResponse.ok) {
        // Store the token
        localStorage.setItem('token', registerData.token)
        localStorage.setItem('userType', 'member')

        // Show success message
        toast.success("Welcome to the club! Your free membership is now active.")
        
        // Close dialog and reset form
        setShowRegistrationDialog(false)
        setRegistrationData({
          name: "",
          email: "",
          phoneNumber: "",
          countryCode: "+91"
        })

        // Redirect to dashboard
        router.push("/dashboard/user")
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Users className="w-5 h-5 mr-2" />
                Explore Clubs
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Heart className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
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
                      {club.membershipPlans?.filter(plan => plan.isActive).slice(0, 2).map((plan) => (
                        <div key={plan._id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-sm">{plan.name}</h5>
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
                              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Join Club
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                      
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
                      
                      {club.membershipPlans?.filter(plan => plan.isActive).length > 0 && (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinClub(club, club.membershipPlans?.filter(plan => plan.isActive)[0]!)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Join Now
                        </Button>
                      )}
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
                    {selectedClub.membershipPlans?.filter(plan => plan.isActive).map((plan) => (
                      <Card key={plan._id} className="border-2 hover:border-blue-300 transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
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
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => handleJoinClub(selectedClub, plan)}
                          >
                            Join with {plan.name}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
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
        <DialogContent className="sm:max-w-md">
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
          
          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={registrationData.name}
                onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                required
                className="h-12"
              />
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
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  value={registrationData.countryCode}
                  onChange={(e) => setRegistrationData({ ...registrationData, countryCode: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={registrationData.phoneNumber}
                  onChange={(e) => setRegistrationData({ ...registrationData, phoneNumber: e.target.value })}
                  required
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
                      <span className="font-semibold line-through text-gray-400 dark:text-gray-500">{formatPrice(selectedPlan.price, selectedPlan.currency)}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">FREE</span>
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

                {/* Payment infrastructure (disabled) */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg opacity-50 pointer-events-none">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Payment Details (Coming Soon)
                  </h4>
                  <div className="space-y-2">
                    <Input
                      disabled
                      placeholder="Card Number"
                      className="h-12 bg-white dark:bg-gray-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        disabled
                        placeholder="MM/YY"
                        className="h-12 bg-white dark:bg-gray-700"
                      />
                      <Input
                        disabled
                        placeholder="CVC"
                        className="h-12 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Payment processing will be enabled in a future update. Currently, all memberships are free.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isRegistering} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isRegistering ? "Joining..." : "Join Club"}
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
        </DialogContent>
      </Dialog>
    </div>
  )
} 