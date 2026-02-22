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
  Image,
} from "lucide-react"
import { MembershipCard } from "@/components/membership-card"
import { MembershipCardCustomizer } from "@/components/admin/membership-card-customizer"
import { apiClient, PublicMembershipCardDisplay, CreateMembershipCardRequest } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getBaseUrl, getApiUrl } from "@/lib/config"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"


export default function MembershipCardsPage() {
  const CARD_STYLE_COLORS: Record<
    "default" | "premium" | "vintage" | "modern" | "elite" | "emerald",
    { primaryColor: string; secondaryColor: string }
  > =
    { default: { primaryColor: '#2563eb', secondaryColor: '#1e40af' },
      premium: { primaryColor: '#fbbf24', secondaryColor: '#dc2626' },
      vintage: { primaryColor: '#b45309', secondaryColor: '#7c2d12' },
      modern: { primaryColor: '#1e293b', secondaryColor: '#581c87' },
      elite: { primaryColor: '#111827', secondaryColor: '#000000' },
      emerald: { primaryColor: '#10b981', secondaryColor: '#0d9488' }
    }

  const FONT_FAMILIES = [
    { label: "Inter", value: "Inter" },
    { label: "Roboto", value: "Roboto" },
    { label: "Open Sans", value: "Open Sans" },
    { label: "Montserrat", value: "Montserrat" },
  ];

  const { activeClubId } = useAuth()
  const [customization, setCustomization] = useState<{
    cardStyle: 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald';
    showLogo: boolean;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoSize: 'small' | 'medium' | 'large';
  }>({
    cardStyle: 'default',
    showLogo: true,
    primaryColor: CARD_STYLE_COLORS['default'].primaryColor,
    secondaryColor: CARD_STYLE_COLORS['default'].secondaryColor,
    fontFamily: 'Inter',
    logoSize: 'medium'
  })

  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null)
  const [customLogoFile, setCustomLogoFile] = useState<File | null>(null)
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const effectiveClubId = activeClubId ?? null
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState<PublicMembershipCardDisplay | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const normalizeCustomization = (
    value?: Partial<NonNullable<PublicMembershipCardDisplay["card"]["customization"]>>
  ): NonNullable<PublicMembershipCardDisplay["card"]["customization"]> => ({
    primaryColor: value?.primaryColor ?? CARD_STYLE_COLORS.default.primaryColor,
    secondaryColor: value?.secondaryColor ?? CARD_STYLE_COLORS.default.secondaryColor,
    fontFamily: value?.fontFamily ?? "Inter",
    logoSize: value?.logoSize ?? "medium",
    showLogo: value?.showLogo ?? true,
    ...(value?.customLogo ? { customLogo: value.customLogo } : {}),
  })

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
      } else {
        const errorDetails = (cardsResponse as any).errorDetails || {}
        const errorMessage = cardsResponse.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (cardsResponse as any).statusCode || 'Unknown'
        setError(errorMessage)
        toast({
          title: "Error Loading Membership Cards",
          description: `Failed to fetch membership cards for club (ID: ${targetClubId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your authentication and try again.`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error or server unavailable'
      const errorDetails = err?.response?.data || {}
      const statusCode = err?.response?.status || 'Unknown'
      setError(errorMessage)
      toast({
        title: "Error Fetching Cards",
        description: `Failed to fetch membership cards for club (ID: ${targetClubId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your connection and try again.`,
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        let currentClubId = activeClubId

        if (!currentClubId) {
          setError("No club selected. Please select a club to continue.")
          setLoading(false)
          return
        }

        // Fetch membership plans for selected club
        const plansResponse = await apiClient.getMembershipPlans(currentClubId)
        if (plansResponse.success && plansResponse.data) {
          const plansData = Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data?.data || [])
          setMembershipPlans(plansData)
        } else {
          setMembershipPlans([])
        }
        // Fetch cards
        await fetchCards(currentClubId)
      } catch (err: any) {
        const errorMessage = err?.message || 'Network error or server unavailable'
        const errorDetails = err?.response?.data || {}
        const statusCode = err?.response?.status || 'Unknown'
        setError(errorMessage)
        toast({
          title: "Error Loading Initial Data",
          description: `Failed to fetch initial data (club and membership cards): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your internet connection and try again.`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [toast, fetchCards, activeClubId])

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
    if (!effectiveClubId || !selectedPlanId) {
      toast({
        title: "Error",
        description: "Please select a membership plan",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)

      let customLogoUrl: string | undefined
      if (selectedFile) {
        const formData = new FormData()
        formData.append('image', selectedFile)
        const uploadResponse = await fetch(getApiUrl('/upload/logo'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        })
        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errData?.message || 'Logo upload failed')
        }
        const uploadData = await uploadResponse.json()
        customLogoUrl = uploadData.url?.startsWith('http') ? uploadData.url : `${getBaseUrl()}${uploadData.url || ''}`
      }

      const cardData: CreateMembershipCardRequest = {
        membershipPlanId: selectedPlanId,
        clubId: effectiveClubId,
        cardStyle: customization.cardStyle,
        accessLevel: 'basic',
        customization: {
          primaryColor: customization.primaryColor,
          secondaryColor: customization.secondaryColor,
          fontFamily: customization.fontFamily,
          logoSize: customization.logoSize,
          showLogo: customization.showLogo,
          customLogo: customLogoUrl
        }
      }

      const planName = membershipPlans.find(p => p._id === selectedPlanId)?.name || 'Unknown Plan'

      const response = await apiClient.createMembershipCard(cardData)

      if (response.success && response.data) {
        toast({
          title: "Membership Card Created Successfully",
          description: `Membership card for plan "${planName}" has been created successfully. Refreshing card list...`,
        })

        setSelectedPlanId("")
        setPreviewUrl(null)
        setSelectedFile(null)

        if (effectiveClubId) {
          await fetchCards(effectiveClubId)
        }
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
        const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
        toast({
          title: "Failed to Create Membership Card",
          description: `Failed to create membership card for plan "${planName}" (Plan ID: ${selectedPlanId}): ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check the plan details and try again.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const planName = membershipPlans.find(p => p._id === selectedPlanId)?.name || 'Unknown Plan'
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      const validationErrors = errorDetails.errors || []
      const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
      toast({
        title: "Error Creating Membership Card",
        description: `Failed to create membership card for plan "${planName}" (Plan ID: ${selectedPlanId}) due to: ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your connection and try again.`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const cardToDelete = cards.find(c => c.card._id === cardId)
      const planName = cardToDelete?.membershipPlan?.name || 'Unknown Plan'
      const cardNumber = cardToDelete?.card?.cardNumber || 'Unknown'

      const response = await apiClient.deleteMembershipCard(cardId)

      if (response.success) {
        setCards(prev => prev.filter(card => card.card._id !== cardId))
        toast({
          title: "Membership Card Deleted Successfully",
          description: `Membership card for plan "${planName}" (Card number: ${cardNumber}) has been deleted successfully. The card is no longer available.`,
        })
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        throw new Error(`Failed to delete card: ${errorMessage} (Status: ${statusCode})`)
      }
    } catch (error: any) {
      const cardToDelete = cards.find(c => c.card._id === cardId)
      const planName = cardToDelete?.membershipPlan?.name || 'Unknown Plan'
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      toast({
        title: "Failed to Delete Membership Card",
        description: `Failed to delete membership card for plan "${planName}" (Card ID: ${cardId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    if (!effectiveClubId) return
    try {
      setLoading(true)
      const plansResponse = await apiClient.getMembershipPlans(effectiveClubId)
      if (plansResponse.success && plansResponse.data) {
        const plansData = Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data?.data || [])
        setMembershipPlans(plansData)
      }

      const cardsResponse = await apiClient.getClubMembershipCards(effectiveClubId, { isTemplate: true, limit: 100 })
      if (cardsResponse.success && cardsResponse.data) {
        let cardsData: any[] = []
        if (Array.isArray(cardsResponse.data)) {
          cardsData = cardsResponse.data
        } else if (cardsResponse.data.data && Array.isArray(cardsResponse.data.data)) {
          cardsData = cardsResponse.data.data
        }

        const validCards = cardsData.filter(card =>
          card &&
          card.card &&
          card.card._id &&
          typeof card.card._id === 'string' &&
          card.card.cardStyle &&
          card.club &&
          card.membershipPlan
        )

        setCards(validCards)
      } else {
        const errorDetails = (cardsResponse as any).errorDetails || {}
        const errorMessage = cardsResponse.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (cardsResponse as any).statusCode || 'Unknown'
        toast({
          title: "Error Refreshing Membership Cards",
          description: `Failed to refresh membership cards for club (ID: ${effectiveClubId}): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please try again.`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error or server unavailable'
      const errorDetails = err?.response?.data || {}
      const statusCode = err?.response?.status || 'Unknown'
      toast({
        title: "Error Refreshing Data",
        description: `Failed to refresh membership cards and plans for club (ID: ${effectiveClubId || 'Unknown'}) due to: ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your connection and try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateQR = async (cardId: string) => {
    try {
      const cardToUpdate = cards.find(c => c.card._id === cardId)
      const planName = cardToUpdate?.membershipPlan?.name || 'Unknown Plan'
      const cardNumber = cardToUpdate?.card?.cardNumber || 'Unknown'

      const response = await apiClient.regenerateQRCode(cardId)

      if (response.success) {
        setCards(prev => prev.map(card =>
          card.card._id === cardId
            ? { ...card, card: { ...card.card, qrCode: response.data?.qrCode } }
            : card
        ))
        toast({
          title: "QR Code Regenerated Successfully",
          description: `QR code for membership card "${cardNumber}" (Plan: "${planName}") has been regenerated successfully. The new QR code is now active.`,
        })
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        throw new Error(`Failed to regenerate QR code: ${errorMessage} (Status: ${statusCode})`)
      }
    } catch (error: any) {
      const cardToUpdate = cards.find(c => c.card._id === cardId)
      const planName = cardToUpdate?.membershipPlan?.name || 'Unknown Plan'
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      toast({
        title: "Failed to Regenerate QR Code",
        description: `Failed to regenerate QR code for membership card (Card ID: ${cardId}, Plan: "${planName}"): ${errorMessage}. Status: ${statusCode}. ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleEditCard = (card: PublicMembershipCardDisplay) => {
    const fallbackStyleColors = CARD_STYLE_COLORS[card.card.cardStyle] || CARD_STYLE_COLORS.default;
    const cardCopy = {
      ...card,
      card: {
        ...card.card,
        customization: card.card.customization ? {
          ...card.card.customization
        } : {
          primaryColor: fallbackStyleColors.primaryColor,
          secondaryColor: fallbackStyleColors.secondaryColor,
          fontFamily: 'Inter',
          logoSize: 'medium' as const,
          showLogo: true
        }
      }
    };
    setCustomLogoFile(null);
    setCustomLogoPreview(null);
    setEditingCard(cardCopy);
  }

  const handleSaveEdit = async () => {
    if (!editingCard) return

    try {
      setIsEditing(true)

      let customLogoUrl = editingCard.card.customization?.customLogo

      if (customLogoFile) {
        try {
          const formData = new FormData()
          formData.append('image', customLogoFile)

          const uploadResponse = await fetch(getApiUrl('/upload/logo'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          })

          if (!uploadResponse.ok) {
            throw new Error('Upload failed')
          }

          const uploadData = await uploadResponse.json()
          customLogoUrl = uploadData.url?.startsWith('http') ? uploadData.url : `${getBaseUrl()}${uploadData.url}`

          setEditingCard(prev => prev ? {
            ...prev,
            card: {
              ...prev.card,
              customization: {
                ...prev.card.customization,
                customLogo: customLogoUrl
              }
            }
          } : null)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload logo file",
            variant: "destructive",
          })
          return
        }
      }

      const updatedCustomization = {
        ...editingCard.card.customization,
        customLogo: customLogoUrl,
      };

      // fontFamily fix: Ensure the font from select is saved
      if (!updatedCustomization.fontFamily) {
        updatedCustomization.fontFamily = "Inter";
      }

      const updateData = {
        status: editingCard.card.status,
        accessLevel: editingCard.card.accessLevel,
        cardStyle: editingCard.card.cardStyle,
        customization: updatedCustomization
      }

      const planName = editingCard.membershipPlan?.name || 'Unknown Plan'
      const cardNumber = editingCard.card.cardNumber || 'Unknown'

      const response = await apiClient.updateMembershipCard(editingCard.card._id, updateData)

      if (response.success && response.data) {
        setCards(prev => prev.map(card => {
          if (card.card._id === editingCard.card._id) {
            if (response.data.card && response.data.membershipPlan) {
              return response.data
            }
            return {
              ...card,
              card: {
                ...card.card,
                ...updateData
              }
            }
          }
          return card
        }))

        const statusText = updateData.status ? ` Status: ${updateData.status}.` : ''
        const accessLevelText = updateData.accessLevel ? ` Access level: ${updateData.accessLevel}.` : ''
        toast({
          title: "Membership Card Updated Successfully",
          description: `Membership card "${cardNumber}" for plan "${planName}" has been updated successfully.${statusText}${accessLevelText} All changes have been saved.`,
        })

        setEditingCard(null)
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
        const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
        throw new Error(`Failed to update card: ${errorMessage} (Status: ${statusCode})${validationMsg}`)
      }
    } catch (error: any) {
      const planName = editingCard?.membershipPlan?.name || 'Unknown Plan'
      const cardNumber = editingCard?.card?.cardNumber || 'Unknown'
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      const validationErrors = errorDetails.errors || []
      const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
      toast({
        title: "Failed to Update Membership Card",
        description: `Failed to update membership card "${cardNumber}" for plan "${planName}" (Card ID: ${editingCard?.card._id}): ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check your changes and try again.`,
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setCustomLogoFile(null)
    setCustomLogoPreview(null)
  }

  const handlePrimaryColorChange = useCallback((newColor: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      const existingCustomization = prev.card.customization
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...(existingCustomization || {}),
            primaryColor: newColor,
          }
        }
      }
    })
  }, [])

  const handleSecondaryColorChange = useCallback((newColor: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      const existingCustomization = prev.card.customization
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...(existingCustomization || {}),
            secondaryColor: newColor,
          }
        }
      }
    })
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      return {
        ...prev,
        card: { ...prev.card, status: value as 'active' | 'expired' | 'pending' | 'suspended' }
      }
    })
  }, [])

  const handleAccessLevelChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      return {
        ...prev,
        card: { ...prev.card, accessLevel: value as 'basic' | 'premium' | 'vip' }
      }
    })
  }, [])

  const handleCardStyleChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      const styleValue = value as 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald'
      const styleColors = CARD_STYLE_COLORS[styleValue]
      const existingCustomization = normalizeCustomization(prev.card.customization)
      return {
        ...prev,
        card: {
          ...prev.card,
          cardStyle: styleValue,
          customization: {
            ...existingCustomization,
            primaryColor: styleColors.primaryColor,
            secondaryColor: styleColors.secondaryColor,
          }
        }
      }
    })
  }, [CARD_STYLE_COLORS, normalizeCustomization])

  // Font family fix: Only set the fontFamily field, retain existing customization
  const handleFontFamilyChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null;
      const existingCustomization = prev.card.customization || {};
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...existingCustomization,
            fontFamily: value
          }
        }
      }
    });
  }, []);

  const handleLogoSizeChange = useCallback((value: string) => {
    setEditingCard(prev => {
      if (!prev) return null
      const existingCustomization = prev.card.customization
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...(existingCustomization || {}),
            logoSize: value as 'small' | 'medium' | 'large'
          }
        }
      }
    })
  }, [])

  const handleShowLogoChange = useCallback((checked: boolean) => {
    setEditingCard(prev => {
      if (!prev) return null;
      const existingCustomization = prev.card.customization || {};
      return {
        ...prev,
        card: {
          ...prev.card,
          customization: {
            ...existingCustomization,
            showLogo: checked,
          }
        }
      }
    })
  }, [])

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
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
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Membership Cards</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Create and customize membership cards for your plans</p>
            </div>
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 w-full sm:w-auto">
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
                            <div className="w-full max-w-xs sm:max-w-sm">
                              <MembershipCard
                                cardData={editingCard}
                                cardStyle={editingCard.card.cardStyle}
                                showLogo={editingCard.card.customization?.showLogo ?? true}
                                userName="John Doe"
                                membershipId={editingCard.card.membershipId ?? 'MEM-XXXX'}
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {cards.map((card, index) => (
                              <div key={card?.card?._id || index} className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">{card?.membershipPlan?.name || 'Unknown Plan'}</p>
                                <div className="flex justify-center">
                                  <div className="w-full max-w-xs sm:max-w-sm">
                                    <MembershipCard
                                      cardData={card}
                                      cardStyle={card?.card?.cardStyle || 'default'}
                                      showLogo={card?.card?.customization?.showLogo ?? true}
                                      userName="John Doe"
                                      membershipId={card?.card?.membershipId ?? 'Membership ID'}
                                    />
                                  </div>
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
                        <div>
                          <Label htmlFor="createCardStyle">Card Style</Label>
                          <Select
                            value={customization.cardStyle}
                            onValueChange={(v) => setCustomization(prev => ({
                              ...prev,
                              cardStyle: v as typeof prev.cardStyle,
                              primaryColor: CARD_STYLE_COLORS[v as keyof typeof CARD_STYLE_COLORS].primaryColor,
                              secondaryColor: CARD_STYLE_COLORS[v as keyof typeof CARD_STYLE_COLORS].secondaryColor,
                              fontFamily: prev.fontFamily,
                              logoSize: prev.logoSize,
                              showLogo: prev.showLogo
                            }))}
                          >
                            <SelectTrigger id="createCardStyle">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Classic Blue</SelectItem>
                              <SelectItem value="premium">Premium Gold</SelectItem>
                              <SelectItem value="vintage">Vintage Amber</SelectItem>
                              <SelectItem value="modern">Modern Purple</SelectItem>
                              <SelectItem value="elite">Elite Black</SelectItem>
                              <SelectItem value="emerald">Emerald Green</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {membershipPlans.length > 0 && (() => {
                    const planIdsWithCards = cards.map(c => c.membershipPlan?._id).filter(Boolean);
                    const selectedPlanHasCard = selectedPlanId && planIdsWithCards.includes(selectedPlanId);
                    return (
                      <div className="flex flex-col items-end gap-2">
                        {selectedPlanHasCard && (
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            This plan already has a membership card. Only one card can be created per plan.
                          </p>
                        )}
                        <Button
                          onClick={handleCreateCard}
                          disabled={!effectiveClubId || !selectedPlanId || isCreating || !!selectedPlanHasCard}
                        >
                          {isCreating ? "Creating..." : "Create Membership Card"}
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              <MembershipCardCustomizer
                clubId={effectiveClubId || undefined}
                onSave={() => {
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
                        if (!card || !card.card) {
                          return null
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
                                    Expires: {formatDisplayDate(card.card.expiryDate)}
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
                        )
                      }).filter(Boolean)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Card Modal */}
        {editingCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
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

              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 pt-0 overflow-y-auto flex-1 min-h-0">
                {/* Left Column - Settings */}
                <div className="flex-shrink-0 lg:w-[380px] xl:w-[420px] space-y-4 overflow-y-auto">
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
                    <Label htmlFor="editCardStyle">Card Style</Label>
                    <Select
                      value={editingCard.card.cardStyle}
                      onValueChange={handleCardStyleChange}
                    >
                      <SelectTrigger id="editCardStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Classic Blue</SelectItem>
                        <SelectItem value="premium">Premium Gold</SelectItem>
                        <SelectItem value="vintage">Vintage Amber</SelectItem>
                        <SelectItem value="modern">Modern Purple</SelectItem>
                        <SelectItem value="elite">Elite Black</SelectItem>
                        <SelectItem value="emerald">Emerald Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={editingCard.card.customization?.primaryColor || '#3b82f6'}
                      onChange={(e) => handlePrimaryColorChange(e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
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
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
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
                      checked={editingCard.card.customization?.showLogo ?? true}
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
                              src={editingCard.card.customization.customLogo.startsWith('http') || editingCard.card.customization.customLogo.startsWith('data:')
                                ? editingCard.card.customization.customLogo
                                : `${getBaseUrl()}${editingCard.card.customization.customLogo}`}
                              alt="Current custom logo"
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                const customLogo = editingCard.card.customization?.customLogo;
                                if (customLogo && !customLogo.startsWith('http') && !customLogo.startsWith('data:')) {
                                  e.currentTarget.src = `${getBaseUrl()}${customLogo}`;
                                }
                              }}
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

                {/* Right Column - Live Preview */}
                <div className="flex-1 flex items-start justify-center lg:justify-end min-h-[320px] lg:min-h-0 lg:sticky lg:top-0">
                  <div className="border rounded-lg p-4 sm:p-6 bg-muted/20 w-full max-w-sm">
                    <Label className="text-sm font-medium mb-4 block">Live Preview</Label>
                    <div className="flex justify-center">
                      <div className="w-full max-w-xs sm:max-w-sm">
                        <MembershipCard
                          cardData={editingCard}
                          cardStyle={editingCard.card.cardStyle}
                          showLogo={editingCard.card.customization?.showLogo ?? true}
                          userName="John Doe"
                          membershipId={editingCard.card.membershipId ?? 'MEM-XXXX'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 sm:p-6 pt-4 border-t bg-muted/20 flex-shrink-0">
                <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isEditing} className="w-full sm:w-auto">
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}