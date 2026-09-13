"use client"

import React, { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Edit, Eye, Plus, RefreshCw, Trash2 } from "lucide-react"
import { MembershipCard } from "@/components/membership-card"
import { MembershipCardEditor, CardEditorResult } from "@/components/admin/membership-card-editor"
import { apiClient, PublicMembershipCardDisplay, CreateMembershipCardRequest } from "@/lib/api"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { LockedFeaturePage } from "@/components/feature-gate"
import { MEMBERSHIP_CARD_PREVIEW_PROFILE_PICTURE } from "@/lib/membershipCardProfile"
import {
  CARD_STYLE_COLORS,
  CARD_STYLE_OPTIONS,
  CardStyleKey,
  normalizeCardCustomization,
} from "@/lib/membershipCardFields"

function MembershipCardsPage() {
  const { activeClubId } = useAuth()
  const { config: clubFeatureConfig } = useClubFeatures(activeClubId ?? null)
  const searchParams = useSearchParams()

  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [newCardStyle, setNewCardStyle] = useState<CardStyleKey>("default")
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState<PublicMembershipCardDisplay | null>(null)
  const effectiveClubId = activeClubId ?? null

  const fetchCards = useCallback(async (targetClubId: string) => {
    try {
      const cardsResponse = await apiClient.getClubMembershipCards(targetClubId, { isTemplate: true, limit: 100 })
      if (cardsResponse.success && cardsResponse.data) {
        let cardsData: any[] = []
        if (Array.isArray(cardsResponse.data)) {
          cardsData = cardsResponse.data
        } else if (cardsResponse.data.data && Array.isArray(cardsResponse.data.data)) {
          cardsData = cardsResponse.data.data
        }

        const validCards = cardsData.filter((item: any) =>
          item &&
          item.card &&
          item.card._id &&
          typeof item.card._id === 'string' &&
          item.card.cardStyle &&
          item.club &&
          item.membershipPlan
        )

        setCards(validCards)
        setError(null)
      } else {
        const errorDetails = (cardsResponse as any).errorDetails || {}
        const errorMessage = cardsResponse.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (cardsResponse as any).statusCode || 'Unknown'
        setError(errorMessage)
        setCards([])
        toast.error("Error Loading Membership Cards", {
          description: `Failed to fetch membership cards for club (ID: ${targetClubId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your authentication and try again.`,
        })
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error or server unavailable'
      const errorDetails = err?.response?.data || {}
      const statusCode = err?.response?.status || 'Unknown'
      setError(errorMessage)
      setCards([])
      toast.error("Error Fetching Cards", {
        description: `Failed to fetch membership cards for club (ID: ${targetClubId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your connection and try again.`,
      })
    }
  }, [])

  const fetchPlans = useCallback(async (targetClubId: string) => {
    const plansResponse = await apiClient.getMembershipPlans(targetClubId)
    if (plansResponse.success && plansResponse.data) {
      const plansData = Array.isArray(plansResponse.data) ? plansResponse.data : ((plansResponse.data as any)?.data || [])
      setMembershipPlans(plansData)
      return plansData as any[]
    }
    setMembershipPlans([])
    return []
  }, [])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        setEditingCard(null)

        if (!activeClubId) {
          setError("No club selected. Please select a club to continue.")
          setLoading(false)
          return
        }

        const plansData = await fetchPlans(activeClubId)
        const urlPlanId = searchParams.get("planId")
        if (urlPlanId && plansData.some((p: any) => p._id === urlPlanId)) {
          setSelectedPlanId(urlPlanId)
        }

        await fetchCards(activeClubId)
      } catch (err: any) {
        const errorMessage = err?.message || 'Network error or server unavailable'
        const errorDetails = err?.response?.data || {}
        const statusCode = err?.response?.status || 'Unknown'
        setError(errorMessage)
        toast.error("Error Loading Initial Data", {
          description: `Failed to fetch initial data (club and membership cards): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your internet connection and try again.`,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [fetchCards, fetchPlans, activeClubId, searchParams])

  const handleCreateCard = async () => {
    if (!effectiveClubId || !selectedPlanId) {
      toast.error("Please select a membership plan")
      return
    }

    const planName = membershipPlans.find(p => p._id === selectedPlanId)?.name || 'Unknown Plan'

    try {
      setIsCreating(true)

      const styleColors = CARD_STYLE_COLORS[newCardStyle] ?? CARD_STYLE_COLORS.default
      const cardData: CreateMembershipCardRequest = {
        membershipPlanId: selectedPlanId,
        clubId: effectiveClubId,
        cardStyle: newCardStyle,
        accessLevel: 'basic',
        customization: normalizeCardCustomization({
          primaryColor: styleColors.primaryColor,
          secondaryColor: styleColors.secondaryColor,
        }),
      }

      const response = await apiClient.createMembershipCard(cardData)

      // API returns { success: true, data: { card, club, membershipPlan } }; client passes body as response.data
      const isSuccess = response?.success === true
      const raw = response?.data as { data?: { card?: unknown }; card?: unknown } | undefined
      const payload = raw?.data ?? raw
      const hasCreatedCard = !!(payload && (payload as { card?: unknown }).card)

      if (isSuccess || hasCreatedCard) {
        toast.success("Card created successfully", {
          description: `Membership card for plan "${planName}" has been created.`,
        })
        setSelectedPlanId("")
        if (effectiveClubId) {
          await fetchCards(effectiveClubId)
        }
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
        const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
        toast.error("Failed to Create Membership Card", {
          description: `Failed to create membership card for plan "${planName}" (Plan ID: ${selectedPlanId}): ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check the plan details and try again.`,
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      toast.error("Error Creating Membership Card", {
        description: `Failed to create membership card for plan "${planName}" (Plan ID: ${selectedPlanId}) due to: ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your connection and try again.`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    const cardToDelete = cards.find(c => c.card._id === cardId)
    const planName = cardToDelete?.membershipPlan?.name || 'Unknown Plan'
    const cardNumber = cardToDelete?.card?.cardNumber || 'Unknown'

    // Deleting a template card discards its whole design, and there is no undo.
    if (!window.confirm(`Delete the membership card for "${planName}"? This cannot be undone.`)) return

    try {
      const response = await apiClient.deleteMembershipCard(cardId)

      if (response.success) {
        setCards(prev => prev.filter(card => card.card._id !== cardId))
        if (editingCard?.card._id === cardId) setEditingCard(null)
        toast.success("Membership Card Deleted Successfully", {
          description: `Membership card for plan "${planName}" (Card number: ${cardNumber}) has been deleted successfully.`,
        })
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        throw new Error(`Failed to delete card: ${errorMessage} (Status: ${statusCode})`)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error or server unavailable'
      toast.error("Failed to Delete Membership Card", {
        description: `Failed to delete membership card for plan "${planName}" (Card ID: ${cardId}): ${errorMessage}. Please try again.`,
      })
    }
  }

  const handleRefresh = async () => {
    if (!effectiveClubId) return
    try {
      setLoading(true)
      await fetchPlans(effectiveClubId)
      await fetchCards(effectiveClubId)
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error or server unavailable'
      toast.error("Error Refreshing Data", {
        description: `Failed to refresh membership cards and plans for club (ID: ${effectiveClubId}) due to: ${errorMessage}. Please check your connection and try again.`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCard = (card: PublicMembershipCardDisplay) => {
    setEditingCard({
      ...card,
      card: {
        ...card.card,
        cardStyle: (card.card.cardStyle ?? "default") as CardStyleKey,
        customization: normalizeCardCustomization(card.card.customization),
      },
    })
  }

  const handleSaveEdit = async ({ cardStyle, customization }: CardEditorResult) => {
    if (!editingCard) return

    const planName = editingCard.membershipPlan?.name || 'Unknown Plan'
    const cardNumber = editingCard.card.cardNumber || 'Unknown'
    const updateData = { cardStyle, customization }

    const response = await apiClient.updateMembershipCard(editingCard.card._id, updateData)
    const updated = response.data

    if (!response.success) {
      const errorDetails = (response as any).errorDetails || {}
      const errorMessage = response.error || 'Unknown error occurred'
      const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
      const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
      throw new Error(`${errorMessage}.${validationMsg}`)
    }

    setCards(prev => prev.map(card => {
      if (card.card._id !== editingCard.card._id) return card
      if (updated?.card && updated?.membershipPlan) return updated
      return { ...card, card: { ...card.card, ...updateData } }
    }))

    toast.success("Membership Card Updated Successfully", {
      description: `Membership card "${cardNumber}" for plan "${planName}" has been updated successfully.`,
    })
    setEditingCard(null)
  }

  const getPreviewProfilePicture = (showUserProfile?: boolean) =>
    showUserProfile ? MEMBERSHIP_CARD_PREVIEW_PROFILE_PICTURE : undefined

  if (!isFeatureEnabled(clubFeatureConfig, 'membership')) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <LockedFeaturePage
            featureKey="membership"
            featureLabel="Membership Cards"
            clubId={activeClubId ?? ""}
            currentTier={clubFeatureConfig?.billing_tier}
          />
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const planIdsWithCards = cards.map(c => c.membershipPlan?._id).filter(Boolean)
  const selectedPlanHasCard = !!selectedPlanId && planIdsWithCards.includes(selectedPlanId)

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Membership Cards</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Create and customize membership cards for your plans</p>
            </div>
            {!editingCard && (
              <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 w-full sm:w-auto">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
          </div>

          {editingCard ? (
            <MembershipCardEditor
              key={editingCard.card._id}
              card={editingCard}
              onCancel={() => setEditingCard(null)}
              onSave={handleSaveEdit}
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>See how your membership cards will look with current settings</CardDescription>
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
                      <p className="text-sm">Create your first membership card to see a preview</p>
                      {membershipPlans.length > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-4">
                          Available plans: {membershipPlans.map(p => p.name).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-3 text-foreground">All Your Cards</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {cards.map((card) => (
                          <div key={card.card._id} className="space-y-2">
                            <MembershipCard
                              cardData={card}
                              cardStyle={card.card.cardStyle || 'default'}
                              showLogo={card.card.customization?.showLogo ?? true}
                              userName="John Doe"
                              membershipId={card.card.membershipId ?? 'Membership ID'}
                              profilePicture={getPreviewProfilePicture(card.card.customization?.showUserProfile)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditCard(card)}>
                                <Edit className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCard(card.card._id)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Membership Card
                  </CardTitle>
                  <CardDescription>Create a new membership card for a membership plan</CardDescription>
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
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> Each membership plan can only have one template card.
                          If you get an error saying "A template card already exists for this membership plan",
                          it means a card has already been created for that plan.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="planId">Membership Plan</Label>
                          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger id="planId">
                              <SelectValue placeholder="Select a Plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {membershipPlans.map((plan) => (
                                <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="createCardStyle">Card Style</Label>
                          <Select value={newCardStyle} onValueChange={(v) => setNewCardStyle(v as CardStyleKey)}>
                            <SelectTrigger id="createCardStyle">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARD_STYLE_OPTIONS.map((style) => (
                                <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {selectedPlanHasCard && (
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            This plan already has a membership card. Only one card can be created per plan.
                          </p>
                        )}
                        <Button
                          onClick={handleCreateCard}
                          disabled={!effectiveClubId || !selectedPlanId || isCreating || selectedPlanHasCard}
                        >
                          {isCreating ? "Creating..." : "Create Membership Card"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function MembershipCardsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <MembershipCardsPage />
    </Suspense>
  )
}
