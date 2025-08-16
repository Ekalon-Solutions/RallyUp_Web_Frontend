"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient, Event, News } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, MapPin, Clock, Users, Newspaper, Tag, User, Eye, Building2, CreditCard } from "lucide-react"
import { MembershipStatus } from "@/components/membership-status"

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch public events and news
      const [eventsResponse, newsResponse] = await Promise.all([
        apiClient.getPublicEvents(),
        apiClient.getPublicNews()
      ])

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data)
      }

      if (newsResponse.success && newsResponse.data) {
        setNews(newsResponse.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error loading dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleEventRegistration = async (eventId: string) => {
    if (!user) {
      toast.error("Please log in to register for events")
      return
    }

    try {
      const response = await apiClient.registerForEvent(eventId, user._id)
      if (response.success) {
        toast.success("Successfully registered for event!")
        fetchData() // Refresh events to update attendance
      } else {
        toast.error(response.error || "Failed to register for event")
      }
    } catch (error) {
      console.error("Error registering for event:", error)
      toast.error("Error registering for event")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const getAttendancePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const isEventFull = (event: Event) => {
    return event.currentAttendees >= event.maxAttendees
  }

  const isEventPast = (event: Event) => {
    const eventDate = new Date(event.date + 'T' + event.time)
    return eventDate < new Date()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">Stay updated with the latest events and news from your supporter group</p>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {events.filter(e => !isEventPast(e)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Events you can attend
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest News</CardTitle>
                <Newspaper className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{news.length}</div>
                <p className="text-xs text-muted-foreground">
                  Published articles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user?.isPhoneVerified ? "Verified" : "Unverified"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Phone verification status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Club Membership Status */}
          <MembershipStatus />

          {/* Events and News Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="news">News & Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading events...</p>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No events available</h3>
                      <p className="text-muted-foreground">Check back later for upcoming events</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {events
                    .filter(event => !isEventPast(event))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => (
                    <Card key={event._id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {event.description}
                            </CardDescription>
                          </div>
                          <Badge variant={event.isPublished ? "default" : "secondary"}>
                            {event.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {event.currentAttendees}/{event.maxAttendees} attendees
                              ({getAttendancePercentage(event.currentAttendees, event.maxAttendees)}% full)
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          {isEventFull(event) ? (
                            <Button disabled className="w-full" variant="secondary">
                              Event Full
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleEventRegistration(event._id)}
                              className="w-full"
                            >
                              Register for Event
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="news" className="space-y-4">
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
                      <h3 className="text-lg font-semibold">No news available</h3>
                      <p className="text-muted-foreground">Check back later for updates</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {news
                    .filter(article => article.isPublished)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((article) => (
                    <Card key={article._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{article.title}</CardTitle>
                            <CardDescription>
                              By {article.author} • {formatDate(article.createdAt)}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {article.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-muted-foreground">
                            {truncateText(article.content, 200)}
                          </p>
                          
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
                          
                          <div className="pt-2">
                            <Button variant="outline" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              Read Full Article
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => window.location.href = "/dashboard/user/profile"}
                >
                  <User className="w-6 h-6" />
                  <span>Update Profile</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => window.location.href = "/dashboard/user/membership-card"}
                >
                  <CreditCard className="w-6 h-6" />
                  <span>View Card</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => window.location.href = "/dashboard/user/events"}
                >
                  <Calendar className="w-6 h-6" />
                  <span>View All Events</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => window.location.href = "/dashboard/user/news"}
                >
                  <Newspaper className="w-6 h-6" />
                  <span>Read News</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 