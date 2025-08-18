"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { 
  Megaphone
} from "lucide-react"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { toast } from "sonner"

interface Promotion {
  _id: string
  title: string
  description?: string
  type: 'banner' | 'popup' | 'email' | 'sms' | 'notification' | 'sidebar'
  content: {
    text?: string
    image?: string
    video?: string
    link?: string
    buttonText?: string
    buttonAction?: string
  }
  targeting: {
    audience: 'all' | 'members' | 'non-members' | 'specific-clubs' | 'specific-users'
    clubs?: string[]
    users?: string[]
    userRoles?: string[]
    userInterests?: string[]
  }
  scheduling: {
    startDate: string
    endDate: string
    timezone: string
  }
  display: {
    priority: number
    frequency: 'once' | 'daily' | 'weekly' | 'always'
    position?: string
  }
  tracking: {
    impressions: number
    clicks: number
    conversions: number
  }
  status: 'active' | 'inactive' | 'draft' | 'scheduled' | 'expired'
  club?: string
  createdBy?: {
    name: string
    email: string
  }
  createdAt: string
}

interface PromotionFeedProps {
  clubId?: string
  limit?: number
  showStats?: boolean
}

export function PromotionFeed({ clubId, limit = 5, showStats = true }: PromotionFeedProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    fetchPromotions()
  }, [clubId])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      
      let endpoint = API_ENDPOINTS.promotions.active
      if (clubId) {
        endpoint = `${API_ENDPOINTS.promotions.club}/${clubId}`
      }

      const response = await fetch(getApiUrl(endpoint))

      if (response.ok) {
        const data = await response.json()
        // Handle both data structures: data.promotions and data.data
        const promotionsData = data.promotions || data.data || []
        const limitedPromotions = promotionsData.slice(0, limit)
        setPromotions(limitedPromotions)
      } else {
        console.error('Failed to fetch promotions')
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackPromotionView = async (promotionId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(getApiUrl(API_ENDPOINTS.promotions.view(promotionId)), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const trackPromotionClick = async (promotionId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(getApiUrl(API_ENDPOINTS.promotions.click(promotionId)), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }



  const handlePromotionClick = async (promotion: Promotion) => {
    // Track the click
    await trackPromotionClick(promotion._id)
    
    // Handle different promotion types
    switch (promotion.type) {
      case 'banner':
      case 'popup':
        // For banners/popups, track view and show content
        await trackPromotionView(promotion._id)
        toast.success(promotion.title)
        break
      case 'email':
        // For emails, open email client
        window.location.href = `mailto:?subject=${encodeURIComponent(promotion.title)}&body=${encodeURIComponent(promotion.content?.text || promotion.description || '')}`
        break
      case 'notification':
        // For notifications, show toast
        await trackPromotionView(promotion._id)
        toast(promotion.title, {
          description: promotion.description,
        })
        break
    }
  }





  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading promotions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (promotions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active promotions at the moment</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
                 <CardTitle className="flex items-center gap-2">
           <Megaphone className="w-5 h-5" />
           Promotional Content
           <Badge variant="outline" className="ml-2">
             {promotions.length}
           </Badge>
         </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {promotions.map((promotion) => (
            <div
              key={promotion._id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePromotionClick(promotion)}
            >
                             <div className="mb-3">
                 <h4 className="font-medium text-base mb-2">{promotion.title}</h4>
               </div>
              
                             {promotion.description && (
                 <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                   {promotion.description}
                 </p>
               )}
               
               {promotion.content?.text && (
                 <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                   {promotion.content.text}
                 </p>
               )}

              

              
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
