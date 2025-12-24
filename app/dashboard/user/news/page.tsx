"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CreateNewsModal } from "@/components/modals/create-news-modal"
import NewsReadMoreModal from "@/components/modals/news-readmore-modal"
import { apiClient, News } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { getBaseUrl } from "@/lib/config"
import { 
  Newspaper, 
  Search, 
  Tag, 
  User, 
  Calendar, 
  Eye, 
  BookOpen, 
  Plus, 
  Image as ImageIcon,
  Edit,
  Trash2,
  EyeOff,
  TrendingUp
} from "lucide-react"

export default function UserNewsPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)

  useEffect(() => {
    fetchNews()
    checkUserRole()
  }, [])

  const checkUserRole = () => {
    // Check if user is admin or super_admin
    const adminRoles = ['admin', 'super_admin']
    setIsAdmin(adminRoles.includes(user?.role || ''))
  }

  const fetchNews = async () => {
    try {
      setLoading(true)
      // Use club-specific news endpoint
      const response = await apiClient.getNewsByUserClub()

      if (response.success && response.data) {
        setNews(response.data.news || response.data)
      } else {
        // console.error("Failed to fetch news:", response.error)
        toast.error("Failed to fetch news")
      }
    } catch (error) {
      // console.error("Error fetching news:", error)
      toast.error("Error fetching news")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNews = () => {
    setEditingNews(null)
    setShowCreateModal(true)
  }

  const handleEditNews = (newsItem: News) => {
    setEditingNews(newsItem)
    setShowCreateModal(true)
  }

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm("Are you sure you want to delete this news article?")) {
      return
    }

    try {
      const response = await apiClient.deleteNews(newsId)
      if (response.success) {
        toast.success("News article deleted successfully")
        fetchNews()
      } else {
        toast.error(response.error || "Failed to delete news article")
      }
    } catch (error) {
      // console.error("Error deleting news:", error)
      toast.error("Error deleting news article")
    }
  }

  const handleReadMore = (newsItem: News) => {
    setSelectedNewsForReadMore(newsItem)
    setShowReadMoreModal(true)
  }

  const handleTogglePublish = async (newsId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleNewsPublish(newsId, !currentStatus)
      if (response.success) {
        toast.success(`News article ${!currentStatus ? 'published' : 'unpublished'} successfully`)
        fetchNews()
      } else {
        toast.error(response.error || "Failed to update publish status")
      }
    } catch (error) {
      // console.error("Error updating publish status:", error)
      toast.error("Error updating publish status")
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'event': return '🎉'
      case 'announcement': return '📢'
      case 'update': return '🔄'
      case 'achievement': return '🏆'
      default: return '📰'
    }
  }

  const filteredNews = news.filter(article => {
    if (searchTerm && !article.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !article.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }
    
    if (categoryFilter && article.category !== categoryFilter) {
      return false
    }
    
    return true
  })

  const sortedNews = filteredNews.sort((a, b) => {
    // Sort by priority first, then by published date
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - 
                        (priorityOrder[a.priority as keyof typeof priorityOrder] || 1)
    
    if (priorityDiff !== 0) return priorityDiff
    
    return new Date(b.publishedAt || b.createdAt).getTime() - 
           new Date(a.publishedAt || a.createdAt).getTime()
  })

  const categories = ['general', 'event', 'announcement', 'update', 'achievement']

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">News & Updates</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Stay informed with the latest news from your club</p>
            </div>
            {isAdmin && (
              <Button onClick={handleCreateNews} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create News
              </Button>
            )}
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                                  <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {searchTerm || categoryFilter ? "Try adjusting your filters" : "Check back later for updates"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedNews.map((article) => (
                  <Card key={article._id} className="overflow-hidden">
                    {/* Featured Image */}
                    {article.featuredImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={`${getBaseUrl()}/uploads/news/${article.featuredImage}`}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Badge variant={getPriorityColor(article.priority)}>
                            {article.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {article.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl sm:text-2xl">{getCategoryIcon(article.category)}</span>
                            <CardTitle className="text-xl sm:text-2xl break-words">{article.title}</CardTitle>
                          </div>
                          
                          {article.summary && (
                            <p className="text-muted-foreground text-base sm:text-lg break-words">{article.summary}</p>
                          )}
                          
                          <CardDescription className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(article.publishedAt || article.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.viewCount} views
                            </span>
                            {article.images.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" />
                                {article.images.length} image{article.images.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="prose max-w-none">
                          <p className="text-muted-foreground leading-relaxed">
                            {truncateText(article.content, 300)}
                          </p>
                        </div>
                        
                        {/* Additional Images */}
                        {article.images.length > 1 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {article.images.slice(0, 4).map((image, index) => (
                              <img
                                key={index}
                                src={`${getBaseUrl()}/uploads/news/${image}`}
                                alt={`${article.title} - Image ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                            ))}
                            {article.images.length > 4 && (
                              <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">
                                  +{article.images.length - 4} more
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
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
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => handleReadMore(article)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Read More
                          </Button>
                          
                          {/* Admin Controls */}
                          {isAdmin && (
                            <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:flex-initial">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditNews(article)}
                                className="flex-1 sm:flex-initial"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTogglePublish(article._id, article.isPublished)}
                                className="flex-1 sm:flex-initial"
                              >
                                {article.isPublished ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteNews(article._id)}
                                className="flex-1 sm:flex-initial"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
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
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                News Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
                    {news.filter(article => !article.isPublished).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Drafts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Math.max(...news.map(article => article.viewCount), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit News Modal */}
        <CreateNewsModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingNews(null)
          }}
          onSuccess={() => {
            fetchNews()
            setShowCreateModal(false)
            setEditingNews(null)
          }}
          editNews={editingNews}
        />

        {/* Read More News Modal */}
        <NewsReadMoreModal
          news={selectedNewsForReadMore}
          isOpen={showReadMoreModal}
          onClose={() => {
            setShowReadMoreModal(false)
            setSelectedNewsForReadMore(null)
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 