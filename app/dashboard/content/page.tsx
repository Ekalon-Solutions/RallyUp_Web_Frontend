"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Newspaper, Search, MoreHorizontal, Edit, Trash2, Eye, Plus, Filter, Calendar, User, Tag } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient, News } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewsPage() {
  const { isAdmin } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Form states for add/edit news
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    isPublished: false
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    fetchNews()
  }, [searchTerm, statusFilter])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getNews()

      if (response.success && response.data) {
        let filteredNews = response.data

        // Apply search filter
        if (searchTerm) {
          filteredNews = filteredNews.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        }

        // Apply status filter
        if (statusFilter !== "all") {
          filteredNews = filteredNews.filter(article => 
            statusFilter === "published" ? article.isPublished : !article.isPublished
          )
        }

        setNews(filteredNews)
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

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await apiClient.createNews({
        title: newsForm.title,
        content: newsForm.content,
        tags: newsForm.tags,
        isPublished: newsForm.isPublished
      })

      if (response.success) {
        toast.success("News article created successfully")
        setIsAddDialogOpen(false)
        resetForm()
        fetchNews()
      } else {
        toast.error(response.error || "Failed to create news article")
      }
    } catch (error) {
      console.error("Error creating news article:", error)
      toast.error("Error creating news article")
    }
  }

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingNews) return

    try {
      const response = await apiClient.updateNews(editingNews._id, {
        title: newsForm.title,
        content: newsForm.content,
        tags: newsForm.tags,
        isPublished: newsForm.isPublished
      })

      if (response.success) {
        toast.success("News article updated successfully")
        setEditingNews(null)
        resetForm()
        fetchNews()
      } else {
        toast.error(response.error || "Failed to update news article")
      }
    } catch (error) {
      console.error("Error updating news article:", error)
      toast.error("Error updating news article")
    }
  }

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm("Are you sure you want to delete this news article?")) return

    try {
      const response = await apiClient.deleteNews(newsId)
      if (response.success) {
        toast.success("News article deleted successfully")
        fetchNews()
      } else {
        toast.error(response.error || "Failed to delete news article")
      }
    } catch (error) {
      console.error("Error deleting news article:", error)
      toast.error("Error deleting news article")
    }
  }

  const handleTogglePublish = async (newsId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleNewsPublish(newsId, !currentStatus)
      if (response.success) {
        toast.success(`News article ${!currentStatus ? 'published' : 'unpublished'} successfully`)
        fetchNews()
      } else {
        toast.error(response.error || "Failed to update news status")
      }
    } catch (error) {
      console.error("Error toggling news publish status:", error)
      toast.error("Error updating news status")
    }
  }

  const resetForm = () => {
    setNewsForm({
      title: "",
      content: "",
      tags: [],
      isPublished: false
    })
    setTagInput("")
  }

  const openEditDialog = (article: News) => {
    setEditingNews(article)
    setNewsForm({
      title: article.title,
      content: article.content,
      tags: article.tags,
      isPublished: article.isPublished
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !newsForm.tags.includes(tagInput.trim())) {
      setNewsForm({
        ...newsForm,
        tags: [...newsForm.tags, tagInput.trim()]
      })
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewsForm({
      ...newsForm,
      tags: newsForm.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <ProtectedRoute requireAdmin={true}>
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">News & Updates</h1>
              <p className="text-muted-foreground">Manage news articles and updates for your supporter group</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create News Article</DialogTitle>
                  <DialogDescription>Add a new news article to your supporter group</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Article Title</Label>
                    <Input
                      id="title"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      rows={10}
                      required
                      placeholder="Write your news article content here..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
          </Button>
        </div>
                    {newsForm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newsForm.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={newsForm.isPublished}
                      onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
                    />
                    <Label htmlFor="isPublished">Publish immediately</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Article</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
              <Card>
            <CardHeader>
              <CardTitle>News Articles</CardTitle>
              <CardDescription>Search and filter your news articles</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
            </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Articles</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading articles...
                        </TableCell>
                      </TableRow>
                    ) : news.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No articles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      news.map((article) => (
                        <TableRow key={article._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{article.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {truncateText(article.content, 150)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="text-sm">{article.author}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {article.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{article.tags.length - 3}
                                </Badge>
                              )}
                </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">{formatDate(article.createdAt)}</span>
                          </div>
                        </TableCell>
                          <TableCell>
                            <Badge variant={article.isPublished ? "default" : "secondary"}>
                              {article.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(article)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePublish(article._id, article.isPublished)}>
                                  {article.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteNews(article._id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              </CardContent>
            </Card>

          {/* Edit News Dialog */}
          <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit News Article</DialogTitle>
                <DialogDescription>Update article information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateNews} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Article Title</Label>
                  <Input
                    id="edit-title"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    rows={10}
                    required
                    placeholder="Write your news article content here..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  {newsForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newsForm.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isPublished"
                    checked={newsForm.isPublished}
                    onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
                  />
                  <Label htmlFor="edit-isPublished">Published</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingNews(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Article</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
