"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import NewsReadMoreModal from "@/components/modals/news-readmore-modal"
import { apiClient, Event, News, User, Admin } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, MapPin, Clock, Users, Newspaper, Tag, User as UserIcon, Eye, Building2, CreditCard, Crown, Star, Shield, InfinityIcon } from "lucide-react"
import EventDetailsModal from '@/components/modals/event-details-modal'
import { MembershipStatus } from "@/components/membership-status"
import { PromotionFeed } from "@/components/promotion-feed"
import { PollsWidget } from "@/components/polls-widget"

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)

  // Get user's active club membership
  const getActiveMembership = () => {
    if (!user || user.role === 'system_owner') return null;
    
    const userMemberships = (user as User | Admin).memberships || [];
    return userMemberships.find(m => m.status === 'active');
  }

  const activeMembership = getActiveMembership();
  const userClub = activeMembership?.club_id;

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'Member';
    
    // Try to get name from different possible sources
    if (user.name) {
      return user.name;
    }
    
    // Check if we have first_name and last_name
    if (user && typeof user === 'object') {
      const userAny = user as any;
      if (userAny.first_name && userAny.last_name) {
        return `${userAny.first_name} ${userAny.last_name}`;
      }
      if (userAny.first_name) {
        return userAny.first_name;
      }
      if (userAny.last_name) {
        return userAny.last_name;
      }
    }
    
    return 'Member';
  }

  useEffect(() => {
    console.log('User dashboard - User object:', user)
    console.log('Active membership:', activeMembership)
    console.log('User club:', userClub)
    fetchData()
  }, [user, activeMembership, userClub])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Check if user has an active club membership
      if (!activeMembership || !userClub) {
        console.log('User has no active club membership:', { activeMembership, userClub })
        toast.error("You need to have an active club membership to view news and events")
        setLoading(false)
        return
      }
      
      console.log('User club:', userClub)
      console.log('User club ID:', userClub._id)
      
      // Fetch public events and club-specific news
      const [eventsResponse, newsResponse] = await Promise.all([
        apiClient.getPublicEvents(),
        apiClient.getNewsByUserClub()
      ])

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data.events || eventsResponse.data)
      }

      if (newsResponse.success && newsResponse.data) {
        console.log('News response:', newsResponse)
        console.log('News data:', newsResponse.data)
        console.log('News array:', newsResponse.data.news || newsResponse.data)
        setNews(newsResponse.data.news || newsResponse.data)
      } else {
        console.error('News response failed:', newsResponse)
        console.error('News error details:', newsResponse.error)
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
      toast.error("Please log in to register for event")
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

  const handleReadMore = (newsItem: News) => {
    setSelectedNewsForReadMore(newsItem)
    setShowReadMoreModal(true)
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
    return (event.currentAttendees ?? 0) >= (event.maxAttendees ?? 0)
  }

  const isEventPast = (event: Event) => {
    return new Date(event.startTime) < new Date()
  }

  const isEventOngoing = (event: Event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = event.endTime ? new Date(event.endTime) : null
    if (end) {
      return start <= now && now < end
    }
    // If no end time, consider ongoing if startTime is in the past and it's not marked as past by existing logic
    return start <= now && !isEventPast(event)
  }

  const eventsUserIsRegisteredForOngoing = () => {
    if (!user) return [] as Event[]
    return (events || []).filter(ev => {
      const regs = ev.registrations || []
      const found = regs.find(r => r.userId === user._id)
      return !!found && isEventOngoing(ev)
    })
  }

  // Get membership plan icon
  const getPlanIcon = (planName?: string) => {
    if (!planName) return <Calendar className="w-4 h-4" />
    
    const lowerPlan = planName.toLowerCase()
    if (lowerPlan.includes('premium') || lowerPlan.includes('gold')) return <Crown className="w-4 h-4" />
    if (lowerPlan.includes('basic') || lowerPlan.includes('standard')) return <Shield className="w-4 h-4" />
    if (lowerPlan.includes('advanced') || lowerPlan.includes('pro')) return <Star className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {getUserDisplayName()}!</h1>
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
                  {(events || []).filter(e => !isEventPast(e)).length}
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
                <div className="text-2xl font-bold">{(news || []).length}</div>
                <p className="text-xs text-muted-foreground">
                  Published articles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership Status</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeMembership ? (
                    <div className="flex items-center gap-2">
                      {getPlanIcon(activeMembership.membership_level_id.name)}
                      <span className="text-lg">{activeMembership.membership_level_id.name}</span>
                    </div>
                  ) : (
                    "No Active"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeMembership ? 'Active Membership' : 'No active membership'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Club Membership Status */}
          <MembershipStatus />

          {/* Events and News Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events">Events ({eventsUserIsRegisteredForOngoing().length})</TabsTrigger>
              <TabsTrigger value="news">News & Updates ({news.filter(article => article.isPublished).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading events...</p>
                  </div>
                </div>
              ) : (events || []).length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No events available</h3>
                      <p className="text-muted-foreground">
                        {userClub ? 
                          "No events have been published for your club yet. Check back later for upcoming events." :
                          "You need to have an active club membership to view events."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Ongoing events the user has registered for (inside Upcoming tab) */}
                  <div className="mt-4">
                    <h4 className="text-md font-semibold">Ongoing events</h4>
                    <p className="text-sm text-muted-foreground mb-3">Ongoing events that you've registered for</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {eventsUserIsRegisteredForOngoing().length === 0 ? (
                        <Card>
                          <CardContent className="text-center py-6">
                            <p className="text-sm text-muted-foreground">No ongoing events that you're registered for right now.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        eventsUserIsRegisteredForOngoing().map(event => (
                          <Card key={event._id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                                </div>
                                <Badge variant={event.isPublished ? "default" : "secondary"} className="ml-2 flex-shrink-0">{event.category}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{formatDate(event.startTime)}</span></div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="truncate">{event.venue}</span></div>
                              </div>
                              <div className="pt-2">
                                <Button onClick={() => { setSelectedEventForDetails(event); setShowEventDetailsModal(true) }} className="w-full">View event</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Events Summary */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Upcoming Events</h3>
                      <p className="text-sm text-muted-foreground">
                        {events.filter(e => !isEventPast(e)).length} events available
                      </p>
                    </div>
                  </div>



                  {/* Events Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(events || [])
                      .filter(event => !isEventPast(event))
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((event) => (
                      <Card key={event._id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {event.description}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={event.isPublished ? "default" : "secondary"}
                              className="ml-2 flex-shrink-0"
                            >
                              {event.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatDate(event.startTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs">
                                {event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attendees
                              </span>
                            </div>
                          </div>
                          
                          {/* Attendance Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Capacity</span>
                              {event.maxAttendees && (
                                <span>{getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees)}%</span>
                              )}
                            </div>
                            {event.maxAttendees ? (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 90 
                                      ? 'bg-red-500' 
                                      : getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees) >= 75 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(getAttendancePercentage(event.currentAttendees || 0, event.maxAttendees), 100)}%` 
                                  }}
                                ></div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <InfinityIcon className="h-3 w-3" />
                                <span>Unlimited capacity</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-2">
                            {event.maxAttendees && isEventFull(event) ? (
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
                  {/* Past Events Notice */}
                  {events.filter(e => isEventPast(e)).length > 0 && (
                    <Card className="border-dashed">
                      <CardContent className="flex items-center justify-center py-4">
                        <div className="text-center text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {events.filter(e => isEventPast(e)).length} past events are hidden
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
              ) : (news || []).length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No news available</h3>
                      <p className="text-muted-foreground">
                        {userClub ? 
                          "No news articles have been published for your club yet. Check back later for updates." :
                          "You need to have an active club membership to view news articles."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* News Summary */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Latest News & Updates</h3>
                      <p className="text-sm text-muted-foreground">
                        {news.filter(article => article.isPublished).length} published articles
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {userClub?.name || 'Your Club'}
                    </Badge>
                  </div>

                  {/* News Articles */}
                  <div className="space-y-4">
                    {(() => {
                      const publishedNews = (news || []).filter(article => article.isPublished)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 6); // Show only latest 6 articles
                      
                      return publishedNews.map((article) => (
                        <Card key={article._id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" />
                                    {article.author}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(article.createdAt)}
                                  </span>
                                  {article.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {article.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                {article.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <p className="text-muted-foreground leading-relaxed">
                                {truncateText(article.content, 250)}
                              </p>
                              
                              {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {article.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              <div className="pt-2 border-t">
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleReadMore(article)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Read Full Article
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    })()}
                  </div>

                  {/* Show More News Button */}
                  {news.filter(article => article.isPublished).length > 6 && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = "/dashboard/user/news"}
                        className="px-8"
                      >
                        <Newspaper className="w-4 h-4 mr-2" />
                        View All News Articles
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Promotion Feed */}
          {userClub && (
            <PromotionFeed 
              clubId={userClub._id} 
              limit={2} 
              showStats={false} 
            />
          )}

          {/* Polls Widget */}
          {userClub && (
            <PollsWidget limit={3} showCreateButton={false} />
          )}

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
                  onClick={() => window.location.href = "/dashboard/settings"}
                >
                  <UserIcon className="w-6 h-6" />
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

        {/* Read More News Modal */}
        <NewsReadMoreModal
          news={selectedNewsForReadMore}
          isOpen={showReadMoreModal}
          onClose={() => {
            setShowReadMoreModal(false)
            setSelectedNewsForReadMore(null)
          }}
        />
        <EventDetailsModal
          event={selectedEventForDetails}
          isOpen={showEventDetailsModal}
          onClose={() => { setShowEventDetailsModal(false); setSelectedEventForDetails(null) }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 