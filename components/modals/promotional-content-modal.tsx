"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Gift, 
  Megaphone, 
  Calendar, 
  Target, 
  Users, 
  Star, 
  TrendingUp, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"

interface PromotionalContent {
  _id: string
  title: string
  description: string
  content: string
  type: 'announcement' | 'event' | 'offer' | 'newsletter' | 'challenge'
  targetAudience: 'new_members' | 'existing_members' | 'all' | 'specific_groups'
  specificGroups?: string[]
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate?: string
  endDate?: string
  scheduledDate?: string
  engagementMetrics: {
    views: number
    clicks: number
    shares: number
    responses: number
  }
  tags: string[]
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

interface PromotionalContentModalProps {
  isOpen: boolean
  onClose: () => void
  onContentCreated?: () => void
}

export default function PromotionalContentModal({ isOpen, onClose, onContentCreated }: PromotionalContentModalProps) {
  const [activeTab, setActiveTab] = useState("create")
  const [loading, setLoading] = useState(false)
  const [contents, setContents] = useState<PromotionalContent[]>([])
  const [selectedContent, setSelectedContent] = useState<PromotionalContent | null>(null)
  
  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<'announcement' | 'event' | 'offer' | 'newsletter' | 'challenge'>('announcement')
  const [targetAudience, setTargetAudience] = useState<'new_members' | 'existing_members' | 'all' | 'specific_groups'>('all')
  const [specificGroups, setSpecificGroups] = useState<string[]>([])
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchPromotionalContent()
    }
  }, [isOpen])

  const fetchPromotionalContent = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.content), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setContents(data.content || [])
      }
    } catch (error) {
      console.error('Error fetching promotional content:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleCreateContent = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!content.trim()) {
      toast.error("Content is required")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.content), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          content,
          type,
          targetAudience,
          specificGroups: targetAudience === 'specific_groups' ? specificGroups : undefined,
          priority,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          scheduledDate: scheduledDate || undefined,
          tags,
          isFeatured
        }),
      })

      if (response.ok) {
        toast.success("Promotional content created successfully!")
        resetForm()
        onContentCreated?.()
        setActiveTab("manage")
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to create promotional content")
      }
    } catch (error) {
      console.error('Error creating promotional content:', error)
      toast.error("An error occurred while creating the content")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setContent("")
    setType('announcement')
    setTargetAudience('all')
    setSpecificGroups([])
    setPriority('medium')
    setStartDate("")
    setEndDate("")
    setScheduledDate("")
    setTags([])
    setIsFeatured(false)
  }

  const updateContentStatus = async (contentId: string, status: PromotionalContent['status']) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.content) + `/${contentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Content status updated to ${status}`)
        fetchPromotionalContent()
      }
    } catch (error) {
      console.error('Error updating content status:', error)
      toast.error("Failed to update content status")
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this promotional content? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.content) + `/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Promotional content deleted successfully!")
        fetchPromotionalContent()
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error("Failed to delete content")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'offer': return <Gift className="w-4 h-4" />
      case 'newsletter': return <Mail className="w-4 h-4" />
      case 'challenge': return <Target className="w-4 h-4" />
      default: return <Megaphone className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Promotional Content Management
          </DialogTitle>
          <DialogDescription>
            Create and manage promotional campaigns to engage your community
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Content</TabsTrigger>
            <TabsTrigger value="manage">Manage Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Content Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter compelling title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description for preview"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Content Type</Label>
                      <Select value={type} onValueChange={(value: any) => setType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="offer">Special Offer</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_members">New Members</SelectItem>
                        <SelectItem value="existing_members">Existing Members</SelectItem>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="specific_groups">Specific Groups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {targetAudience === 'specific_groups' && (
                    <div className="space-y-2">
                      <Label>Specific Groups</Label>
                      <div className="space-y-2">
                        {specificGroups.map((group, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={group}
                              onChange={(e) => {
                                const updated = [...specificGroups]
                                updated[index] = e.target.value
                                setSpecificGroups(updated)
                              }}
                              placeholder="Group name"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSpecificGroups(specificGroups.filter((_, i) => i !== index))}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSpecificGroups([...specificGroups, ""])}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Group
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content & Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Content & Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your promotional content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled-date">Schedule For (Optional)</Label>
                    <Input
                      id="scheduled-date"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button variant="outline" onClick={addTag}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-red-100" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="featured">Feature this content prominently</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button onClick={handleCreateContent} disabled={loading}>
                {loading ? "Creating..." : "Create Promotional Content"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="grid gap-4">
              {contents.map((content) => (
                <Card key={content._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(content.type)}
                          <h3 className="font-semibold">{content.title}</h3>
                          <Badge variant="outline" className={getStatusColor(content.status)}>
                            {content.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(content.priority)}>
                            {content.priority}
                          </Badge>
                          {content.isFeatured && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {content.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {content.targetAudience.replace('_', ' ')}
                          </span>
                          {content.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(content.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {content.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {content.tags.slice(0, 3).join(', ')}
                              {content.tags.length > 3 && ` +${content.tags.length - 3}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>👁️ {content.engagementMetrics.views} views</span>
                          <span>🖱️ {content.engagementMetrics.clicks} clicks</span>
                          <span>📤 {content.engagementMetrics.shares} shares</span>
                          <span>💬 {content.engagementMetrics.responses} responses</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContent(content)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContent(content)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteContent(content._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {contents.length === 0 && (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Promotional Content</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first promotional campaign to engage your community
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Gift className="w-4 h-4 mr-2" />
                    Create First Campaign
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contents.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All promotional content
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contents.filter(c => c.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contents.reduce((sum, c) => sum + c.engagementMetrics.views, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined views
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contents.length > 0 
                      ? Math.round(contents.reduce((sum, c) => sum + c.engagementMetrics.clicks + c.engagementMetrics.shares + c.engagementMetrics.responses, 0) / contents.length)
                      : 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per content piece
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contents
                    .sort((a, b) => (b.engagementMetrics.views + b.engagementMetrics.clicks) - (a.engagementMetrics.views + a.engagementMetrics.clicks))
                    .slice(0, 5)
                    .map((content) => (
                      <div key={content._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(content.type)}
                          <div>
                            <h4 className="font-medium">{content.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {content.engagementMetrics.views} views • {content.engagementMetrics.clicks} clicks
                            </p>
                          </div>
                        </div>
                        <Badge variant={content.status === 'active' ? 'default' : 'secondary'}>
                          {content.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Welcome Announcement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template for welcoming new members to the community
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template for promoting upcoming events and activities
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Special Offer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template for announcing special offers and promotions
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Community Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template for launching community challenges and contests
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
