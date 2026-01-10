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
  Plus, 
  Image as ImageIcon,
  Edit,
  Trash2,
  EyeOff,
  TrendingUp,
  Filter,
  BarChart3,
  RefreshCw
} from "lucide-react"

export default function ContentManagementPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)

  // Simple initial load effect
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      loadNews()
      loadStats()
    }
  }, [user?.role])

  // Simple filter effect
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      setCurrentPage(1)
      loadNews()
    }
  }, [categoryFilter, priorityFilter])

  // Simple search effect with delay
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      const timer = setTimeout(() => {
        setCurrentPage(1)
        loadNews()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  // Simple page change effect
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin' && currentPage > 1) {
      loadNews()
    }
  }, [currentPage])

  const loadNews = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getNewsByMyClub()
      
      if (response.success && response.data) {
        setNews(response.data.news || response.data)
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages)
        }
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

  const loadStats = async () => {
    try {
      const response = await apiClient.getNewsStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      // console.error("Error fetching stats:", error)
    }
  }

  const handleCreateNews = () => {
    setEditingNews(null)
    setShowCreateModal(true)
  }

  const handleReadMore = (newsItem: News) => {
    setSelectedNewsForReadMore(newsItem)
    setShowReadMoreModal(true)
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
        loadNews()
        loadStats()
      } else {
        toast.error(response.error || "Failed to delete news article")
      }
    } catch (error) {
      // console.error("Error deleting news:", error)
      toast.error("Error deleting news article")
    }
  }

  const handleTogglePublish = async (newsId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleNewsPublish(newsId, !currentStatus)
      if (response.success) {
        toast.success(`News article ${!currentStatus ? 'published' : 'unpublished'} successfully`)
        loadNews()
        loadStats()
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

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("")
    setPriorityFilter("")
    setCurrentPage(1)
  }

  const categories = ['general', 'event', 'announcement', 'update', 'achievement']
  const priorities = ['low', 'medium', 'high']

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Content Management</h1>
              <p className="text-muted-foreground">Manage all news articles and content for your club</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowStats(!showStats)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button onClick={handleCreateNews}>
                <Plus className="w-4 h-4 mr-2" />
                Create News
              </Button>
            </div>
          </div>

          {/* Statistics */}
          {showStats && stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  News Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{stats.stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Articles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.stats.published}</div>
                    <div className="text-sm text-muted-foreground">Published</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.stats.drafts}</div>
                    <div className="text-sm text-muted-foreground">Drafts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.stats.totalViews}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Articles by Category</h4>
                    <div className="space-y-2">
                      {stats.categoryStats?.map((cat: any) => (
                        <div key={cat._id} className="flex justify-between items-center">
                          <span className="capitalize">{cat._id}</span>
                          <Badge variant="secondary">{cat.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Articles by Priority</h4>
                    <div className="space-y-2">
                      {stats.priorityStats?.map((pri: any) => (
                        <div key={pri._id} className="flex justify-between items-center">
                          <span className="capitalize">{pri._id}</span>
                          <Badge variant="secondary">{pri.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
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
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Category" />
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
                  <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {priorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {news.length} articles found
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadNews}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
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
            ) : news.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No articles found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || categoryFilter || priorityFilter 
                        ? "Try adjusting your filters" 
                        : "Create your first news article to get started"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {news.map((article) => (
                  <Card key={article._id} className="overflow-hidden">
                    {/* Featured Image */}
                    {article.featuredImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={`${getBaseUrl()}/uploads/news/${article.featuredImage}`}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
//                             console.error('Failed to load featured image:', article.featuredImage);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Badge variant={getPriorityColor(article.priority)}>
                            {article.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={article.isPublished ? "default" : "secondary"}>
                            {article.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCategoryIcon(article.category)}</span>
                            <CardTitle className="text-2xl">{article.title}</CardTitle>
                          </div>
                          
                          {article.summary && (
                            <p className="text-muted-foreground text-lg">{article.summary}</p>
                          )}
                          
                          <CardDescription className="flex items-center gap-4 flex-wrap">
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {article.images.slice(0, 4).map((image, index) => (
                              <img
                                key={index}
                                src={`${getBaseUrl()}/uploads/news/${image}`}
                                alt={`${article.title} - Image ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  // // console.error('Failed to load image:', image);
                                  e.currentTarget.style.display = 'none';
                                }}
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
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            onClick={() => handleReadMore(article)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Read More
                          </Button>
                          
                          {/* Admin Controls */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditNews(article)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTogglePublish(article._id, article.isPublished)}
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
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create/Edit News Modal */}
        <CreateNewsModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingNews(null)
          }}
          onSuccess={() => {
            loadNews()
            loadStats()
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
