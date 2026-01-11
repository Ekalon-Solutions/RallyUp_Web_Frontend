"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, News, Event } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, ExternalLink, Newspaper, Calendar, User, Eye } from "lucide-react"

const navigationOptions = [
  { id: "news", label: "News", description: "Appears just below 'welcome' text near top of site" },
  { id: "events", label: "Events", description: "Recommended. Populate your events for the season" },
  { id: "where-we-meet", label: "Where we meet", description: "Show meeting locations and venues" },
  { id: "about", label: "About", description: "Recommended. Anchors to top of 'About' section" },
  { id: "tickets", label: "Tickets", description: "Show upcoming events and ticket sales" },
  { id: "membership", label: "Membership", description: "Can show invitation to join or full registration form" },
  { id: "leadership", label: "Leadership", description: "Display club leadership and bios" },
  { id: "community", label: "Community", description: "Community features and social content" },
  { id: "store", label: "Store", description: "Recommended if you will have merchandise throughout the season" },
  { id: "gallery", label: "Gallery", description: "Photo gallery from events and activities" },
  { id: "fixtures", label: "Match Fixtures", description: "Upcoming match schedule" },
  { id: "away-days", label: "Away Day Info", description: "Travel and accommodation for away matches" },
  { id: "member-stories", label: "Member Stories", description: "Share stories from club members" },
  { id: "chants", label: "Chants & Songs", description: "Club anthems and supporter chants" },
  { id: "sponsors", label: "Sponsors", description: "Showcase sponsors and partners" },
  { id: "match-day", label: "Match Day Info", description: "Info about upcoming match days" },
]

export default function WebsitePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id
  const clubSlug = (user as any)?.club?.slug || (user as any)?.club_id?.slug

  const [websiteSettings, setWebsiteSettings] = useState({
    published: false,
    url: "",
    navigation: {} as Record<string, boolean>,
    welcomeText: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
    matchUpdates: {
      twitter: "",
    },
  })

  const [designSettings, setDesignSettings] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    fontFamily: "Inter",
    logo: null as string | null,
    motto: "",
  })

  const [previewNews, setPreviewNews] = useState<News[]>([])
  const [previewEvents, setPreviewEvents] = useState<Event[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  const loadSettings = useCallback(async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const websiteSetup = actualData.websiteSetup || {}
        const currentDesignSettings = actualData.designSettings || {}
        
        setDesignSettings({
          primaryColor: currentDesignSettings.primaryColor || "#3b82f6",
          secondaryColor: currentDesignSettings.secondaryColor || "#8b5cf6",
          fontFamily: currentDesignSettings.fontFamily || "Inter",
          logo: currentDesignSettings.logo || null,
          motto: currentDesignSettings.motto || "",
        })

        setWebsiteSettings({
          published: websiteSetup.isPublished || false,
          url: clubSlug ? `${window.location.origin}/clubs/${clubSlug}` : "",
          navigation: websiteSetup.sections || {},
          welcomeText: websiteSetup.description || "",
          socialLinks: {
            facebook: currentDesignSettings.socialMedia?.facebook || "",
            twitter: currentDesignSettings.socialMedia?.twitter || "",
            instagram: currentDesignSettings.socialMedia?.instagram || "",
          },
          matchUpdates: {
            twitter: currentDesignSettings.socialMedia?.twitter || "", // Using twitter link as fallback
          },
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load website settings")
    } finally {
      setLoading(false)
    }
  }, [clubId, clubSlug])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Load preview data when news or events sections are selected
  useEffect(() => {
    const loadPreviewData = async () => {
      if (!clubId) return
      
      const hasNews = websiteSettings.navigation.news
      const hasEvents = websiteSettings.navigation.events
      
      if (!hasNews && !hasEvents) {
        setPreviewNews([])
        setPreviewEvents([])
        return
      }

      try {
        setLoadingPreview(true)
        const promises: Promise<any>[] = []
        
        if (hasNews) {
          promises.push(apiClient.getPublicNews(clubId))
        }
        
        if (hasEvents) {
          promises.push(apiClient.getPublicEvents(clubId))
        }
        
        const results = await Promise.all(promises)
        
        if (hasNews && results[0]?.success) {
          const newsData = Array.isArray(results[0].data) ? results[0].data : (results[0].data as any)?.news || []
          setPreviewNews(newsData.slice(0, 3)) // Show only first 3
        }
        
        if (hasEvents) {
          const eventsIndex = hasNews ? 1 : 0
          if (results[eventsIndex]?.success) {
            const eventsData = Array.isArray(results[eventsIndex].data) ? results[eventsIndex].data : (results[eventsIndex].data as any)?.events || []
            setPreviewEvents(eventsData.slice(0, 3)) // Show only first 3
          }
        }
      } catch (error) {
        console.error("Error loading preview data:", error)
      } finally {
        setLoadingPreview(false)
      }
    }

    loadPreviewData()
  }, [clubId, websiteSettings.navigation.news, websiteSettings.navigation.events])

  const handleNavigationChange = (item: string, checked: boolean) => {
    setWebsiteSettings((prev) => ({
      ...prev,
      navigation: { ...prev.navigation, [item]: checked },
    }))
  }

  const handleSave = async () => {
    if (!clubId) return

    try {
      setSaving(true)
      
      // We need to update both website setup and design settings (for social links)
      const websiteResponse = await apiClient.updateWebsiteSetup(clubId, {
        title: (user as any)?.club?.name || "My Club", // Use club name as title
        description: websiteSettings.welcomeText,
        contactEmail: (user as any)?.club?.contactEmail || "",
        contactPhone: (user as any)?.club?.contactPhone || "",
        isPublished: websiteSettings.published,
        sections: websiteSettings.navigation,
      })

      const designResponse = await apiClient.updateDesignSettings(clubId, {
        ...designSettings,
        socialMedia: {
          facebook: websiteSettings.socialLinks.facebook,
          twitter: websiteSettings.socialLinks.twitter,
          instagram: websiteSettings.socialLinks.instagram,
          youtube: "",
        }
      })

      if (websiteResponse.success && designResponse.success) {
        toast.success("Website settings saved successfully")
        loadSettings()
      } else {
        toast.error("Failed to save some settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Error saving website settings")
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!clubId) return

    try {
      setPublishing(true)
      const response = await apiClient.updateWebsiteSetup(clubId, {
        title: (user as any)?.club?.name || "My Club",
        description: websiteSettings.welcomeText,
        contactEmail: (user as any)?.club?.contactEmail || "",
        contactPhone: (user as any)?.club?.contactPhone || "",
        isPublished: true,
        sections: websiteSettings.navigation,
      })

      if (response.success) {
        setWebsiteSettings(prev => ({ ...prev, published: true }))
        toast.success("Website published successfully!")
      } else {
        toast.error(response.message || "Failed to publish website")
      }
    } catch (error) {
      console.error("Error publishing website:", error)
      toast.error("Error publishing website")
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10 py-8 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Club Website</h1>
            <p className="text-muted-foreground text-lg">Configure your hosted website for supporters group</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant={websiteSettings.published ? "default" : "secondary"} className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
              {websiteSettings.published ? "Live & Published" : "Draft / Unpublished"}
            </Badge>
            <Button 
              onClick={handlePublish} 
              disabled={publishing || websiteSettings.published}
              className="min-w-[160px] h-11 font-bold shadow-lg"
              size="lg"
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                websiteSettings.published ? "Site is Live" : "Publish Website"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-10">
          {/* Website Info */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-6 border-b bg-muted/20">
              <CardTitle className="text-2xl font-bold">Website Information</CardTitle>
              <CardDescription className="text-base leading-relaxed mt-2">
                Wingman Pro offers a hosted, single-page website for your supporters group with news, events, tickets,
                gallery, store, member registration, leader bios and more. Use of the website solution is ₹499/month
                (paid annually).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="grid gap-4">
                <Label htmlFor="website-url" className="text-base font-bold">Your URL (when published)</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input id="website-url" value={websiteSettings.url} readOnly className="bg-muted flex-1 font-mono text-sm h-12 border-2" />
                  {websiteSettings.url && (
                    <Button variant="outline" size="lg" onClick={() => window.open(websiteSettings.url, '_blank')} className="shrink-0 h-12 font-bold px-6 border-2">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Visit Site
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-2xl border-2 bg-primary/5">
                <div className="space-y-1">
                  <Label htmlFor="published" className="text-lg font-bold">Website Visibility</Label>
                  <p className="text-base text-muted-foreground">Make your website live and accessible to visitors</p>
                </div>
                <Switch
                  id="published"
                  checked={websiteSettings.published}
                  onCheckedChange={(checked) => setWebsiteSettings((prev) => ({ ...prev, published: checked }))}
                  className="scale-125"
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-6 border-b bg-muted/20">
              <CardTitle className="text-2xl font-bold">Navigation & Sections</CardTitle>
              <CardDescription className="text-base mt-2">
                Select up to 8 navigation items. Sections do not need navigation in header for content to appear in
                the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {navigationOptions.map((option) => (
                  <div key={option.id} className="relative flex items-start space-x-4 p-4 rounded-xl border-2 bg-card hover:bg-muted/30 transition-all hover:border-primary/30 group">
                    <div className="flex items-center h-6">
                      <Checkbox
                        id={option.id}
                        checked={websiteSettings.navigation[option.id] || false}
                        onCheckedChange={(checked) => handleNavigationChange(option.id, checked as boolean)}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={option.id} className="text-base font-bold leading-none cursor-pointer group-hover:text-primary transition-colors">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground leading-snug">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview Section - Show actual data for News and Events */}
              {(websiteSettings.navigation.news || websiteSettings.navigation.events) && (
                <div className="mt-8 pt-8 border-t space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Preview - Selected Sections</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      This is how your selected sections will appear on your website
                    </p>
                  </div>

                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* News Preview */}
                      {websiteSettings.navigation.news && (
                        <Card className="border-2">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Newspaper className="h-5 w-5" style={{ color: designSettings.primaryColor }} />
                              </div>
                              <CardTitle className="text-xl font-bold">News & Updates</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {previewNews.length > 0 ? (
                              previewNews.map((article) => (
                                <div key={article._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                  <h4 className="font-semibold text-base mb-2 line-clamp-2">{article.title}</h4>
                                  {article.summary && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {article.author}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                                    </span>
                                    {article.viewCount !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {article.viewCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No news articles available yet. Create news articles to see them here.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Events Preview */}
                      {websiteSettings.navigation.events && (
                        <Card className="border-2">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5" style={{ color: designSettings.primaryColor }} />
                              </div>
                              <CardTitle className="text-xl font-bold">Events & Activities</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {previewEvents.length > 0 ? (
                              previewEvents.map((event) => (
                                <div key={event._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                  <h4 className="font-semibold text-base mb-2 line-clamp-2">{event.title}</h4>
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                                    </span>
                                    {event.location && (
                                      <span className="line-clamp-1">{event.location}</span>
                                    )}
                                  </div>
                                  {event.ticketPrice !== undefined && event.ticketPrice > 0 && (
                                    <Badge variant="secondary" className="mt-2">
                                      ₹{event.ticketPrice}
                                    </Badge>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No events available yet. Create events to see them here.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Header & Intro */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-6 border-b bg-muted/20">
              <CardTitle className="text-2xl font-bold">Header, Intro & Section Breaks</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-4">
                <Label htmlFor="welcome-text" className="text-base font-bold">Welcome Message</Label>
                <Textarea
                  id="welcome-text"
                  placeholder="Enter a compelling welcome message for your website visitors..."
                  value={websiteSettings.welcomeText}
                  onChange={(e) => setWebsiteSettings((prev) => ({ ...prev, welcomeText: e.target.value }))}
                  rows={8}
                  className="resize-none text-lg border-2 p-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-6 border-b bg-muted/20">
              <CardTitle className="text-2xl font-bold">Social Media Integration</CardTitle>
              <CardDescription className="text-base mt-2">Connect your club's social presence</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 p-8 md:grid-cols-3">
              <div className="grid gap-3">
                <Label htmlFor="facebook" className="text-base font-bold">Facebook</Label>
                <Input
                  id="facebook"
                  placeholder="facebook.com/yourpage"
                  value={websiteSettings.socialLinks.facebook}
                  className="h-12 border-2"
                  onChange={(e) =>
                    setWebsiteSettings((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="twitter" className="text-base font-bold">Twitter / X</Label>
                <Input
                  id="twitter"
                  placeholder="twitter.com/yourhandle"
                  value={websiteSettings.socialLinks.twitter}
                  className="h-12 border-2"
                  onChange={(e) =>
                    setWebsiteSettings((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="instagram" className="text-base font-bold">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="instagram.com/yourhandle"
                  value={websiteSettings.socialLinks.instagram}
                  className="h-12 border-2"
                  onChange={(e) =>
                    setWebsiteSettings((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Match Updates */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-6 border-b bg-muted/20">
              <CardTitle className="text-2xl font-bold">Live Match Updates</CardTitle>
              <CardDescription className="text-base mt-2">Integrate live match day updates via Twitter/X feed</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4 max-w-xl">
                <Label htmlFor="twitter-updates" className="text-base font-bold">Twitter Handle for Updates</Label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3 text-muted-foreground font-bold">@</span>
                    <Input
                      id="twitter-updates"
                      placeholder="yourhandle"
                      className="pl-10 h-12 border-2 text-lg"
                      value={websiteSettings.matchUpdates.twitter.replace('https://twitter.com/', '').replace('https://x.com/', '')}
                      onChange={(e) =>
                        setWebsiteSettings((prev) => ({
                          ...prev,
                          matchUpdates: { ...prev.matchUpdates, twitter: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t pt-10 mt-6 pb-12">
          <p className="text-base text-muted-foreground font-medium italic">Changes are only visible on your site after saving.</p>
          <Button 
            size="lg" 
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto min-w-[240px] h-14 text-xl font-black shadow-xl"
          >
            {saving ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Website Settings"
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
