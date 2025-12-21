"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Download, 
  Share2, 
  QrCode, 
  CreditCard, 
  Settings, 
  Eye,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Palette,
  Image
} from "lucide-react"
import { MembershipCard } from "@/components/membership-card"
import { MembershipCardCustomizer } from "@/components/admin/membership-card-customizer"
import { apiClient, PublicMembershipCardDisplay, CreateMembershipCardRequest } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function MembershipCardsPage() {
  const [customization, setCustomization] = useState({
    cardStyle: 'default' as const,
    showLogo: true,
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    fontFamily: 'Inter',
    logoSize: 'medium' as const
  })

  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null)
  const [customLogoFile, setCustomLogoFile] = useState<File | null>(null)
  const [clubId, setClubId] = useState<string | null>(null)
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState<PublicMembershipCardDisplay | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  // Utility function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Fetch user's club and membership plans
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        
        // Get user's club context
        const clubResponse = await apiClient.getAdminClub()
        if (clubResponse.success && clubResponse.data?.club?._id) {
          setClubId(clubResponse.data.club._id)
          
          // Fetch membership plans for this club
          const plansResponse = await apiClient.getMembershipPlans(clubResponse.data.club._id)
          if (plansResponse.success && plansResponse.data) {
            const plansData = Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data?.data || [])
            setMembershipPlans(plansData)
          }
          
                      // Fetch existing membership cards
            const cardsResponse = await apiClient.getClubMembershipCards(clubResponse.data.club._id)
            
            if (cardsResponse.success && cardsResponse.data) {
              // Handle both array and nested data structure
              let cardsData: any[] = []
              if (Array.isArray(cardsResponse.data)) {
                cardsData = cardsResponse.data
              } else if (cardsResponse.data.data && Array.isArray(cardsResponse.data.data)) {
                cardsData = cardsResponse.data.data
              }
              
              // console.log('Fetched membership cards:', cardsData)
              
              // Filter out any invalid cards - ensure card structure is valid
              const validCards = cardsData.filter(card => {
                // Skip API response wrappers that might have slipped through
                if (card && card.success && card.data) {
//                   console.warn('Found API response wrapper instead of card data:', card);
                  return false;
                }
                
                const isValid = card && 
                  card.card && 
                  card.card._id && 
                  typeof card.card._id === 'string' &&
                  card.card.cardStyle && // Ensure cardStyle exists
                  card.club && // Ensure club exists
                  card.membershipPlan; // Ensure membershipPlan exists
                
                if (!isValid) {
                  // // console.warn('Invalid card structure found:', card);
                }
                
                return isValid;
              })
              
              // console.log('Valid cards after filtering:', validCards)
              // console.log(`Filtered out ${cardsData.length - validCards.length} invalid cards`)
              
              if (validCards.length === 0 && cardsData.length > 0) {
//                 console.error('All cards were filtered out due to invalid structure. Raw data:', cardsData);
                toast({
                  title: "Warning",
                  description: "No valid membership cards found. Some cards may have invalid data structure.",
                  variant: "destructive",
                });
              }
              
              setCards(validCards)
            } else {
              // Handle API error response
              const errorMessage = cardsResponse.error || 'Failed to fetch membership cards';
              // // console.error('Membership cards API error:', cardsResponse);
              toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
              });
            }
        } else {
          setError('No club found for this user')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch initial data';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        // // console.error('Initial data fetch error:', err);
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [toast])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleCustomLogoChange = (file: File | null) => {
    if (file) {
      setCustomLogoFile(file)
      const url = URL.createObjectURL(file)
      setCustomLogoPreview(url)
    } else {
      setCustomLogoFile(null)
      setCustomLogoPreview(null)
    }
  }

  const handleRemoveCustomLogo = () => {
    setCustomLogoFile(null)
    setCustomLogoPreview(null)
    // Update the editing card to remove custom logo
    if (editingCard) {
      setEditingCard(prev => prev ? {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            customLogo: undefined
          }
        }
      } : null)
    }
  }

  const handleSaveCustomization = async () => {
    try {
      // Save customization settings to backend
      toast({
        title: "Success",
        description: "Card customization saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive",
      })
    }
  }

  const handleExportCards = async () => {
    try {
      // Export cards functionality
      toast({
        title: "Success",
        description: "Cards exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export cards",
        variant: "destructive",
      })
    }
  }

  const handleCreateCard = async () => {
    if (!clubId || !selectedPlanId) {
      toast({
        title: "Error",
        description: "Please select a membership plan",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      
      // Create new membership card for the plan
      const cardData: CreateMembershipCardRequest = {
        membershipPlanId: selectedPlanId,
        clubId: clubId,
        cardStyle: 'default', // Always use default style for new cards
        accessLevel: 'basic',
        customization: {
          primaryColor: customization.primaryColor,
          secondaryColor: customization.secondaryColor,
          fontFamily: customization.fontFamily,
          logoSize: customization.logoSize,
          showLogo: customization.showLogo,
          customLogo: previewUrl || undefined
        }
      }

      const response = await apiClient.createMembershipCard(cardData)
      
      if (response.success && response.data) {
        // The API returns { success, data: { card, club, membershipPlan } }
        // So response.data is already the correct structure
        const newCard = response.data;
        
        // Validate the card structure before adding
        if (newCard && newCard.card && newCard.club && newCard.membershipPlan) {
          setCards(prev => [newCard, ...prev])
          
          toast({
            title: "Card created",
            description: "Membership card created successfully",
          })
          
          setSelectedPlanId("")
          setPreviewUrl(null)
          setSelectedFile(null)
        } else {
          // // console.error('Invalid card structure received:', newCard);
          toast({
            title: "Error",
            description: "Received invalid card structure from server",
            variant: "destructive",
          })
        }
      } else {
        // Show the specific error from the backend
        toast({
          title: "Error",
          description: response.error || 'Failed to create membership card',
          variant: "destructive",
        })
        return
      }
    } catch (error) {
      // console.error('Error creating membership card:', error)
      toast({
        title: "Error",
        description: "Failed to create membership card",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await apiClient.deleteMembershipCard(cardId)
      
      if (response.success) {
        setCards(prev => prev.filter(card => card.card._id !== cardId))
        toast({
          title: "Success",
          description: "Membership card deleted successfully",
        })
      } else {
        throw new Error(response.error || 'Failed to delete card')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete membership card",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    if (clubId) {
      try {
        setLoading(true)
        
        // Fetch membership plans for this club
        const plansResponse = await apiClient.getMembershipPlans(clubId)
        if (plansResponse.success && plansResponse.data) {
          const plansData = Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data?.data || [])
          setMembershipPlans(plansData)
        }
        
        // Fetch existing membership cards
        const cardsResponse = await apiClient.getClubMembershipCards(clubId)
        
        if (cardsResponse.success && cardsResponse.data) {
          // Handle both array and nested data structure
          let cardsData: any[] = []
          if (Array.isArray(cardsResponse.data)) {
            cardsData = cardsResponse.data
          } else if (cardsResponse.data.data && Array.isArray(cardsResponse.data.data)) {
            cardsData = cardsResponse.data.data
          }
          
          // Filter out any invalid cards - ensure card structure is valid
          const validCards = cardsData.filter(card => 
            card && 
            card.card && 
            card.card._id && 
            typeof card.card._id === 'string' &&
            card.card.cardStyle && // Ensure cardStyle exists
            card.club && // Ensure club exists
            card.membershipPlan // Ensure membershipPlan exists
          )
          
          setCards(validCards)
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to refresh data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRegenerateQR = async (cardId: string) => {
    try {
      const response = await apiClient.regenerateQRCode(cardId)
      
      if (response.success) {
        // Update the card in the list with new QR code
        setCards(prev => prev.map(card => 
          card.card._id === cardId 
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

  const handleEditCard = (card: PublicMembershipCardDisplay) => {
    setEditingCard(card);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    try {
      setIsEditing(true);
      
      // Handle custom logo upload if there's a new logo file
      let customLogoUrl = editingCard.card.customization?.customLogo;
      
      if (customLogoFile) {
        try {
          // Convert file to base64 for local storage
          const base64 = await convertFileToBase64(customLogoFile!);
          customLogoUrl = base64;
          
          // Update the editing card with the new logo
          setEditingCard(prev => prev ? {
            ...prev,
            card: {
              ...prev.card,
              customization: {
                ...prev.card.customization,
                customLogo: customLogoUrl
              }
            }
          } : null);
        } catch (error) {
          // // console.error('Error converting logo to base64:', error);
          toast({
            title: "Error",
            description: "Failed to process logo file",
            variant: "destructive",
          });
          return;
        }
      }
      
      const updateData = {
        status: editingCard.card.status,
        accessLevel: editingCard.card.accessLevel,
        customization: {
          ...editingCard.card.customization,
          customLogo: customLogoUrl
        }
      };

      const response = await apiClient.updateMembershipCard(editingCard.card._id, updateData);
      
      if (response.success && response.data) {
        // Debug: Log the response structure
        // // console.log('Update response:', response);
        // // console.log('Response data:', response.data);
        
        // Update the card in the list with the new data
        setCards(prev => prev.map(card => {
          if (card.card._id === editingCard.card._id) {
            // If the response has the full card structure, use it
            if (response.data.card && response.data.membershipPlan) {
              return response.data;
            }
            // Otherwise, merge the updated fields with the existing card
            return {
              ...card,
              card: {
                ...card.card,
                ...updateData
              }
            };
          }
          return card;
        }));
        
        toast({
          title: "Success",
          description: "Membership card updated successfully",
        });
        
        setEditingCard(null); // Close modal
      } else {
        throw new Error(response.error || 'Failed to update card');
      }
    } catch (error) {
      // // console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update membership card",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setCustomLogoFile(null);
    setCustomLogoPreview(null);
  };

  // Memoized handlers to prevent infinite loops
  const handlePrimaryColorChange = useCallback((newColor: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            primaryColor: newColor
          }
        }
      };
    });
  }, []);

  const handleSecondaryColorChange = useCallback((newColor: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            secondaryColor: newColor
          }
        }
      };
    });
  }, []);



  const handleStatusChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: { ...prev.card, status: value }
      };
    });
  }, []);

  const handleAccessLevelChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: { ...prev.card, accessLevel: value }
      };
    });
  }, []);

  const handleFontFamilyChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            fontFamily: value
          }
        }
      };
    });
  }, []);

  const handleLogoSizeChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            logoSize: value
          }
        }
      };
    });
  }, []);

  const handleShowLogoChange = useCallback((checked: boolean) => {
    setEditingCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...prev.card.customization,
            showLogo: checked
          }
        }
      };
    });
  }, []);

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Membership Cards</h1>
              <p className="text-muted-foreground">Create and customize membership cards for your plans</p>
            </div>
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="preview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="create">Create Card</TabsTrigger>
              <TabsTrigger value="customize">Customize Default Card</TabsTrigger>
              <TabsTrigger value="manage">Manage Cards</TabsTrigger>
              {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
            </TabsList>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    {editingCard ? 
                      `Previewing edits for ${editingCard.membershipPlan?.name || 'Unknown Plan'} card` : 
                      "See how your membership cards will look with current settings"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cards.length > 0 ? (
                    <div className="space-y-6">
                      {/* Currently Editing Card Preview */}
                      {editingCard && (
                        <div className="text-center">
                          <h4 className="font-medium mb-3 text-foreground">Currently Editing</h4>
                          <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                              <MembershipCard
                                cardData={editingCard}
                                cardStyle={editingCard.card.cardStyle}
                                showLogo={editingCard.card.customization?.showLogo ?? true}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* All Created Cards */}
                      <div>
                        <h4 className="font-medium mb-3 text-foreground">All Your Cards</h4>
                        {cards.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No valid membership cards found</p>
                            <p className="text-sm">Create your first membership card to see a preview</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cards.map((card, index) => (
                              <div key={card?.card?._id || index} className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">{card?.membershipPlan?.name || 'Unknown Plan'}</p>
                                <div className="flex justify-center">
                                  <MembershipCard
                                    cardData={card}
                                    cardStyle={card?.card?.cardStyle || 'default'}
                                    showLogo={card?.card?.customization?.showLogo ?? true}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No membership cards found</p>
                      <p className="text-sm">Create your first membership card to see a preview</p>
                      {membershipPlans.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Available plans: {membershipPlans.map(p => p.name).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Go to the "Create Card" tab to create a membership card for one of these plans
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preset Catalog */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Preset Card Styles</CardTitle>
                  <CardDescription>
                    Preview different card style variations with your customization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(['default', 'premium', 'vintage', 'modern'] as const).map((style) => (
                        <div key={style} className="text-center">
                          <h4 className="font-medium mb-3 text-foreground capitalize">{style}</h4>
                          <div className="flex justify-center">
                            <MembershipCard
                              cardData={cards[0]}
                              cardStyle={style}
                              showLogo={cards[0]?.card?.customization?.showLogo ?? customization.showLogo}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Create a card first to see style variations</p>
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-4" />
                    Create New Membership Card
                  </CardTitle>
                  <CardDescription>
                    Create a new membership card for a membership plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {membershipPlans.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No membership plans found</p>
                      <p className="text-sm">Create membership plans first</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> Each membership plan can only have one template card. 
                          If you get an error saying "A template card already exists for this membership plan", 
                          it means a card has already been created for that plan.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planId">Membership Plan</Label>
                        <Select
                          value={selectedPlanId}
                          onValueChange={setSelectedPlanId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {membershipPlans.map((plan) => (
                              <SelectItem key={plan._id} value={plan._id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>


                    </div>
                    </>
                  )}

                  {membershipPlans.length > 0 && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleCreateCard} 
                        disabled={!clubId || !selectedPlanId || isCreating}
                      >
                        {isCreating ? "Creating..." : "Create Membership Card"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              <MembershipCardCustomizer 
                clubId={clubId || undefined}
                onSave={() => {
                  // Refresh cards after saving customization  
                  window.location.reload();
                }} 
              />
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Membership Cards</CardTitle>
                  <CardDescription>
                    View, edit, and manage all membership cards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="text-center text-red-500 py-8">
                      <p>{error}</p>
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No membership cards found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {cards.map((card) => {
                          // Debug: Log the card structure
                          // // console.log('Card structure:', card);
                          
                          // Check if card has the expected structure
                          if (!card || !card.card) {
                            // // console.error('Invalid card structure:', card);
                            return null; // Skip invalid cards
                          }
                          
                          return (
                            <div key={card.card._id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{card.membershipPlan?.name || 'No Plan Name'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {card.card.cardNumber}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant={card.card.status === 'active' ? 'default' : 'secondary'}>
                                      {card.card.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Expires: {new Date(card.card.expiryDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegenerateQR(card.card._id)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditCard(card)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteCard(card.card._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        }).filter(Boolean)}
                      </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export & Share</CardTitle>
                  <CardDescription>
                    Export cards and configure sharing settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button onClick={handleExportCards} className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export All Cards
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent> */}
          </Tabs>
        </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 p-6 pb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit Membership Card</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-0 overflow-y-auto flex-1">
              {/* Left Column - Input Fields */}
              <div className="space-y-4">


              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingCard.card.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select
                  value={editingCard.card.accessLevel}
                  onValueChange={handleAccessLevelChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryColor">Secondary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={editingCard.card.customization?.primaryColor || '#3b82f6'}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="h-10 w-full"
                />
              </div>

              <div>
                <Label htmlFor="secondaryColor">Primary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={editingCard.card.customization?.secondaryColor || '#1e40af'}
                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                  className="h-10 w-full"
                />
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={editingCard.card.customization?.fontFamily || 'Inter'}
                  onValueChange={handleFontFamilyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="logoSize">Logo Size</Label>
                <Select
                  value={editingCard.card.customization?.logoSize || 'medium'}
                  onValueChange={handleLogoSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showLogo"
                  checked={editingCard.card.customization?.showLogo || true}
                  onCheckedChange={handleShowLogoChange}
                />
                <Label htmlFor="showLogo">Show Club Logo</Label>
              </div>

              {/* Custom Logo Upload */}
              <div>
                <Label htmlFor="customLogo">Custom Logo</Label>
                <div className="mt-2 space-y-3">
                  <Input
                    id="customLogo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCustomLogoChange(e.target.files?.[0] ?? null)}
                    className="mt-2"
                  />
                  
                  {/* Current Logo Display */}
                  {editingCard.card.customization?.customLogo && (
                    <div className="mt-3">
                      <Label className="text-sm text-muted-foreground">Current Logo</Label>
                      <div className="mt-2 flex items-center space-x-3">
                        <img
                          src={editingCard.card.customization.customLogo}
                          alt="Current custom logo"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCustomLogo}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Logo Preview */}
                  {customLogoPreview && (
                    <div className="mt-3">
                      <Label className="text-sm text-muted-foreground">New Logo Preview</Label>
                      <div className="mt-2">
                        <img
                          src={customLogoPreview}
                          alt="New logo preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* Right Column - Preview */}
              <div className="lg:sticky lg:top-0 lg:self-start">
                <div className="border rounded-lg p-6 bg-muted/20">
                  <Label className="text-sm font-medium mb-4 block">Live Preview</Label>
                  <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                      <MembershipCard
                        cardData={editingCard}
                        cardStyle={editingCard.card.cardStyle}
                        showLogo={editingCard.card.customization?.showLogo ?? true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6 p-6 pt-4 border-t bg-muted/20">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
