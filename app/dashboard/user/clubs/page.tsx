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
import { DashboardLayout } from "@/components/dashboard-layout"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
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
  ExternalLink,
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"

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

export default function UserClubsPage() {
  const { user } = useAuth()
  const router = useRouter()
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string
    orderNumber: string
    total: number
    currency: string
    paymentMethod: string
  } | null>(null)
  const [userMemberships, setUserMemberships] = useState<string[]>([])

  useEffect(() => {
    fetchClubs()
    fetchUserMemberships()
  }, [user])

  const fetchUserMemberships = async () => {
    try {
      if (!user?._id) {
        setUserMemberships([])
        return
      }

      if (user && 'memberships' in user && user.memberships) {
        const clubIds = user.memberships.map((m: any) => m.club_id?._id || m.club_id).filter(Boolean)
        setUserMemberships(clubIds)
        return
      }

      const response = await apiClient.get(`/users/profile`)
      
      if (response.success && response.data) {
        const clubIds = response.data.user?.memberships?.map((m: any) => m.club_id?._id || m.club_id).filter(Boolean) || []
        setUserMemberships(clubIds)
      }
    } catch (error) {
      setUserMemberships([])
    }
  }

  const isClubJoined = (clubId: string) => {
    return userMemberships.includes(clubId)
  }

  useEffect(() => {
    filterClubs()
  }, [clubs, searchTerm, statusFilter, priceFilter])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicClubs()
      
      if (response.success) {
        // API returns a Club type from lib/api which may differ from the UI type
        setClubs((response.data?.clubs || []) as unknown as Club[])
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

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub || !selectedPlan || !user) return

    // Free plans: join immediately
    if (selectedPlan.price === 0) {
      setIsRegistering(true)
      try {
        const response = await apiClient.joinClub({
          clubId: selectedClub._id,
          membershipPlanId: selectedPlan._id
        } as any)

        if (response.success) {
          toast.success("Successfully joined the club!")
          setShowRegistrationDialog(false)
          fetchClubs()
        } else {
          toast.error(response.error || "Failed to join club. Please try again.")
        }
      } catch (error) {
        toast.error("An error occurred while joining the club.")
      } finally {
        setIsRegistering(false)
      }
      return
    }

    // Paid plans: create a temporary order object and open the payment modal
    const orderId = `temp-${Date.now()}`
    const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
    const total = selectedPlan.price
    const currency = selectedPlan.currency || 'INR'
    const paymentMethod = 'all'

    setPendingOrder({ orderId, orderNumber, total, currency, paymentMethod })
    setIsPaymentModalOpen(true)
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
      // Finalize join including payment details
      const response = await apiClient.joinClub({
        clubId: selectedClub._id,
        membershipPlanId: selectedPlan._id,
        payment: {
          orderId,
          paymentId,
          razorpayOrderId,
          razorpaySignature
        }
      } as any)

      if (response.success) {
        toast.success("Successfully joined the club!")
        setShowRegistrationDialog(false)
        fetchClubs()
      } else {
        toast.error(response.error || "Failed to join club. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred while joining the club.")
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

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free"
    return `${currency} ${price.toLocaleString()}`
  }

  const formatDuration = (months: number) => {
    if (months === 1) return "1 month"
    if (months < 12) return `${months} months`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'maxEvents':
        return <Calendar className="w-4 h-4" />
      case 'maxNews':
        return <Newspaper className="w-4 h-4" />
      case 'maxMembers':
        return <Users2 className="w-4 h-4" />
      case 'customBranding':
        return <Award className="w-4 h-4" />
      case 'advancedAnalytics':
        return <TrendingUp className="w-4 h-4" />
      case 'prioritySupport':
        return <Shield className="w-4 h-4" />
      case 'apiAccess':
        return <Zap className="w-4 h-4" />
      case 'customIntegrations':
        return <Settings className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Discover Clubs</h1>
              <p className="text-muted-foreground">Find and join supporter clubs to connect with fellow fans</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search clubs by name, description, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free Plans</SelectItem>
                      <SelectItem value="paid">Paid Plans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <div className="grid grid-cols-2 gap-1 w-4 h-4">
                      <div className="bg-current rounded"></div>
                      <div className="bg-current rounded"></div>
                      <div className="bg-current rounded"></div>
                      <div className="bg-current rounded"></div>
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <div className="flex flex-col gap-1 w-4 h-4">
                      <div className="bg-current rounded h-1"></div>
                      <div className="bg-current rounded h-1"></div>
                      <div className="bg-current rounded h-1"></div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clubs Grid/List */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {filteredClubs.map((club) => (
                <Card key={club._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {club.logo && (
                            <img src={club.logo} alt={club.name} className="w-8 h-8 rounded" />
                          )}
                          {club.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {club.description || "Join this supporter club to connect with fellow fans."}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(club.status)}>
                        {club.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Club Info */}
                    <div className="space-y-2">
                      {club.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{club.address.city}, {club.address.state}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{club.membershipPlans?.length || 0} membership plans available</span>
                      </div>
                    </div>

                    {/* Membership Plans */}
                    {club.membershipPlans && club.membershipPlans.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Membership Plans</Label>
                        <div className="space-y-2">
                          {club.membershipPlans.slice(0, 2).map((plan) => (
                            <div key={plan._id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="text-sm font-medium">{plan.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDuration(plan.duration)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{formatPrice(plan.price, plan.currency)}</p>
                                {isClubJoined(club._id) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/dashboard/user/clubs`)}
                                    className="mt-1"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    View Club
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleJoinClub(club, plan)}
                                    className="mt-1"
                                  >
                                    Join
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {club.membershipPlans.length > 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClubDetails(club)}
                              className="w-full"
                            >
                              View All Plans ({club.membershipPlans.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClubDetails(club)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {isClubJoined(club._id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/user/clubs`)}
                          className="bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          View Club
                        </Button>
                      ) : (
                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          size="sm"
                          onClick={() => {
                            if (club.membershipPlans?.length > 0) {
                              handleJoinClub(club, club.membershipPlans[0]);
                            } else {
                              toast.error("No membership plans available for this club");
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Join Club
                        </Button>
                      )}
                      {club.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(club.website, '_blank')}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Club Details Modal */}
          <Dialog open={showClubDetails} onOpenChange={setShowClubDetails}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedClub && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedClub.logo && (
                        <img src={selectedClub.logo} alt={selectedClub.name} className="w-8 h-8 rounded" />
                      )}
                      {selectedClub.name}
                    </DialogTitle>
                    <DialogDescription>
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
                      <div className="grid gap-4">
                        {selectedClub.membershipPlans?.map((plan) => (
                          <Card key={plan._id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle>{plan.name}</CardTitle>
                                  <CardDescription>{plan.description}</CardDescription>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{formatPrice(plan.price, plan.currency)}</p>
                                  <p className="text-sm text-muted-foreground">{formatDuration(plan.duration)}</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {(Object.entries(plan.features) as [keyof typeof plan.features, boolean | number][]).map(([key, value]) => (
                                  <div key={String(key)} className="flex items-center gap-2">
                                    {getFeatureIcon(String(key))}
                                    <span className="text-sm">
                                      {typeof value === 'boolean' 
                                        ? (value ? 'Yes' : 'No')
                                        : `${value} ${String(key).replace('max', '')}`
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {selectedClub && isClubJoined(selectedClub._id) ? (
                                <Button 
                                  variant="outline"
                                  onClick={() => router.push(`/dashboard/user/clubs`)}
                                  className="w-full bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  View Club
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => handleJoinClub(selectedClub, plan)}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Join {plan.name}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="info" className="space-y-4">
                      <div className="grid gap-4">
                        {selectedClub.address && (
                          <div>
                            <Label>Location</Label>
                            <p className="text-sm text-muted-foreground">
                              {selectedClub.address.street}, {selectedClub.address.city}, {selectedClub.address.state} {selectedClub.address.zipCode}, {selectedClub.address.country}
                            </p>
                          </div>
                        )}
                        <div>
                          <Label>Contact</Label>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <Mail className="w-4 h-4 inline mr-2" />
                              {selectedClub.contactEmail}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Phone className="w-4 h-4 inline mr-2" />
                              {selectedClub.contactPhone}
                            </p>
                          </div>
                        </div>
                        {selectedClub.website && (
                          <div>
                            <Label>Website</Label>
                            <a 
                              href={selectedClub.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Globe className="w-4 h-4" />
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="features" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This club offers various features and benefits to its members. 
                        Join to access exclusive content, events, and community features.
                      </p>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>
          {/* Payment Simulation Modal */}
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

          {/* Join Club Dialog */}
          <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join {selectedClub?.name}</DialogTitle>
                <DialogDescription>
                  Send a request to join {selectedClub?.name} with the {selectedPlan?.name} plan.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinRequest} className="space-y-4">
                {/* User Info */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Plan Info */}
                {selectedPlan && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      Selected Plan
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span className="font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formatDuration(selectedPlan.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <div>
                          <span className="text-muted-foreground mr-2">
                            {formatPrice(selectedPlan.price, selectedPlan.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isRegistering} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isRegistering ? "Sending Request..." : "Send Join Request"}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
} 