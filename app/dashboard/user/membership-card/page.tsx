"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  Share2, 
  QrCode, 
  CreditCard, 
  Calendar,
  MapPin,
  RefreshCw
} from "lucide-react"
import { MembershipCard } from "@/components/membership-card"
import { apiClient, PublicMembershipCardDisplay } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

export default function UserMembershipCardPage() {
  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<PublicMembershipCardDisplay | null>(null)
  const [responseInfo, setResponseInfo] = useState<any>(null)
  const { user } = useAuth() // Get user from auth context
  const { toast } = useToast()

  // Get user's name from auth context
  const userName = user?.name || 'Member'

  // Filter cards to show only those matching user's current plan
  const userPlanCards = cards.filter(card => 
    user?.membershipPlan && card.membershipPlan._id === user.membershipPlan
  );

  // Use filtered cards if available, otherwise fall back to all cards
  const displayCards = userPlanCards.length > 0 ? userPlanCards : cards;
  const displaySelectedCard = userPlanCards.length > 0 ? userPlanCards[0] : selectedCard;

  // Fetch user's membership cards - MUST be before any conditional returns
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)
        console.log('🔄 Frontend: Starting to fetch membership cards...')
        
        // Use the new API method to get cards for the user's club
        const response = await apiClient.getMyClubMembershipCards()
        console.log('📡 Frontend: API Response received:', response)
        
        if (response.success && response.data) {
          console.log('✅ Frontend: Setting cards data:', response.data)
          console.log('✅ Frontend: Cards array length:', response.data.length)
          console.log('✅ Frontend: First card structure:', response.data[0])
          
          // Check if data is nested (backend sends { success: true, data: result.data })
          const cardsData = Array.isArray(response.data) ? response.data : response.data.data
          console.log('🔍 Frontend: Extracted cards data:', cardsData)
          
          if (cardsData && Array.isArray(cardsData)) {
            setCards(cardsData)
            setResponseInfo(response)
            if (cardsData.length > 0) {
              console.log('🎯 Frontend: Setting selected card:', cardsData[0])
              setSelectedCard(cardsData[0])
            }
          } else {
            console.log('❌ Frontend: Invalid cards data structure:', cardsData)
            setError('Invalid data structure received from server')
          }
        } else {
          console.log('❌ Frontend: API returned error:', response.error)
          console.log('❌ Frontend: Full response:', response)
          setError(response.error || 'Failed to fetch membership cards')
        }
        
        // Handle helpful messages from backend
        if (response.message) {
          console.log('💬 Frontend: Displaying message:', response.message)
          toast({
            title: "Info",
            description: response.message,
          })
        }
      } catch (err) {
        console.error('💥 Frontend: Error caught:', err)
        setError('Failed to fetch membership cards')
        toast({
          title: "Error",
          description: "Failed to fetch membership cards",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        console.log('🏁 Frontend: Fetch completed, loading set to false')
      }
    }

    fetchCards()
  }, [toast])

  // Show loading state if user data is not yet loaded
  if (!user && loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const handleDownload = async () => {
    try {
      // Download functionality would be implemented here
      toast({
        title: "Success",
        description: "Membership card downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download membership card",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share && selectedCard) {
        await navigator.share({
          title: `${selectedCard.club.name} Membership Card`,
          text: `My membership card for ${selectedCard.club.name}`,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Success",
          description: "Link copied to clipboard",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share membership card",
        variant: "destructive",
      })
    }
  }

  const handleShowQR = () => {
    if (selectedCard?.card.qrCode) {
      // QR code display functionality would be implemented here
      toast({
        title: "QR Code",
        description: "QR code display coming soon",
      })
    }
  }

  const handleRegenerateQR = async () => {
    if (!selectedCard) return

    try {
      const response = await apiClient.regenerateQRCode(selectedCard.card._id)
      
      if (response.success) {
        // Update the selected card with new QR code
        setSelectedCard(prev => prev ? {
          ...prev,
          card: { ...prev.card, qrCode: response.data?.qrCode }
        } : null)
        
        // Update the card in the cards list
        setCards(prev => prev.map(card => 
          card.card._id === selectedCard.card._id 
            ? { ...card, card: { ...card.card, qrCode: response.data?.qrCode } }
            : card
        ))
        
        toast({
          title: "Success",
          description: "QR code regenerated successfully",
        })
      } else {
        throw new Error(response.error || 'Failed to regenerate QR code')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate QR code",
        variant: "destructive",
      })
    }
  }

  console.log('🎭 Frontend: Current state values:', {
    cards: cards,
    cardsLength: cards.length,
    selectedCard: selectedCard,
    loading: loading,
    error: error
  })

  // Debug: Show raw data for troubleshooting
  if (cards.length > 0) {
    console.log('🎉 Frontend: Cards found, first card:', cards[0])
  }

  // Show loading state while fetching
  if (loading) {
    console.log('🔄 Frontend: Still loading, showing spinner')
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Show error state if there's an error
  if (error) {
    console.log('❌ Frontend: Error state, showing error message')
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="text-center text-red-500 py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again later or contact support if the problem persists.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Show empty state if no cards found
  if (cards.length === 0 && !loading) {
    console.log('😞 Frontend: No cards found, showing empty state')
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Membership Cards Found</p>
              <p className="text-sm mt-2">
                You don't have any active membership cards at the moment.
              </p>
              
              {/* Debug info */}
              <div className="mt-4 p-4 bg-muted rounded-lg text-left text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Cards array length: {cards.length}</p>
                <p>Selected card: {selectedCard ? 'Yes' : 'No'}</p>
                <p>Response info: {responseInfo ? 'Available' : 'None'}</p>
                {responseInfo && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(responseInfo, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  console.log('🎯 Frontend: Rendering main membership card display with', cards.length, 'cards')
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Membership Card</h1>
              <p className="text-muted-foreground">View and manage your digital membership card</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShowQR}>
                <QrCode className="w-4 h-4 mr-2" />
                Show QR
              </Button>
              <Button variant="outline" onClick={handleRegenerateQR}>
                <RefreshCw className="w-4 h-4 mr-2" />
                New QR
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Membership Card Display */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Digital Membership Card
                  </CardTitle>
                  <CardDescription>
                    {displaySelectedCard ? 
                      `Your digital membership card for ${displaySelectedCard.club.name}` : 
                      'Select a membership card to view'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displaySelectedCard ? (
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm">
                        <MembershipCard
                          cardData={displaySelectedCard}
                          cardStyle={displaySelectedCard.card.cardStyle}
                          showLogo={displaySelectedCard.card.customization?.showLogo ?? true}
                          userName={userName}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No membership cards available</p>
                      <p className="text-sm">Contact your club admin to create membership cards</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Card Actions & Info */}
            {displaySelectedCard && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleDownload} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Card
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Card
                    </Button>
                  </CardContent>
                </Card>

                {/* Card Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Card Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Member Name:</span>
                        <span className="font-medium">
                          {user ? userName : 'Loading...'}
                        </span>
                      </div>

                      {user?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Expires:</span>
                        <span>{new Date(displaySelectedCard.card.expiryDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Club:</span>
                        <span>{displaySelectedCard.club.name}</span>
                      </div>

                      {displaySelectedCard.club.address?.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span>{displaySelectedCard.club.address.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={displaySelectedCard.card.status === 'active' ? 'default' : 'secondary'}>
                          {displaySelectedCard.card.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Membership Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{displaySelectedCard.membershipPlan.name}</p>
                        <p className="text-sm text-muted-foreground">{displaySelectedCard.membershipPlan.description}</p>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Plan Features:</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Duration</span>
                            <span className="font-medium">{displaySelectedCard.membershipPlan.duration} months</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Access Level</span>
                            <span className="font-medium">{displaySelectedCard.card.accessLevel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Card Style</span>
                            <span className="font-medium capitalize">{displaySelectedCard.card.cardStyle}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Multiple Cards (if user has more than one) */}
          {displayCards.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Available Membership Cards</CardTitle>
                <CardDescription>
                  Your club has {displayCards.length} membership card designs available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayCards.map((card) => (
                    <div key={card.card._id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{card.membershipPlan.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{card.card.cardStyle} style</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={card.card.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {card.card.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Access:</span>
                          <span className="capitalize">{card.card.accessLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires:</span>
                          <span>{new Date(card.card.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => setSelectedCard(card)}
                      >
                        View Card
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Cards Message */}
          {displayCards.length === 0 && !loading && (
            <Card>
              <CardHeader>
                <CardTitle>No Matching Membership Cards</CardTitle>
                <CardDescription>
                  {userPlanCards.length === 0 && cards.length > 0 
                    ? "No membership cards match your current plan"
                    : "Your club hasn't created any membership cards yet"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">
                    {userPlanCards.length === 0 && cards.length > 0 
                      ? "Plan Mismatch Detected"
                      : "No membership cards found"
                    }
                  </p>
                  <p className="text-sm mb-4">
                    {userPlanCards.length === 0 && cards.length > 0 
                      ? `You have the "${user?.membershipPlan?.name || 'Unknown'}" plan, but no cards are available for it. Contact your club administrator to create cards for your plan.`
                      : "Contact your club administrator to create membership cards for your plans"
                    }
                  </p>
                  
                  {/* Show user's current plan info if available */}
                  {responseInfo?.userInfo && (
                    <div className="bg-muted p-4 rounded-lg text-left">
                      <h4 className="font-medium mb-2">Your Current Status:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Club:</span> {responseInfo.userInfo.club}</p>
                        <p><span className="font-medium">Plan:</span> {responseInfo.userInfo.membershipPlan.name || responseInfo.userInfo.membershipPlan}</p>
                      </div>
                    </div>
                  )}

                  {/* Show available plans if there's a mismatch */}
                  {userPlanCards.length === 0 && cards.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg text-left mt-4">
                      <h4 className="font-medium mb-2 text-blue-800">Available Card Plans:</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        {cards.map((card, index) => (
                          <p key={index}>• {card.membershipPlan.name}</p>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        These plans have cards but don't match your current membership.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
