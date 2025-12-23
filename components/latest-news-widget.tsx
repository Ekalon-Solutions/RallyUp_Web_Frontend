"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Newspaper, 
  User as UserIcon,
  Calendar,
  ArrowRight,
  Eye
} from "lucide-react"
import { apiClient, News } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { formatLocalDate } from "@/lib/timezone"

interface LatestNewsWidgetProps {
  limit?: number
  showManageButton?: boolean
}

export function LatestNewsWidget({ limit = 3, showManageButton = true }: LatestNewsWidgetProps) {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentNews()
  }, [])

  const fetchRecentNews = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getNews()
      
      if (response.success && response.data) {
        const newsData = Array.isArray(response.data) ? response.data : (response.data as any).news || []
        const sortedNews = newsData
          .filter((article: News) => article.isPublished)
          .sort((a: News, b: News) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
        setNews(sortedNews)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'date-short')
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Latest News
          </CardTitle>
          {showManageButton && isAdmin && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/content">
                <Newspaper className="w-4 h-4 mr-2" />
                Manage
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <div className="text-center py-6">
            <Newspaper className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">No published news articles</p>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href="/dashboard/content">
                  Create First Article
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((article) => (
              <div key={article._id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2 flex-1">
                    {article.title}
                  </h4>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Published
                  </Badge>
                </div>
                
                {article.content && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {truncateText(article.content, 100)}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    <span>{article.author || "Admin"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                  {article.category && (
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span>{article.views || 0} views</span>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="h-6 px-2">
                    <Link href={isAdmin ? "/dashboard/content" : "/dashboard/user/news"}>
                      View
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={isAdmin ? "/dashboard/content" : "/dashboard/user/news"}>
                  View All News
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

