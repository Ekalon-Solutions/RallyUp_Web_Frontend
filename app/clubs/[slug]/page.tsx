"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, News, Event, Chant, Album } from "@/lib/api"
import { formatDisplayDate, slugify } from "@/lib/utils"
import { getNewsImageUrl } from "@/lib/config"
import {
  formatEventPriceDisplay,
  hasVenueTierMatrix,
  isEventPaid,
} from "@/lib/event-display-price"
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal"
import { RefundPolicyBadge } from "@/components/refund-policy-badge"
import { JointScreeningDisplay } from "@/components/events/joint-screening-display"
import { EventScheduleMeta } from "@/components/events/event-schedule-meta"
import { WaitlistDisplay } from "@/components/events/waitlist-display"
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal"
import { PurchaseFlowModal, setStoredPurchaseIntent, getStoredPurchaseIntent, clearStoredPurchaseIntent } from "@/components/modals/purchase-flow-modal"
import { CheckoutModal } from "@/components/modals/checkout-modal"
import NewsReadMoreModal from "@/components/modals/news-readmore-modal"
import { SocialBrandButton } from "@/components/club-public/social-platform-icons"
import { EkalonAttribution } from "@/components/ekalon-attribution"
import { ClubGallerySection } from "@/components/club-public/club-gallery-section"
import {
  Globe,
  Mail,
  Phone,
  Users,
  Calendar,
  Newspaper,
  Music,
  Store,
  ArrowLeft,
  Home,
  Search,
  User,
  Eye,
  MapPin,
  Clock,
  Images,
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
    heroImage: string | null
    motto: string
    socialMedia?: ClubSettingsSocialMedia | null
  }
}

interface ClubSettingsSocialMedia {
  facebook?: string
  twitter?: string
  instagram?: string
  youtube?: string
}

type SocialPlatform = "facebook" | "twitter" | "instagram" | "youtube"

function socialProfileHref(platform: SocialPlatform, raw: string | undefined | null): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith("//")) return `https:${s}`

  const handleMatch = s.match(/^@([\w.]+)$/)
  if (handleMatch) {
    const h = handleMatch[1]
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/${h}`
      case "twitter":
        return `https://twitter.com/${h}`
      case "instagram":
        return `https://www.instagram.com/${h}/`
      case "youtube":
        return `https://www.youtube.com/@${h}`
    }
  }
  return `https://${s.replace(/^\/+/, "")}`
}

function isSocialMediaObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v)
}

function getSocialMediaRecordFromClubSettings(settings: ClubSettings): Record<string, unknown> | null {
  const nested = settings.designSettings?.socialMedia
  if (!isSocialMediaObject(nested)) return null
  return nested
}

function pickSocialString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" ? v : undefined
}

function buildSocialLinksFromSocialMediaRecord(
  sm: Record<string, unknown>
): { platform: SocialPlatform; label: string; href: string }[] {
  const links: { platform: SocialPlatform; label: string; href: string }[] = []
  const fb = socialProfileHref("facebook", pickSocialString(sm, "facebook"))
  const tw = socialProfileHref("twitter", pickSocialString(sm, "twitter"))
  const ig = socialProfileHref("instagram", pickSocialString(sm, "instagram"))
  const yt = socialProfileHref("youtube", pickSocialString(sm, "youtube"))
  if (fb) links.push({ platform: "facebook", label: "Facebook", href: fb })
  if (tw) links.push({ platform: "twitter", label: "X (Twitter)", href: tw })
  if (ig) links.push({ platform: "instagram", label: "Instagram", href: ig })
  if (yt) links.push({ platform: "youtube", label: "YouTube", href: yt })
  return links
}

interface Club {
  _id: string
  name: string
  description?: string
  logo?: string
  status: string
  website?: string
}

export default function PublicClubPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [news, setNews] = useState<News[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [chants, setChants] = useState<Chant[]>([])
  const [galleryAlbums, setGalleryAlbums] = useState<Album[]>([])
  const [merchandise, setMerchandise] = useState<any[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

  const [eventForRegistration, setEventForRegistration] = useState<Event | null>(null)
  const [showPurchaseFlowModal, setShowPurchaseFlowModal] = useState(false)
  const [showEventCheckoutModal, setShowEventCheckoutModal] = useState(false)
  const [eventCheckoutAsGuest, setEventCheckoutAsGuest] = useState(false)
  const [showVenueTierCartModal, setShowVenueTierCartModal] = useState(false)
  const [purchaseFlowReason, setPurchaseFlowReason] = useState<"event" | "merchandise" | null>(null)
  const [merchandiseForQuickBuy, setMerchandiseForQuickBuy] = useState<any | null>(null)
  const [showMerchandiseCheckoutModal, setShowMerchandiseCheckoutModal] = useState(false)
  const [merchandiseCheckoutItems, setMerchandiseCheckoutItems] = useState<any[]>([])
  const [showReadMoreModal, setShowReadMoreModal] = useState(false)
  const [selectedNewsForReadMore, setSelectedNewsForReadMore] = useState<News | null>(null)


  useEffect(() => {
    const resume = searchParams.get("resumePurchase")
    if (resume !== "1" || !club?._id) return
    const intent = getStoredPurchaseIntent()
    if (!intent || intent.clubId !== club._id) return

    const clearParam = () => {
      clearStoredPurchaseIntent()
      const url = new URL(window.location.href)
      url.searchParams.delete("resumePurchase")
      window.history.replaceState({}, "", url.pathname + url.search)
    }

    if (intent.type === "event") {
      const eventId = intent.eventId
      const storedEvent = intent.event as Event | undefined
      const ev = storedEvent && storedEvent._id === eventId
        ? storedEvent
        : events.find((e) => e._id === eventId)
      if (!ev) return
      setEventForRegistration(ev)
      if (hasVenueTierMatrix(ev)) {
        setShowVenueTierCartModal(true)
      } else {
        setShowEventCheckoutModal(true)
      }
      clearParam()
      return
    }

    if (intent.type === "merchandise") {
      const item = intent.item
      if (item?._id && item?.club?._id) {
        setMerchandiseCheckoutItems([{ ...item, quantity: item.quantity ?? 1 }])
        setShowMerchandiseCheckoutModal(true)
      }
      clearParam()
    }
  }, [searchParams, club?._id, events])

  const encodeSearchParam = (value: string) =>
    encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

  const handleReadMoreNews = async (article: News) => {
    try {
      const res = await apiClient.getPublicNewsById(article._id)
      if (res.success && res.data) {
        setSelectedNewsForReadMore(res.data as News)
        setNews((prev) => prev.map((n) => (n._id === article._id ? (res.data as News) : n)))
      } else {
        setSelectedNewsForReadMore(article)
      }
    } catch {
      setSelectedNewsForReadMore(article)
    }
    setShowReadMoreModal(true)
  }

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
        const storeEnabled = Boolean(websiteSetup.sections?.store || websiteSetup.sections?.merchandise)
        const firstTab =
          (websiteSetup.sections?.events && "events") ||
          (websiteSetup.sections?.news && "news") ||
          (storeEnabled && "store") ||
          (websiteSetup.sections?.gallery && "gallery") ||
          (websiteSetup.sections?.chants && "chants") ||
          ""

        if (firstTab) {
          setActiveTab(firstTab)
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

      const sections = currentSettings.websiteSetup.sections || ({} as any)
      const storeEnabled = Boolean(sections.store || sections.merchandise)

      const requests: Record<string, Promise<any>> = {}

      if (sections.news) requests.news = apiClient.getPublicNews(clubId)
      if (sections.events) requests.events = apiClient.getPublicEvents(clubId)
      if (storeEnabled) requests.store = apiClient.getPublicMerchandise({ clubId, limit: 12 })
      if (sections.chants) requests.chants = apiClient.getPublicChants({ clubId, limit: 20 })
      if (sections.gallery) requests.gallery = apiClient.getPublicGalleryAlbums(clubId)

      const entries = Object.entries(requests)
      if (entries.length === 0) return

      const results = await Promise.all(entries.map(([, p]) => p))
      entries.forEach(([key], idx) => {
        const res = results[idx]
        if (!res?.success) return

        if (key === "news") {
          const newsData = Array.isArray(res.data) ? res.data : (res.data as any)?.news || []
          setNews(newsData)
        }

        if (key === "events") {
          const eventsData = Array.isArray(res.data) ? res.data : (res.data as any)?.events || []
          setEvents((eventsData || []).filter((e: any) => !e?.memberOnly))
        }

        if (key === "store") {
          const merch = (res.data as any)?.merchandise || []
          setMerchandise(merch)
        }

        if (key === "chants") {
          const chantsData = (res.data as any)?.chants || []
          setChants(chantsData)
        }

        if (key === "gallery") {
          const albums = (res.data as any)?.albums || []
          setGalleryAlbums(albums)
        }
      })
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

  const { websiteSetup, designSettings: designSettingsRaw } = settings
  const designSettings = designSettingsRaw ?? {
    primaryColor: "#3b82f6",
    secondaryColor: "",
    fontFamily: "",
    logo: null,
    heroImage: null,
    motto: "",
    socialMedia: undefined,
  }

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
  const clubSearchHref = club?.name ? `/clubs?search=${encodeSearchParam(club.name)}` : "/clubs"

  const clubSettingsSocialMedia = getSocialMediaRecordFromClubSettings(settings)
  const socialLinks = clubSettingsSocialMedia
    ? buildSocialLinksFromSocialMediaRecord(clubSettingsSocialMedia)
    : []
  const hasContactInfo = Boolean(websiteSetup.contactEmail || websiteSetup.contactPhone)
  const hasClubWebsite = Boolean(club.website?.trim())
  const hasSocialLinks = socialLinks.length > 0
  const footerColumnCount = [hasContactInfo, hasClubWebsite, hasSocialLinks].filter(Boolean).length
  const hasCommunitySections = Boolean(
    websiteSetup.sections.news ||
    websiteSetup.sections.events ||
    websiteSetup.sections.chants ||
    websiteSetup.sections.gallery ||
    websiteSetup.sections.store ||
    websiteSetup.sections.merchandise
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            {(designSettings.logo || club.logo) && (
              <img
                src={designSettings.logo || club.logo!}
                alt={title}
                className="h-9 w-9 flex-shrink-0 object-contain rounded-lg"
              />
            )}
            <span className="font-black text-base sm:text-lg tracking-tight truncate">
              {title}
            </span>
          </div>

          {hasCommunitySections && (
            <nav className="hidden md:flex items-center justify-center gap-4 text-sm font-semibold">
              {websiteSetup.sections.events && (
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                    activeTab === "events"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === "events" ? { color: primaryColor } : undefined}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Events &amp; Activities</span>
                </button>
              )}
              {websiteSetup.sections.news && (
                <button
                  type="button"
                  onClick={() => setActiveTab("news")}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                    activeTab === "news"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === "news" ? { color: primaryColor } : undefined}
                >
                  <Newspaper className="h-4 w-4" />
                  <span>News &amp; Updates</span>
                </button>
              )}
              {(websiteSetup.sections.store || websiteSetup.sections.merchandise) && (
                <button
                  type="button"
                  onClick={() => setActiveTab("store")}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                    activeTab === "store"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === "store" ? { color: primaryColor } : undefined}
                >
                  <Store className="h-4 w-4" />
                  <span>Merchandise</span>
                </button>
              )}
              {websiteSetup.sections.chants && (
                <button
                  type="button"
                  onClick={() => setActiveTab("chants")}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                    activeTab === "chants"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === "chants" ? { color: primaryColor } : undefined}
                >
                  <Music className="h-4 w-4" />
                  <span>Club Chants</span>
                </button>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={clubSearchHref}>
              <Button
                size="sm"
                className="font-bold px-4 sm:px-6 text-sm"
                style={{ backgroundColor: primaryColor, color: "white" }}
              >
                Join Club
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" variant="outline" className="font-bold px-4 sm:px-6 text-sm">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {designSettings.heroImage ? (
        <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
          <img
            src={designSettings.heroImage}
            alt={`${title} hero`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : (
        <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
          <img
            src="/club-crowd.png"
            alt="Club crowd placeholder"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/15" />
        </div>
      )}

      {hasCommunitySections && (
        <section className="container mx-auto px-6 py-12 md:py-16">
          <div className="max-w-7xl mx-auto space-y-10 md:space-y-12">
            <div className="space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex md:hidden flex-wrap w-full max-w-4xl mx-auto gap-2 h-auto bg-muted/50 p-2">
                    {websiteSetup.sections.events && (
                      <TabsTrigger
                        value="events"
                        className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md px-4 py-3"
                        style={{
                          color: activeTab === 'events' ? primaryColor : undefined
                        }}
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Events & Activities
                      </TabsTrigger>
                    )}
                    {websiteSetup.sections.news && (
                      <TabsTrigger
                        value="news"
                        className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md px-4 py-3"
                        style={{
                          color: activeTab === 'news' ? primaryColor : undefined
                        }}
                      >
                        <Newspaper className="h-5 w-5 mr-2" />
                        News & Updates
                      </TabsTrigger>
                    )}

                    {(websiteSetup.sections.store || websiteSetup.sections.merchandise) && (
                      <TabsTrigger
                        value="store"
                        className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md px-4 py-3"
                        style={{
                          color: activeTab === "store" ? primaryColor : undefined,
                        }}
                      >
                        <Store className="h-5 w-5 mr-2" />
                        Merchandise
                      </TabsTrigger>
                    )}
                    {websiteSetup.sections.gallery && (
                      <TabsTrigger
                        value="gallery"
                        className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md px-4 py-3"
                        style={{
                          color: activeTab === "gallery" ? primaryColor : undefined,
                        }}
                      >
                        <Images className="h-5 w-5 mr-2" />
                        Gallery
                      </TabsTrigger>
                    )}
                    {websiteSetup.sections.chants && (
                      <TabsTrigger
                        value="chants"
                        className="text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-md px-4 py-3"
                        style={{
                          color: activeTab === "chants" ? primaryColor : undefined,
                        }}
                      >
                        <Music className="h-5 w-5 mr-2" />
                        Club Chants
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
                                    <CardTitle className="text-xl line-clamp-2 break-words">{article.title}</CardTitle>
                                    {article.summary && (
                                      <CardDescription className="line-clamp-3 mt-2 break-words">
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
                                        {formatDisplayDate(article.publishedAt || article.createdAt)}
                                      </span>
                                    </div>
                                    {article.viewCount !== undefined && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                        <Eye className="w-4 h-4" />
                                        {article.viewCount} views
                                      </div>
                                    )}
                                  </CardContent>
                                  <CardFooter className="pt-0">
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      style={{ borderColor: primaryColor, color: primaryColor }}
                                      onClick={() => handleReadMoreNews(article)}
                                    >
                                      Read more
                                    </Button>
                                  </CardFooter>
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
                          ) : events.filter((e: any) => !e?.memberOnly).length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {events.filter((e: any) => !e?.memberOnly).map((event) => (
                                <Card key={event._id} className="hover:shadow-lg transition-all border-2">
                                  <CardHeader>
                                    <div className="flex items-start justify-between mb-2">
                                      {event.isActive === false && (
                                        <Badge variant="secondary" className="text-xs">
                                          Inactive
                                        </Badge>
                                      )}
                                      <div className="flex flex-wrap items-center gap-1.5 justify-end ml-auto">
                                        {isEventPaid(event) && (() => {
                                          const priceLabel = formatEventPriceDisplay(event, { fromPrefix: hasVenueTierMatrix(event) })
                                          return priceLabel ? (
                                            <Badge variant="outline" className="text-xs font-bold">
                                              {priceLabel}
                                            </Badge>
                                          ) : null
                                        })()}
                                        {isEventPaid(event) && event._id && (
                                          <RefundPolicyBadge eventId={event._id} className="text-[10px]" source="event_detail" />
                                        )}
                                        <JointScreeningDisplay jointScreening={event.jointScreening} variant="badge" />
                                        <WaitlistDisplay waitlist={event.waitlist} variant="badge" />
                                      </div>
                                    </div>
                                    <CardTitle className="text-xl line-clamp-2 break-words">{event.title}</CardTitle>
                                    {event.description && (
                                      <CardDescription className="line-clamp-3 mt-2 break-words">
                                        {event.description}
                                      </CardDescription>
                                    )}
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    {(event.eventDate || event.startTime) && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatDisplayDate(event.eventDate || event.startTime)}</span>
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
                                        <span className="line-clamp-2 break-words">{event.venue}</span>
                                      </div>
                                    )}
                                    {event.maxAttendees != null && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>
                                          {event.currentAttendees || 0} / {event.maxAttendees} attendees
                                          {(event.currentAttendees ?? 0) >= event.maxAttendees && (
                                            <span className="font-medium text-destructive ml-1">(Full)</span>
                                          )}
                                        </span>
                                      </div>
                                    )}

                                    <EventScheduleMeta
                                      bookingStartTime={event.bookingStartTime}
                                      bookingEndTime={event.bookingEndTime}
                                      attendancePoints={event.attendancePoints}
                                    />

                                    {(() => {
                                      const isEventFull = event.maxAttendees != null && (event.currentAttendees ?? 0) >= event.maxAttendees
                                      const label = isEventFull ? "Event Full" : isEventPaid(event) ? "Buy Tickets" : "Register"
                                      return (
                                        <Button
                                          className="w-full mt-2"
                                          style={isEventFull ? undefined : { backgroundColor: primaryColor, color: "white" }}
                                          variant={isEventFull ? "secondary" : "default"}
                                          disabled={isEventFull}
                                          onClick={() => {
                                            if (isEventFull) return
                                            router.push(`/clubs/${slug}/events/${slugify(event.title)}`)
                                          }}
                                        >
                                          {label}
                                        </Button>
                                      )
                                    })()}
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

                  {(websiteSetup.sections.store || websiteSetup.sections.merchandise) && (
                    <TabsContent value="store" className="mt-8">
                      <Card className="border-2 shadow-lg">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <CardTitle className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Store className="h-6 w-6" style={{ color: primaryColor }} />
                            </div>
                            Merchandise
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingContent ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                            </div>
                          ) : merchandise.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {merchandise.map((item: any) => (
                                <Card key={item._id} className="hover:shadow-lg transition-all border-2 overflow-hidden flex flex-col">
                                  {item.featuredImage && (
                                    <div className="relative h-44 overflow-hidden">
                                      <img src={item.featuredImage} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex flex-col flex-1">
                                    <CardHeader className="flex-1 flex flex-col">
                                      <div className="flex items-start justify-between gap-3">
                                        <CardTitle className="text-lg line-clamp-2 break-words">{item.name}</CardTitle>
                                        {typeof item.price === "number" && (
                                          <Badge variant="outline" className="text-xs font-bold shrink-0">
                                            {item.currency || "USD"} {item.price}
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <CardDescription className="line-clamp-3 mt-2 break-words">{item.description}</CardDescription>
                                      )}
                                      <div className="flex-1" />
                                      {club?._id && (
                                        <div className="mt-auto">
                                          <Button
                                            size="sm"
                                            className="w-full mt-2"
                                            style={{ backgroundColor: primaryColor, color: "white" }}
                                            onClick={() => {
                                              setMerchandiseForQuickBuy(item)
                                              setPurchaseFlowReason("merchandise")
                                              setShowPurchaseFlowModal(true)
                                            }}
                                          >
                                            Quick Buy
                                          </Button>
                                        </div>
                                      )}
                                    </CardHeader>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-lg text-muted-foreground">No merchandise available yet.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {websiteSetup.sections.gallery && (
                    <TabsContent value="gallery" className="mt-8">
                      <Card className="border-2 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Images className="h-6 w-6" style={{ color: primaryColor }} />
                            </div>
                            Gallery
                          </CardTitle>
                          <CardDescription>Browse photos and videos from club events.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ClubGallerySection
                            albums={galleryAlbums}
                            loading={loadingContent}
                            primaryColor={primaryColor}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {websiteSetup.sections.chants && (
                    <TabsContent value="chants" className="mt-8">
                      <Card className="border-2 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Music className="h-6 w-6" style={{ color: primaryColor }} />
                            </div>
                            Club Chants
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingContent ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
                            </div>
                          ) : chants.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {chants.map((chant) => (
                                <Card key={chant._id} className="hover:shadow-lg transition-all border-2 overflow-hidden">
                                  <CardHeader>
                                    <CardTitle className="text-lg line-clamp-2">{chant.title}</CardTitle>
                                    {chant.description && (
                                      <CardDescription className="line-clamp-3 mt-2">{chant.description}</CardDescription>
                                    )}
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    {chant.fileType === "text" && chant.content && (
                                      <div className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-6">
                                        {chant.content}
                                      </div>
                                    )}
                                    {chant.fileType === "image" && chant.fileUrl && (
                                      <img src={chant.fileUrl} alt={chant.title} className="w-full rounded-md border" />
                                    )}
                                    {chant.fileType === "audio" && chant.fileUrl && (
                                      <audio controls src={chant.fileUrl} className="w-full" />
                                    )}
                                    {chant.fileType === "iframe" && chant.iframeUrl && (
                                      <div className="w-full overflow-hidden rounded-md border">
                                        <iframe
                                          src={chant.iframeUrl}
                                          width={chant.iframeWidth || "100%"}
                                          height={chant.iframeHeight || "400"}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-lg text-muted-foreground">No chants available yet.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
          </div>
        </section>
      )}

      <section className="bg-muted/30 border-t overflow-hidden relative py-32 md:py-48">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h3 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">Be Part of the Journey</h3>
            <p className="text-muted-foreground text-2xl md:text-3xl leading-relaxed max-w-3xl mx-auto">
              Join <strong>{club.name}</strong> today and unlock access to exclusive content,
              priority event booking, and a global network of passionate fans.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
              <Link href={clubSearchHref} className="w-full sm:w-auto">
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

      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-12 md:py-16">
          {footerColumnCount > 0 && (
            <div
              className={[
                "grid grid-cols-1 divide-y divide-border",
                footerColumnCount === 1 ? "mx-auto max-w-md" : "",
                footerColumnCount === 2 ? "md:grid-cols-2 md:divide-y-0 md:divide-x" : "",
                footerColumnCount >= 3 ? "md:grid-cols-3 md:divide-y-0 md:divide-x" : "",
              ].join(" ")}
            >
              {hasContactInfo && (
                <div className="flex flex-col items-center gap-5 py-10 first:pt-0 last:pb-0 md:py-0 md:px-10 md:first:pl-0 md:last:pr-0">
                  <div className="space-y-1 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Contact
                    </span>
                    <p className="text-sm text-muted-foreground/70">
                      Get in touch with the club team.
                    </p>
                  </div>

                  <div className="w-full max-w-sm space-y-3">
                    {websiteSetup.contactEmail && (
                      <a
                        href={`mailto:${websiteSetup.contactEmail}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-md"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] transition-colors group-hover:bg-primary/[0.14]"
                          style={{ color: primaryColor }}
                        >
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                            Email
                          </p>
                          <p className="break-all text-sm font-semibold text-foreground">
                            {websiteSetup.contactEmail}
                          </p>
                        </div>
                      </a>
                    )}
                    {websiteSetup.contactPhone && (
                      <a
                        href={`tel:${websiteSetup.contactPhone}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-md"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] transition-colors group-hover:bg-primary/[0.14]"
                          style={{ color: primaryColor }}
                        >
                          <Phone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                            Phone
                          </p>
                          <p className="break-all text-sm font-semibold text-foreground">
                            {websiteSetup.contactPhone}
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {hasClubWebsite && (
                <div className="flex flex-col items-center gap-4 py-10 first:pt-0 last:pb-0 md:py-0 md:px-10 md:first:pl-0 md:last:pr-0">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Links
                  </span>
                  {club.website && (
                    <a
                      href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] group-hover:bg-primary/[0.14] transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Globe className="h-4 w-4" />
                      </div>
                      Official Website
                    </a>
                  )}
                </div>
              )}

              {hasSocialLinks && (
                <div className="flex flex-col items-center gap-4 py-10 first:pt-0 last:pb-0 md:py-0 md:px-10 md:first:pl-0 md:last:pr-0">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Follow Us
                  </span>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {socialLinks.map(({ platform, href, label }) => (
                      <SocialBrandButton key={`${platform}-${href}`} platform={platform} href={href} label={label} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`${footerColumnCount > 0 ? "border-t mt-10 pt-6" : ""} text-center text-xs text-muted-foreground space-y-3`}>
            <p>Powered by RallyUp</p>
            <p>© 2025 RallyUp Solutions Private Limited. All rights reserved.</p>
            <EkalonAttribution className="text-center" />
          </div>
        </div>
      </footer>

      {club?._id && (eventForRegistration || merchandiseForQuickBuy) && (
        <PurchaseFlowModal
          isOpen={showPurchaseFlowModal}
          onClose={() => {
            setShowPurchaseFlowModal(false)
            setPurchaseFlowReason(null)
          }}
          clubId={club._id}
          clubName={club.name}
          returnPath={`/clubs/${slug}`}
          onContinueToPayment={() => {
            setShowPurchaseFlowModal(false)
            if (purchaseFlowReason === "event" && eventForRegistration) {
              if (hasVenueTierMatrix(eventForRegistration)) {
                setShowVenueTierCartModal(true)
              } else {
                setEventCheckoutAsGuest(true)
                setShowEventCheckoutModal(true)
              }
            } else if (purchaseFlowReason === "merchandise" && merchandiseForQuickBuy) {
              const item = merchandiseForQuickBuy
              setMerchandiseCheckoutItems([{
                _id: item._id,
                name: item.name,
                price: item.price,
                currency: item.currency || "INR",
                quantity: 1,
                featuredImage: item.featuredImage,
                stockQuantity: item.stockQuantity ?? 0,
                tags: item.tags,
                club: item.club || { _id: club._id, name: club.name },
              }])
              setShowMerchandiseCheckoutModal(true)
              setMerchandiseForQuickBuy(null)
            }
            setPurchaseFlowReason(null)
          }}
          onLogin={(returnUrl) => {
            if (purchaseFlowReason === "event" && eventForRegistration) {
              setStoredPurchaseIntent({
                type: "event",
                clubId: club._id,
                slug,
                eventId: eventForRegistration._id,
                event: eventForRegistration,
                attendees: [],
                returnPath: returnUrl,
              })
            } else if (purchaseFlowReason === "merchandise" && merchandiseForQuickBuy) {
              const item = merchandiseForQuickBuy
              setStoredPurchaseIntent({
                type: "merchandise",
                clubId: club._id,
                slug,
                item: {
                  _id: item._id,
                  name: item.name,
                  price: item.price,
                  currency: item.currency || "INR",
                  quantity: 1,
                  featuredImage: item.featuredImage,
                  stockQuantity: item.stockQuantity,
                  tags: item.tags,
                  club: item.club || { _id: club._id, name: club.name },
                },
                returnPath: returnUrl,
              })
            }
            router.push(`/login?next=${encodeURIComponent(returnUrl)}`)
          }}
          onRegister={(registerNextUrl) => {
            if (purchaseFlowReason === "event" && eventForRegistration) {
              setStoredPurchaseIntent({
                type: "event",
                clubId: club._id,
                slug,
                eventId: eventForRegistration._id,
                event: eventForRegistration,
                attendees: [],
                returnPath: registerNextUrl,
              })
            } else if (purchaseFlowReason === "merchandise" && merchandiseForQuickBuy) {
              const item = merchandiseForQuickBuy
              setStoredPurchaseIntent({
                type: "merchandise",
                clubId: club._id,
                slug,
                item: {
                  _id: item._id,
                  name: item.name,
                  price: item.price,
                  currency: item.currency || "INR",
                  quantity: 1,
                  featuredImage: item.featuredImage,
                  stockQuantity: item.stockQuantity,
                  tags: item.tags,
                  club: item.club || { _id: club._id, name: club.name },
                },
                returnPath: registerNextUrl,
              })
            }
            router.push(registerNextUrl)
          }}
        />
      )}

      <VenueTierCartModal
        isOpen={showVenueTierCartModal}
        onClose={() => {
          setShowVenueTierCartModal(false)
          setEventForRegistration(null)
        }}
        event={eventForRegistration}
        onSuccess={() => {
          setShowVenueTierCartModal(false)
          setEventForRegistration(null)
          if (club?._id) loadContent(club._id)
        }}
        onFailure={() => {}}
      />

      <CheckoutModal
        isOpen={showMerchandiseCheckoutModal}
        onClose={() => {
          setShowMerchandiseCheckoutModal(false)
          setMerchandiseCheckoutItems([])
        }}
        onSuccess={() => {
          setShowMerchandiseCheckoutModal(false)
          setMerchandiseCheckoutItems([])
          if (club?._id) loadContent(club._id)
          router.push("/purchase/success")
        }}
        directCheckoutItems={merchandiseCheckoutItems.length > 0 ? merchandiseCheckoutItems : undefined}
      />

      <EventCheckoutModal
        isOpen={showEventCheckoutModal}
        onClose={() => {
          setShowEventCheckoutModal(false)
          setEventCheckoutAsGuest(false)
          setEventForRegistration(null)
        }}
        skipMemberValidation={eventCheckoutAsGuest}
        event={
          eventForRegistration
            ? {
                _id: eventForRegistration._id,
                name: eventForRegistration.title,
                price: eventForRegistration.ticketPrice || 0,
                ticketPrice: eventForRegistration.ticketPrice || 0,
                earlyBirdDiscount: (eventForRegistration as any).earlyBirdDiscount,
                memberDiscount: (eventForRegistration as any).memberDiscount,
                groupDiscount: (eventForRegistration as any).groupDiscount,
                currency: (eventForRegistration as any).currency || "INR",
                jointScreening: (eventForRegistration as any).jointScreening,
              }
            : undefined
        }
        attendees={[]}
        onSuccess={() => {
          if (club?._id) loadContent(club._id)
        }}
        onFailure={() => {}}
      />

      <NewsReadMoreModal
        news={selectedNewsForReadMore}
        isOpen={showReadMoreModal}
        onClose={() => {
          setShowReadMoreModal(false)
          setSelectedNewsForReadMore(null)
        }}
      />
    </div>
  )
}
