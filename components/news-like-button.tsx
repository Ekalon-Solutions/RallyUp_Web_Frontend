"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { Heart } from 'lucide-react'

interface NewsLikeButtonProps {
  newsId: string
  initialLikeCount?: number
  className?: string
  onLikeUpdate?: (newLikeCount: number) => void
}

export function NewsLikeButton({ 
  newsId, 
  initialLikeCount = 0,
  className = "",
  onLikeUpdate
}: NewsLikeButtonProps) {
  // console.log('🎯 NewsLikeButton initialized with:', { newsId, initialLikeCount })
  
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // console.log('🎯 Current like state:', { isLiked, likeCount, user: !!user })

  const checkLikeStatus = useCallback(async () => {
    try {
      // console.log('🔍 Checking like status for news:', newsId)
      const response = await apiClient.checkNewsLike(newsId)
      // console.log('🔍 Like status response:', response)
      if (response.success && response.data) {
        setIsLiked(Boolean(response.data.isLiked ?? response.data.liked))
      }
    } catch (error) {
    }
  }, [newsId])

  useEffect(() => {
    if (user) {
      checkLikeStatus()
    }
  }, [user, newsId, checkLikeStatus])

  const handleLikeToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like news articles",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.toggleNewsLike(newsId)
      
      if (response.success && response.data) {
        const newIsLiked = Boolean(response.data.isLiked ?? response.data.liked)
        const newLikeCount = response.data.likeCount ?? response.data.likesCount ?? 0
        
        setIsLiked(newIsLiked)
        setLikeCount(newLikeCount)
        
        // console.log('🔄 Updating like state:', { newIsLiked, newLikeCount })
        
        setIsLiked(newIsLiked)
        setLikeCount(newLikeCount)
        
        // Notify parent of the update
        onLikeUpdate?.(newLikeCount)
        
        toast({
          title: newIsLiked ? "Liked!" : "Unliked",
          description: newIsLiked 
            ? "You liked this news article" 
            : "You unliked this news article",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update like",
          variant: "destructive",
        })
      }
    } catch (error) {
      // console.error('❌ Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
        onClick={() => {
          toast({
            title: "Authentication Required",
            description: "Please log in to like news articles",
            variant: "destructive",
          })
        }}
      >
        <Heart className="h-4 w-4" />
        <span>{likeCount}</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''} ${className}`}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </Button>
  )
}
