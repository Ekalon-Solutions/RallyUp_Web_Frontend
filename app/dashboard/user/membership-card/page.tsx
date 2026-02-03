"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Calendar,
  MapPin
} from "lucide-react"
import { MembershipCard } from "@/components/membership-card"
import { apiClient, PublicMembershipCardDisplay } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"


export default function UserMembershipCardPage() {
  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<PublicMembershipCardDisplay | null>(null)
  const [responseInfo, setResponseInfo] = useState<any>(null)
  const { user } = useAuth()
  const clubId = useSelectedClubId()
  const { toast } = useToast()

  const getUserName = () => {
    if (user?.name) {
      return user.name
    }
    
    if (user && typeof user === 'object') {
      const userAny = user as any
      if (userAny.first_name && userAny.last_name) {
        return `${userAny.first_name} ${userAny.last_name}`
      }
      if (userAny.first_name) {
        return userAny.first_name
      }
      if (userAny.last_name) {
        return userAny.last_name
      }
    }
    
    return 'Member'
  }
  
  const userName = getUserName()

  const displayCards = cards
  const displaySelectedCard = selectedCard
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)

        if (!clubId) {
          setCards([])
          setSelectedCard(null)
          setLoading(false)
          return
        }
        
        const response = await apiClient.getMyMembershipCards()
        
        if (response.success && response.data) {
          const cardsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data
          
          if (cardsData && Array.isArray(cardsData)) {
            const filtered = cardsData.filter((c: any) => String(c?.club?._id) === String(clubId))
            setCards(filtered)
            setResponseInfo(response)
            if (filtered.length > 0) {
              setSelectedCard(filtered[0])
            } else {
              setSelectedCard(null)
            }
          } else {
            setError('Invalid data structure received from server')
          }
        } else {
          const errorMessage = response.error || 'Failed to fetch membership cards';
          const errorDetails = response.errorDetails;
          
          setError(errorMessage);
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          if (errorDetails) {
          }
        }
        
        if (response.message) {
          toast({
            title: "Info",
            description: response.message,
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch membership cards';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [toast, clubId])

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

  if (loading) {
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

  if (error) {
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

  if (!clubId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Club Selected</p>
              <p className="text-sm mt-2 mb-4">Please select a club to view your membership card.</p>
              <Button onClick={() => (window.location.href = "/splash")}>Select Club</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const handleCreateMyCard = async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.createMyMembershipCard(clubId || undefined)
      
      if (response.success && response.data) {
        const newCards = [response.data].filter((c: any) => !clubId || String(c?.club?._id) === String(clubId))
        setCards(newCards)
        setSelectedCard(newCards[0] || null)
        toast({
          title: "Success",
          description: response.message || "Membership card created successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create membership card",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create membership card",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (cards.length === 0 && !loading) {
    
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Membership Cards Found</p>
              <p className="text-sm mt-2 mb-4">
                You don't have any membership cards for the selected club yet, but you can create one now!
              </p>
              
              <Button onClick={handleCreateMyCard} className="mb-6">
                <CreditCard className="w-4 h-4 mr-2" />
                Create My Membership Card
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Membership Card</h1>
              <p className="text-muted-foreground">View and manage your digital membership card</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Digital Membership Card
                  </CardTitle>
                  <CardDescription>
                    {displaySelectedCard ? 
                      `Your digital membership card for ${displaySelectedCard.club?.name || 'Unknown Club'}` : 
                      'Select a membership card to view'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displaySelectedCard && displaySelectedCard.card ? (
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm membership-card">
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
                      <p>No card selected or card data is incomplete</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {displaySelectedCard && displaySelectedCard.card && (
              <div className="space-y-6">
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
                        <span>{displaySelectedCard.club?.name || 'Unknown Club'}</span>
                      </div>

                      {displaySelectedCard.club?.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span>{displaySelectedCard.club.location}</span>
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

          {displayCards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Cards</CardTitle>
                <CardDescription>
                  You have {displayCards.length} membership card{displayCards.length > 1 ? 's' : ''} for the selected club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayCards.map((card) => (
                    <div 
                      key={card.card._id} 
                      className={`border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer ${
                        selectedCard?.card._id === card.card._id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{card.club?.name || 'Unknown Club'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{card.card.cardStyle} style</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium">{card.membershipPlan.name}</span>
                        </div>
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
                        variant={selectedCard?.card._id === card.card._id ? 'default' : 'outline'}
                        className="w-full mt-3"
                        onClick={() => setSelectedCard(card)}
                      >
                        {selectedCard?.card._id === card.card._id ? 'Viewing' : 'View Card'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayCards.length === 0 && !loading && (
            <Card>
              <CardHeader>
                <CardTitle>No Membership Cards</CardTitle>
                <CardDescription>
                  Your selected club hasn't created any membership cards yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">
                    No membership cards found
                  </p>
                  <p className="text-sm mb-4">
                    Contact your club administrator to create membership cards for your plans
                  </p>
                  
                  {responseInfo?.userInfo && (
                    <div className="bg-muted p-4 rounded-lg text-left">
                      <h4 className="font-medium mb-2">Your Current Status:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Club:</span> {responseInfo.userInfo.club}</p>
                        <p><span className="font-medium">Plan:</span> {responseInfo.userInfo.membershipPlan.name || responseInfo.userInfo.membershipPlan}</p>
                      </div>
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
