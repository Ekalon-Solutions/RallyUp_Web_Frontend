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
import { apiClient, PublicMembershipCardDisplay, User, Admin } from "@/lib/api"
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
  const [membershipId, setMembershipId] = useState<string | null>(null)
  const [membershipIdLoading, setMembershipIdLoading] = useState(false)
  const [membershipIdError, setMembershipIdError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { user } = useAuth() // Get user from auth context
  const { toast } = useToast()

  // Get user's name from auth context - try multiple sources
  const getUserName = () => {
    // Try to get name from different possible sources
    if (user?.name) {
      return user.name
    }
    
    // Check if we have first_name and last_name
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

  // Show all cards from all clubs the user is a member of
  const displayCards = cards;
  const displaySelectedCard = selectedCard;

  // Fetch membership ID for the user
  const fetchMembershipId = async () => {
    if (!user?._id) return;
    
    try {
      setMembershipIdLoading(true)
      setMembershipIdError(null)
      // Get the user's active club membership
      // Only User and Admin have memberships, SystemOwner doesn't
      if (user.role === 'system_owner') return;
      
      const userMemberships = (user as User | Admin).memberships || [];
      const activeMembership = userMemberships.find((m: any) => m.status === 'active');
      
      if (activeMembership?.club_id?._id) {
        const response = await apiClient.getUserMembershipId(user._id, activeMembership.club_id._id);
        
        if (response.success && response.data) {
          // Handle double-wrapped response: API client wraps backend response
          // Backend: { success: true, data: { membershipId: "..." } }
          // API Client: { success: true, data: { success: true, data: { membershipId: "..." } } }
          let membershipData: any = response.data;
          
          // Extract the actual data from the double-wrapped response
          if (membershipData.success && membershipData.data) {
            membershipData = membershipData.data;
          }
          
          // Try to find membershipId in various possible locations
          let finalMembershipId = membershipData.membershipId;
          if (!finalMembershipId && membershipData.data && membershipData.data.membershipId) {
            finalMembershipId = membershipData.data.membershipId;
          }
          
          if (finalMembershipId) {
            setMembershipId(finalMembershipId);
          } else {
            throw new Error('Membership ID not found in response');
          }
        } else {
          throw new Error(response.error || 'Failed to fetch membership ID');
        }
      } else {
        throw new Error('No active club membership found for the user.');
      }
    } catch (error) {
      console.error('Error fetching membership ID:', error);
      setMembershipIdError(error instanceof Error ? error.message : String(error));
    } finally {
      setMembershipIdLoading(false);
    }
  };

  // Fetch user's membership cards - MUST be before any conditional returns
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)
        
        // Use getMyMembershipCards to get cards from ALL clubs the user is a member of
        const response = await apiClient.getMyMembershipCards()
        
        if (response.success && response.data) {
          // Check if data is nested (backend sends { success: true, data: result.data })
          const cardsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data
          
          if (cardsData && Array.isArray(cardsData)) {
            setCards(cardsData)
            setResponseInfo(response)
            if (cardsData.length > 0) {
              setSelectedCard(cardsData[0])
            }
          } else {
            setError('Invalid data structure received from server')
          }
        } else {
          // Enhanced error handling with detailed information
          const errorMessage = response.error || 'Failed to fetch membership cards';
          const errorDetails = response.errorDetails;
          
          setError(errorMessage);
          
          // Show detailed error information in toast
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Log detailed error information for debugging
          if (errorDetails) {
            console.error('Membership cards API error details:', errorDetails);
          }
        }
        
        // Handle helpful messages from backend
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
        console.error('Membership cards fetch error:', err);
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [toast])

  // Fetch membership ID when user data is available
  useEffect(() => {
    if (user?._id) {
      fetchMembershipId();
    }
  }, [user]);

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
    if (!displaySelectedCard) {
      toast({
        title: "Error",
        description: "No card selected for download",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDownloading(true)
      
      // Show loading toast
      toast({
        title: "Processing",
        description: "Preparing your membership card for download...",
      })

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      // Find the MembershipCard component div
      const cardElement = document.querySelector('.w-full.max-w-sm')
      
      if (!cardElement) {
        throw new Error('Card element not found. Please refresh the page and try again.')
      }

      // Small delay to ensure content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      // Convert the card to canvas with proper settings
      const canvas = await html2canvas(cardElement as HTMLElement, {
        backgroundColor: null,
        scale: 3, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Remove any size constraints to capture full content
        width: 400,
        height: 350
      })

      // Convert canvas to blob
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          throw new Error('Failed to create image blob')
        }

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${userName}_membership_card_${displaySelectedCard.club?.name || 'club'}.png`
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        URL.revokeObjectURL(url)
        
        toast({
          title: "Success",
          description: "Membership card downloaded successfully!",
        })
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: "Failed to download membership card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share && selectedCard) {
        await navigator.share({
          title: `${selectedCard.club?.name || 'Unknown Club'} Membership Card`,
          text: `My membership card for ${selectedCard.club?.name || 'Unknown Club'}`,
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

  // Debug: Show raw data for troubleshooting
  if (cards.length > 0) {
  }

  // Show loading state while fetching
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

  // Show error state if there's an error
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

  // Handler functions
  const handleCreateMyCard = async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.createMyMembershipCard()
      
      if (response.success && response.data) {
        setCards([response.data])
        setSelectedCard(response.data)
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

  const handleFixMyCard = async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.fixMyMembershipCard()
      
      if (response.success && response.data) {
        setCards([response.data])
        setSelectedCard(response.data)
        toast({
          title: "Success",
          description: response.message || "Membership card fixed successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fix membership card",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fix membership card",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show empty state if no cards found
  if (cards.length === 0 && !loading) {
    
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Membership Cards Found</p>
              <p className="text-sm mt-2 mb-4">
                You don't have any membership cards yet, but you can create one now!
              </p>
              
              <Button onClick={handleCreateMyCard} className="mb-6">
                <CreditCard className="w-4 h-4 mr-2" />
                Create My Membership Card
              </Button>
              <Button onClick={handleFixMyCard} variant="outline" className="mb-6 ml-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix My Membership Card
              </Button>
              
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
              <Button variant="outline" onClick={handleFixMyCard}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix Card
              </Button>
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
                          membershipId={membershipId} // Pass the fetched membership ID
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

            {/* Card Actions & Info */}
            {displaySelectedCard && displaySelectedCard.card && (
              <div className="space-y-6">
                {/* Quick Actions */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={handleDownload} 
                      disabled={isDownloading}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isDownloading ? "Processing..." : "Download Card"}
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Card
                    </Button>
                  </CardContent>
                </Card> */}

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
          {/* {displayCards.length > 1 && (
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
          )} */}

          {/* No Cards Message */}
          {displayCards.length === 0 && !loading && (
            <Card>
              <CardHeader>
                <CardTitle>No Membership Cards</CardTitle>
                <CardDescription>
                  Your club hasn't created any membership cards yet
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
