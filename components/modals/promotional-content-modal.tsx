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
  Megaphone, 
  Target, 
  TrendingUp, 
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Sidebar,
  Calendar,
  Star,
  Gift
} from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { useAuth } from "@/contexts/auth-context"
import { utcToDatetimeLocal } from "@/lib/timezone"

interface PromotionalContent {
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
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }
  tracking: {
    impressions: number
    clicks: number
    conversions: number
  }
  status: 'active' | 'inactive' | 'draft' | 'scheduled' | 'expired'
  club?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface PromotionalContentModalProps {
  isOpen: boolean
  onClose: () => void
  onContentCreated?: () => void
  editingPromotion?: PromotionalContent | null
}

export default function PromotionalContentModal({ isOpen, onClose, onContentCreated, editingPromotion }: PromotionalContentModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("create")
  const [loading, setLoading] = useState(false)
  const [contents, setContents] = useState<PromotionalContent[]>([])
  const [selectedContent, setSelectedContent] = useState<PromotionalContent | null>(null)
  const [internalEditingPromotion, setInternalEditingPromotion] = useState<PromotionalContent | null>(null)
  
  // Use external editingPromotion if provided, otherwise use internal state
  const currentEditingPromotion = editingPromotion || internalEditingPromotion
  
  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contentText, setContentText] = useState("")
  const [type, setType] = useState<'banner' | 'popup' | 'email' | 'sms' | 'notification' | 'sidebar'>('banner')
  const [targetAudience, setTargetAudience] = useState<'all' | 'members' | 'non-members' | 'specific-clubs' | 'specific-users'>('all')
  const [priority, setPriority] = useState(1)
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'always'>('once')
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [timezone, setTimezone] = useState("UTC")

  useEffect(() => {
    if (isOpen) {
      fetchPromotionalContent()
    }
  }, [isOpen])

  // Populate form when editing promotion
  useEffect(() => {
    if (currentEditingPromotion) {
      setTitle(currentEditingPromotion.title)
      setDescription(currentEditingPromotion.description || "")
      setContentText(currentEditingPromotion.content?.text || "")
      setType(currentEditingPromotion.type)
      setTargetAudience(currentEditingPromotion.targeting?.audience || 'all')
      setPriority(currentEditingPromotion.display?.priority || 1)
      setFrequency(currentEditingPromotion.display?.frequency || 'once')
      setStartDate(currentEditingPromotion.scheduling?.startDate ? utcToDatetimeLocal(currentEditingPromotion.scheduling.startDate) : "")
      setEndDate(currentEditingPromotion.scheduling?.endDate ? utcToDatetimeLocal(currentEditingPromotion.scheduling.endDate) : "")
      setTimezone(currentEditingPromotion.scheduling?.timezone || "UTC")
      setActiveTab("create") // Switch to create tab when editing
    } else {
      resetForm()
    }
  }, [currentEditingPromotion])

  const fetchPromotionalContent = async () => {
    try {
      // console.log('Fetching promotions from:', getApiUrl(API_ENDPOINTS.promotions.getAll))
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.getAll))
      
      // console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        // console.log('Promotions data:', data)
        setContents(data.data || data.promotions || [])
      } else {
        // console.error('Failed to fetch promotions:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        // console.error('Error data:', errorData)
      }
    } catch (error) {
      // console.error('Error fetching promotional content:', error)
    }
  }



  const handleCreateContent = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!contentText.trim()) {
      toast.error("Content text is required")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const isEditing = !!currentEditingPromotion
      
      const payload = {
        title,
        description,
        type,
        content: {
          text: contentText
        },
        targeting: {
          audience: targetAudience
        },
        scheduling: {
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          timezone
        },
        display: {
          priority,
          frequency
        },
        club: user?.club?._id
      }

      const url = isEditing 
        ? getApiUrl(API_ENDPOINTS.promotions.update(currentEditingPromotion!._id))
        : getApiUrl(API_ENDPOINTS.promotions.create)
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const successMessage = isEditing ? "Promotional content updated successfully!" : "Promotional content created successfully!"
        toast.success(successMessage)
        resetForm()
        onContentCreated?.()
        setActiveTab("manage")
      } else {
        const data = await response.json()
        const errorMessage = isEditing ? "Failed to update promotional content" : "Failed to create promotional content"
        toast.error(data.message || errorMessage)
      }
    } catch (error) {
      // console.error('Error saving promotional content:', error)
              const errorMessage = currentEditingPromotion ? "updating" : "creating"
      toast.error(`An error occurred while ${errorMessage} the content`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setContentText("")
    setType('banner')
    setTargetAudience('all')
    setPriority(1)
    setFrequency('once')
    setStartDate("")
    setEndDate("")
    setTimezone("UTC")
    setInternalEditingPromotion(null)
  }

  const updateContentStatus = async (contentId: string, status: PromotionalContent['status']) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.status(contentId)), {
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
      // console.error('Error updating content status:', error)
      toast.error("Failed to update content status")
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this promotional content? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.promotions.delete(contentId)), {
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
      // console.error('Error deleting content:', error)
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



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner': return <Megaphone className="w-4 h-4" />
      case 'popup': return <Target className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'notification': return <Bell className="w-4 h-4" />
      case 'sidebar': return <Sidebar className="w-4 h-4" />
      default: return <Megaphone className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
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
                      <Label htmlFor="type">Promotion Type</Label>
                      <Select value={type} onValueChange={(value: any) => setType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="popup">Popup</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority (1-10)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="10"
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="members">Club Members Only</SelectItem>
                        <SelectItem value="non-members">Non-Members</SelectItem>
                        <SelectItem value="specific-clubs">Specific Clubs</SelectItem>
                        <SelectItem value="specific-users">Specific Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


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
                    <Label htmlFor="content">Content Text *</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your promotional content here..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Display Frequency</Label>
                      <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="always">Always</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="UTC"
                      />
                    </div>
                  </div>




                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              {currentEditingPromotion ? (
                <Button variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : (
                <Button variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              )}
              <Button onClick={handleCreateContent} disabled={loading}>
                {loading ? (currentEditingPromotion ? "Updating..." : "Creating...") : (currentEditingPromotion ? "Update Promotional Content" : "Create Promotional Content")}
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
                                                     <Badge variant="outline" className="bg-blue-100 text-blue-800">
                             Priority: {content.display?.priority || 1}
                           </Badge>
                          
                        </div>
                        
                                                 {content.description && (
                           <p className="text-sm text-muted-foreground mb-2">
                             {content.description}
                           </p>
                         )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                   <span className="flex items-center gap-1">
                           <Target className="w-4 h-4" />
                           {content.targeting?.audience?.replace('-', ' ') || 'all'}
                         </span>
                                                     {content.scheduling?.startDate && (
                             <span className="flex items-center gap-1">
                               <Calendar className="w-4 h-4" />
                               {new Date(content.scheduling.startDate).toLocaleDateString()}
                             </span>
                           )}

                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>👁️ {content.tracking?.impressions || 0} views</span>
                          <span>🖱️ {content.tracking?.clicks || 0} clicks</span>
                          <span>🎯 {content.tracking?.conversions || 0} conversions</span>
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
                          onClick={() => {
                            setInternalEditingPromotion(content)
                            setActiveTab("create")
                          }}
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
                  <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Promotional Content</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first promotional campaign to engage your community
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Megaphone className="w-4 h-4 mr-2" />
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
                     {contents.reduce((sum, c) => sum + (c.tracking?.impressions || 0), 0)}
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
                       ? Math.round(contents.reduce((sum, c) => sum + (c.tracking?.clicks || 0) + (c.tracking?.conversions || 0), 0) / contents.length)
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
                     .sort((a, b) => ((b.tracking?.impressions || 0) + (b.tracking?.clicks || 0)) - ((a.tracking?.impressions || 0) + (a.tracking?.clicks || 0)))
                     .slice(0, 5)
                     .map((content) => (
                       <div key={content._id} className="flex items-center justify-between p-3 border rounded-lg">
                         <div className="flex items-center gap-3">
                           {getTypeIcon(content.type)}
                           <div>
                             <h4 className="font-medium">{content.title}</h4>
                             <p className="text-sm text-muted-foreground">
                               {content.tracking?.impressions || 0} views • {content.tracking?.clicks || 0} clicks
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
