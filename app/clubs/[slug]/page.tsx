"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, News, Event } from "@/lib/api"
import { getNewsImageUrl } from "@/lib/config"
import { 
  Globe, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  Newspaper, 
  Vote, 
  Music, 
  Store,
  ArrowLeft,
  Home,
  Search,
  User,
  Eye,
  MapPin,
  Clock
} from "lucide-react"
import Link from "next/link"

interface ClubSettings {
  websiteSetup: {
    title: string
    description: string
    contactEmail: string
    contactPhone: string
    isPublished: boolean
    sections: Record<string, boolean>
  }
  designSettings: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    logo: string | null
    motto: string
  }
}

interface Club {
  _id: string
  name: string
  description?: string
  logo?: string
  status: string
}

export default function PublicClubPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [news, setNews] = useState<News[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

  useEffect(() => {
    if (slug) {
      loadClubData()
    }
  }, [slug])

  const loadClubData = async () => {
    try {
      setLoading(true)
      
      const clubResponse = await apiClient.getClubById(slug, true)
      if (clubResponse.success && clubResponse.data) {
        setClub(clubResponse.data)
      }

      const settingsResponse = await apiClient.getClubSettings(slug, true)
      if (settingsResponse.success && settingsResponse.data) {
        const actualData = settingsResponse.data.data || settingsResponse.data
        setSettings(actualData)
        
        const websiteSetup = actualData.websiteSetup || {}
        if (websiteSetup.sections?.news || websiteSetup.sections?.events) {
          if (websiteSetup.sections?.news) {
            setActiveTab("news")
          } else if (websiteSetup.sections?.events) {
            setActiveTab("events")
          }
          await loadContent(clubResponse.data?._id || slug, actualData)
        }
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const loadContent = async (clubIdOrSlug: string, settingsData?: ClubSettings) => {
    try {
      setLoadingContent(true)
      
      const currentSettings = settingsData || settings
      if (!currentSettings) return
      
      const clubId = club?._id || clubIdOrSlug
      
      const promises: Promise<any>[] = []
      
      if (currentSettings.websiteSetup.sections.news) {
        promises.push(apiClient.getPublicNews(clubId))
      }
      
      if (currentSettings.websiteSetup.sections.events) {
        promises.push(apiClient.getPublicEvents(clubId))
      }
      
      if (promises.length === 0) return
      
      const results = await Promise.all(promises)
      
      if (currentSettings.websiteSetup.sections.news && results[0]?.success) {
        const newsData = Array.isArray(results[0].data) ? results[0].data : (results[0].data as any)?.news || []
        setNews(newsData)
      }
      
      if (currentSettings.websiteSetup.sections.events) {
        const eventsIndex = currentSettings.websiteSetup.sections.news ? 1 : 0
        if (results[eventsIndex]?.success) {
          const eventsData = Array.isArray(results[eventsIndex].data) ? results[eventsIndex].data : (results[eventsIndex].data as any)?.events || []
          setEvents(eventsData)
        }
      }
    } catch (error) {
      console.error("Error loading content:", error)
    } finally {
      setLoadingContent(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!club || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Club Not Found</CardTitle>
            <CardDescription className="text-base mt-2">
              The club you're looking for doesn't exist or has been removed. 
              Please check the URL or try searching for another club.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid gap-3 pt-2">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/clubs" className="w-full">
                <Button variant="outline" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Explore Other Clubs
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/50 py-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Need help? <Link href="/dashboard/help" className="text-primary hover:underline font-medium">Contact Support</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const { websiteSetup, designSettings } = settings
  
  if (!websiteSetup.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Website Coming Soon</CardTitle>
            <CardDescription className="text-base mt-2">
              The public website for <strong>{club.name}</strong> is currently being set up. 
              Please check back later!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid gap-3 pt-2">
              <Link href="/" className="w-full">
                <Button variant="default" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/50 py-4 mt-2">
            <p className="text-sm text-muted-foreground">
              © 2025 RallyUp Solutions
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const title = websiteSetup.title || club.name
  const description = websiteSetup.description || club.description

  const primaryColor = designSettings.primaryColor || "#3b82f6"

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-24 lg:py-40">
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor} 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.08] pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`,
            filter: 'blur(120px)'
          }}
        />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            {(designSettings.logo || club.logo) && (
              <div className="flex justify-center animate-scale-in">
                <div className="relative group">
                  <div className="absolute -inset-6 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700 opacity-60" />
                  <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] bg-card border shadow-2xl flex items-center justify-center overflow-hidden rotate-3 hover:rotate-0 transition-all duration-500 ring-4 ring-background">
                    <img 
                      src={designSettings.logo || club.logo} 
                      alt={title}
                      className="w-full h-full object-cover p-3"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 animate-slide-up">
              <h1 
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1]"
                style={{ color: primaryColor }}
              >
                {title}
              </h1>

              {designSettings.motto && (
                <div className="relative inline-block px-8 py-3">
                  <div className="absolute inset-0 bg-primary/5 blur-md rounded-2xl" />
                  <p className="relative text-2xl md:text-3xl font-semibold italic text-muted-foreground/90 leading-relaxed">
                    "{designSettings.motto}"
                  </p>
                </div>
              )}
            </div>

            {description && (
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {description}
              </p>
            )}

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href={`/clubs/?search=${club?.name}`} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:px-12 h-16 text-xl font-bold shadow-xl hover:shadow-primary/25 transition-all rounded-2xl group"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <Users className="mr-3 h-7 w-7 group-hover:scale-110 transition-transform" />
                  Join Our Club
                </Button>
              </Link>
              <Link href={`/login`} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:px-12 h-16 text-xl font-bold bg-background/50 backdrop-blur-md border-2 hover:bg-muted/50 rounded-2xl">
                  Member Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-5 text-base font-bold">
            {websiteSetup.contactEmail && (
              <a 
                href={`mailto:${websiteSetup.contactEmail}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                {websiteSetup.contactEmail}
              </a>
            )}
            {websiteSetup.contactPhone && (
              <a 
                href={`tel:${websiteSetup.contactPhone}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                {websiteSetup.contactPhone}
              </a>
            )}
            <div className="flex items-center gap-3 text-muted-foreground group">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <Globe className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              Official Supporters Club
            </div>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-6 py-28 md:py-40">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Our Community Hub</h2>
            <div className="w-24 h-2 bg-primary mx-auto rounded-full" style={{ backgroundColor: primaryColor }} />
            <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Everything you need to stay connected with the club and fellow supporters.
            </p>
          </div>

          {(websiteSetup.sections.news || websiteSetup.sections.events) && (
            <div className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 h-14 bg-muted/50">
                  {websiteSetup.sections.news && (
                    <TabsTrigger 
                      value="news" 
                      className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md"
                      style={{ 
                        color: activeTab === 'news' ? primaryColor : undefined 
                      }}
                    >
                      <Newspaper className="h-5 w-5 mr-2" />
                      News & Updates
                    </TabsTrigger>
                  )}
                  {websiteSetup.sections.events && (
                    <TabsTrigger 
                      value="events"
                      className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md"
                      style={{ 
                        color: activeTab === 'events' ? primaryColor : undefined 
                      }}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Events & Activities
                    </TabsTrigger>
                  )}
                </TabsList>

                {websiteSetup.sections.news && (
                  <TabsContent value="news" className="mt-8">
                    <Card className="border-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Newspaper className="h-6 w-6" style={{ color: primaryColor }} />
                          </div>
                          Latest News & Updates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingContent ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                          </div>
                        ) : news.length > 0 ? (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {news.map((article) => (
                              <Card key={article._id} className="hover:shadow-lg transition-all border-2">
                                {article.featuredImage && (
                                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                                    <img
                                      src={getNewsImageUrl(article.featuredImage)}
                                      alt={article.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )}
                                <CardHeader>
                                  <div className="flex items-center gap-2 mb-2">
                                    {article.category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {article.category}
                                      </Badge>
                                    )}
                                    {article.priority && (
                                      <Badge 
                                        variant={article.priority === 'high' ? 'destructive' : 'outline'}
                                        className="text-xs"
                                      >
                                        {article.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                                  {article.summary && (
                                    <CardDescription className="line-clamp-3 mt-2">
                                      {article.summary}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {article.author}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {article.viewCount !== undefined && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                      <Eye className="w-4 h-4" />
                                      {article.viewCount} views
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg text-muted-foreground">No news articles available yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {websiteSetup.sections.events && (
                  <TabsContent value="events" className="mt-8">
                    <Card className="border-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-3xl font-bold flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6" style={{ color: primaryColor }} />
                          </div>
                          Upcoming Events & Activities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingContent ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                          </div>
                        ) : events.length > 0 ? (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => (
                              <Card key={event._id} className="hover:shadow-lg transition-all border-2">
                                <CardHeader>
                                  <div className="flex items-start justify-between mb-2">
                                    {event.isActive !== undefined && (
                                      <Badge 
                                        variant={event.isActive ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {event.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    )}
                                    {event.ticketPrice !== undefined && event.ticketPrice > 0 && (
                                      <Badge variant="outline" className="text-xs font-bold">
                                        ₹{event.ticketPrice}
                                      </Badge>
                                    )}
                                  </div>
                                  <CardTitle className="text-xl line-clamp-2">{event.title}</CardTitle>
                                  {event.description && (
                                    <CardDescription className="line-clamp-3 mt-2">
                                      {event.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {(event.eventDate || event.startTime) && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span>{new Date(event.eventDate || event.startTime).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}</span>
                                    </div>
                                  )}
                                  {(event.eventTime || event.startTime) && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {event.eventTime || new Date(event.startTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {event.venue && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span className="line-clamp-1">{event.venue}</span>
                                    </div>
                                  )}
                                  {event.maxAttendees && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Users className="w-4 h-4" />
                                      <span>
                                        {event.currentAttendees || 0} / {event.maxAttendees} attendees
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg text-muted-foreground">No events available yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {(websiteSetup.sections.store || websiteSetup.sections.merchandise) && (
              <Card className="group hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-2xl rounded-3xl overflow-hidden border-2">
                <CardHeader className="space-y-6 p-8">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Store className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="space-y-4">
                    <CardTitle className="text-2xl font-bold">Merchandise Store</CardTitle>
                    <CardDescription className="text-lg leading-relaxed font-medium">
                      Get your hands on official club merchandise and exclusive supporter gear.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {websiteSetup.sections.polls && (
              <Card className="group hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-2xl rounded-3xl overflow-hidden border-2">
                <CardHeader className="space-y-6 p-8">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Vote className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="space-y-4">
                    <CardTitle className="text-2xl font-bold">Polls & Voting</CardTitle>
                    <CardDescription className="text-lg leading-relaxed font-medium">
                      Have your say in club decisions and share your opinions through community polls.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {websiteSetup.sections.chants && (
              <Card className="group hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-2xl rounded-3xl overflow-hidden border-2">
                <CardHeader className="space-y-6 p-8">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Music className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="space-y-4">
                    <CardTitle className="text-2xl font-bold">Club Chants</CardTitle>
                    <CardDescription className="text-lg leading-relaxed font-medium">
                      Learn the signature chants and anthems that make our match days legendary.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {websiteSetup.sections.members && (
              <Card className="group hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-2xl rounded-3xl overflow-hidden border-2">
                <CardHeader className="space-y-6 p-8">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Users className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="space-y-4">
                    <CardTitle className="text-2xl font-bold">Member Directory</CardTitle>
                    <CardDescription className="text-lg leading-relaxed font-medium">
                      Connect with thousands of fellow supporters and expand our community.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 border-t overflow-hidden relative py-32 md:py-48">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h3 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">Be Part of the Journey</h3>
            <p className="text-muted-foreground text-2xl md:text-3xl leading-relaxed max-w-3xl mx-auto">
              Join <strong>{club.name}</strong> today and unlock access to exclusive content, 
              priority event booking, and a global network of passionate fans.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
              <Link href={`/register?club=${club?._id || slug}`} className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  className="w-full sm:px-16 h-20 text-2xl font-black shadow-2xl hover:scale-105 transition-all rounded-[2rem]"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Become a Member
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-20 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center space-y-10">
            <p className="text-lg text-muted-foreground text-center max-w-xl leading-relaxed font-medium">
              Powering the next generation of sports communities and supporters clubs worldwide.
            </p>
            <div className="text-sm text-slate-400 font-medium pt-4">
              © 2025 RallyUp Solutions Private Limited. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
