"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  MessageSquare,
  Users,
  Shield,
  Eye,
  Trash2,
  Edit,
  Pin,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react"
import { CreateTopicModal } from "@/components/modals/create-topic-modal"

const forumStats = [
  { title: "Total Topics", value: "1,247", icon: MessageSquare, color: "text-blue-600" },
  { title: "Total Posts", value: "8,932", icon: MessageSquare, color: "text-green-600" },
  { title: "Active Members", value: "456", icon: Users, color: "text-purple-600" },
  { title: "Moderators", value: "8", icon: Shield, color: "text-orange-600" },
]

const sampleTopics = [
  {
    id: 1,
    title: "Match Discussion: Arsenal vs Chelsea",
    author: "John Doe",
    category: "Match Discussion",
    replies: 23,
    views: 156,
    lastActivity: "2 hours ago",
    status: "Active",
    isPinned: true,
    isLocked: false,
  },
  {
    id: 2,
    title: "Season Ticket Exchange",
    author: "Jane Smith",
    category: "Tickets",
    replies: 8,
    views: 45,
    lastActivity: "5 hours ago",
    status: "Active",
    isPinned: false,
    isLocked: false,
  },
  {
    id: 3,
    title: "Away Day Travel Arrangements",
    author: "Mike Johnson",
    category: "Travel",
    replies: 15,
    views: 89,
    lastActivity: "1 day ago",
    status: "Closed",
    isPinned: false,
    isLocked: true,
  },
]

const sampleReports = [
  {
    id: 1,
    type: "Inappropriate Content",
    reporter: "User123",
    reported: "BadUser456",
    topic: "Match Discussion: Arsenal vs Chelsea",
    reason: "Offensive language and harassment",
    status: "Pending",
    date: "2 hours ago",
  },
  {
    id: 2,
    type: "Spam",
    reporter: "ModeratorX",
    reported: "SpamBot789",
    topic: "Season Ticket Exchange",
    reason: "Repeated promotional posts",
    status: "Resolved",
    date: "1 day ago",
  },
]

const sampleModerators = [
  {
    id: 1,
    name: "Alice Cooper",
    email: "alice@example.com",
    role: "Senior Moderator",
    permissions: ["Delete Posts", "Ban Users", "Pin Topics", "Lock Topics"],
    joinDate: "Jan 2024",
    status: "Active",
  },
  {
    id: 2,
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "Moderator",
    permissions: ["Delete Posts", "Pin Topics"],
    joinDate: "Mar 2024",
    status: "Active",
  },
]

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inter Club Forum Management</h1>
            <p className="text-muted-foreground">Manage discussions, moderation, and community interactions</p>
          </div>
          <CreateTopicModal />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Forum Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {forumStats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sampleTopics.slice(0, 3).map((topic) => (
                      <div key={topic.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {topic.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{topic.title}</p>
                            {topic.isPinned && <Pin className="w-3 h-3 text-primary" />}
                            {topic.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            by {topic.author} • {topic.replies} replies • {topic.lastActivity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moderation Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sampleReports
                      .filter((r) => r.status === "Pending")
                      .map((report) => (
                        <div key={report.id} className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{report.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.reporter} reported {report.reported} • {report.date}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Forum Topics</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="match">Match Discussion</SelectItem>
                        <SelectItem value="tickets">Tickets</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Replies</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTopics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {topic.isPinned && <Pin className="w-4 h-4 text-primary" />}
                            {topic.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                            <span className="font-medium">{topic.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{topic.author}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{topic.category}</Badge>
                        </TableCell>
                        <TableCell>{topic.replies}</TableCell>
                        <TableCell>{topic.views}</TableCell>
                        <TableCell>
                          <Badge variant={topic.status === "Active" ? "default" : "secondary"}>{topic.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              {topic.isPinned ? <Pin className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm">
                              {topic.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reported Content</CardTitle>
                <CardDescription>Review and manage reported posts and users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">{report.type}</Badge>
                        </TableCell>
                        <TableCell>{report.reporter}</TableCell>
                        <TableCell>{report.reported}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.topic}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === "Pending" ? "destructive" : "default"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderators" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Forum Moderators</CardTitle>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Add Moderator
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleModerators.map((moderator) => (
                      <TableRow key={moderator.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {moderator.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{moderator.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{moderator.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{moderator.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {moderator.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            {moderator.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{moderator.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{moderator.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant="default">{moderator.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Settings</CardTitle>
                <CardDescription>Configure forum behavior and moderation rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-moderation">Auto Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically flag posts with inappropriate content
                      </p>
                    </div>
                    <Switch id="auto-moderation" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="member-approval">Member Approval Required</Label>
                      <p className="text-sm text-muted-foreground">New members need approval before posting</p>
                    </div>
                    <Switch id="member-approval" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="anonymous-posting">Allow Anonymous Posting</Label>
                      <p className="text-sm text-muted-foreground">Members can post without revealing identity</p>
                    </div>
                    <Switch id="anonymous-posting" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for new posts and replies
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="max-posts">Maximum Posts Per Day</Label>
                    <Input id="max-posts" type="number" defaultValue="10" className="w-32" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="banned-words">Banned Words (comma separated)</Label>
                    <Textarea id="banned-words" placeholder="Enter words to automatically flag or block" rows={3} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="welcome-message">Welcome Message for New Members</Label>
                    <Textarea
                      id="welcome-message"
                      placeholder="Enter a welcome message that new forum members will see"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Forum Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
