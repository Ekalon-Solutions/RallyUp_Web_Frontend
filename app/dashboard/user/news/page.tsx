"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient, News } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Newspaper, Search, Tag, User, Calendar, Eye, BookOpen } from "lucide-react"

export default function UserNewsPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicNews()

      if (response.success && response.data) {
        setNews(response.data)
      } else {
        console.error("Failed to fetch news:", response.error)
        toast.error("Failed to fetch news")
      }
    } catch (error) {
      console.error("Error fetching news:", error)
      toast.error("Error fetching news")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const filteredNews = news.filter(article => {
    if (!searchTerm) return true
    
    return article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const sortedNews = filteredNews.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">News & Updates</h1>
            <p className="text-muted-foreground">Stay informed with the latest news from your supporter group</p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* News Articles */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading news...</p>
                </div>
              </div>
            ) : sortedNews.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No articles found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search terms" : "Check back later for updates"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedNews.map((article) => (
                  <Card key={article._id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{article.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(article.createdAt)}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {article.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="prose max-w-none">
                          <p className="text-muted-foreground leading-relaxed">
                            {selectedArticle?._id === article._id 
                              ? article.content 
                              : truncateText(article.content, 300)
                            }
                          </p>
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {selectedArticle?._id === article._id ? (
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedArticle(null)}
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              Show Less
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedArticle(article)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Read More
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>News Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{news.length}</div>
                  <div className="text-sm text-muted-foreground">Total Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {news.filter(article => article.isPublished).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Math.max(...news.map(article => article.tags.length), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Most Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 