"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, User, Eye, Tag, Building, X } from 'lucide-react'
import { News } from '@/lib/api'
import { getNewsImageUrl } from '@/lib/config'
import { formatLocalDate } from '@/lib/timezone'

interface NewsReadMoreModalProps {
  news: News | null
  isOpen: boolean
  onClose: () => void
}

export default function NewsReadMoreModal({ news, isOpen, onClose }: NewsReadMoreModalProps) {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) setEnlargedImage(null)
  }, [isOpen])

  if (!news) return null

  const formatDate = (dateString: string) => formatLocalDate(dateString, 'long')

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'event': return '🎉'
      case 'announcement': return '📢'
      case 'update': return '🔄'
      case 'achievement': return '🏆'
      default: return '📰'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
            <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {news.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Featured Image */}
              {news.featuredImage && (
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setEnlargedImage(getNewsImageUrl(news.featuredImage!))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setEnlargedImage(getNewsImageUrl(news.featuredImage!))}
                  aria-label="Click to enlarge"
                >
                  <img
                    src={getNewsImageUrl(news.featuredImage)}
                    alt={news.title}
                    className="w-full h-64 object-cover rounded-lg group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-lg transition-opacity pointer-events-none">
                    <span className="text-white text-sm font-medium">Click to enlarge</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className={getPriorityColor(news.priority)}>
                      {news.priority.charAt(0).toUpperCase() + news.priority.slice(1)} Priority
                    </Badge>
                  </div>
                </div>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Published: {formatDate(news.publishedAt || news.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Author: {news.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{news.viewCount || 0} views</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>Club: {news.club?.name || 'Unknown Club'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Category: {getCategoryIcon(news.category)} {news.category.charAt(0).toUpperCase() + news.category.slice(1)}</span>
                </div>
              </div>

              {/* Summary */}
              {news.summary && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Summary</h3>
                    <p className="text-muted-foreground leading-relaxed">{news.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Content</h3>
                  <div 
                    className="prose prose-gray dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: news.content }}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              {news.tags && news.tags.length > 0 && news.tags.some(tag => tag.trim()) && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {news.tags
                        .filter(tag => tag.trim())
                        .map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Images */}
              {news.images && news.images.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {news.images.map((image, index) => {
                        const imageUrl = getNewsImageUrl(image);
                        return (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => setEnlargedImage(imageUrl)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setEnlargedImage(imageUrl)}
                            aria-label="Click to enlarge"
                          >
                            <img
                              src={imageUrl}
                              alt={`${news.title} - Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                Click to enlarge
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lightbox for enlarged image */}
              <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 overflow-hidden border-0 bg-black/90">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                    onClick={() => setEnlargedImage(null)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  {enlargedImage && (
                    <img
                      src={enlargedImage}
                      alt="Enlarged"
                      className="max-w-full max-h-[90vh] w-auto h-auto object-contain mx-auto"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </DialogContent>
              </Dialog>

              {/* Footer Actions */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  )
}
