"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, News, Event, Chant } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { getNewsImageUrl } from "@/lib/config"
import { EventCheckoutModal } from "@/components/modals/event-checkout-modal"
import { VenueTierCartModal } from "@/components/modals/venue-tier-cart-modal"
import { PurchaseFlowModal, setStoredPurchaseIntent, getStoredPurchaseIntent, clearStoredPurchaseIntent } from "@/components/modals/purchase-flow-modal"
import { CheckoutModal } from "@/components/modals/checkout-modal"
import NewsReadMoreModal from "@/components/modals/news-readmore-modal"
import { SocialBrandButton } from "@/components/club-public/social-platform-icons"
import { EkalonAttribution } from "@/components/ekalon-attribution"
import { toast } from "sonner"
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
  /** Matches ClubSettings in API: social links live on designSettings.socialMedia */
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

/** Subdocument on club settings (Mongo designSettings.socialMedia) */
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

/** Club settings Mongo schema: `designSettings.socialMedia`. Returns null if missing or not a plain object. */
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

  const handleEventClick = (event: Event) => {
    setEventForRegistration(event)
    setPurchaseFlowReason("event")
    setShowPurchaseFlowModal(true)
  }

  // Resume purchase after login redirect
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
      const hasVenues = Array.isArray((ev as any).venues) && (ev as any).venues.length > 0
      if (hasVenues) {
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
              {/* <Link href="/clubs" className="w-full">
                <Button variant="outline" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Explore Other Clubs
                </Button>
              </Link> */}
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
  /** Club-settings API: `data.designSettings` (includes `socialMedia` with facebook, twitter, instagram, youtube). */
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
    websiteSetup.sections.store ||
    websiteSetup.sections.merchandise
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {(designSettings.logo || club.logo) && (
              <img
                src={designSettings.logo || club.logo!}
                alt={title}
                className="h-9 w-9 flex-shrink-0 object-contain rounded-lg"
              />
            )}
            <span className="font-black text-base sm:text-lg tracking-tight truncate">{title}</span>
          </div>
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

      {/* Hero Image Section */}
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
        <div
          className="w-full h-48 md:h-64 lg:h-80 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${designSettings.secondaryColor || primaryColor} 100%)`
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '30px 30px'
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          </div>
        </div>
      )}

      {/* <section className="relative overflow-hidden py-24 lg:py-40">
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
                  <div
                    className="absolute -inset-10 rounded-[2rem] opacity-35 blur-3xl transition-opacity duration-700 group-hover:opacity-55"
                    style={{
                      background: `radial-gradient(circle, ${primaryColor} 0%, transparent 72%)`,
                    }}
                  />
                  <div
                    className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-card via-card to-muted/40 shadow-2xl ring-4 ring-background/80 transition-all duration-300 md:h-44 md:w-44 md:rounded-[1.85rem]"
                    style={{ borderColor: `${primaryColor}4d` }}
                  >
                    <img
                      src={designSettings.logo || club.logo}
                      alt={`${title} logo`}
                      className="max-h-[82%] max-w-[82%] object-contain object-center transition-transform duration-300 group-hover:scale-[1.04]"
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
              <Link href={clubSearchHref} className="w-full sm:w-auto">
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
      </section> */}

      {hasCommunitySections && (
        <section className="container mx-auto px-6 py-28 md:py-40">
          <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">Our Community Hub</h2>
              <div className="w-24 h-2 bg-primary mx-auto rounded-full" style={{ backgroundColor: primaryColor }} />
              <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                Everything you need to stay connected with the club and fellow supporters.
              </p>
            </div>

            <div className="space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex flex-wrap w-full max-w-4xl mx-auto gap-2 h-auto bg-muted/50 p-2">
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

                                    {(() => {
                                      const isEventFull = event.maxAttendees != null && (event.currentAttendees ?? 0) >= event.maxAttendees
                                      const hasVenues = Array.isArray((event as any).venues) && (event as any).venues.length > 0
                                      const label = isEventFull ? "Event Full" : hasVenues || (event.ticketPrice && event.ticketPrice > 0) ? "Buy Tickets" : "Register"
                                      return (
                                        <Button
                                          className="w-full mt-2"
                                          style={isEventFull ? undefined : { backgroundColor: primaryColor, color: "white" }}
                                          variant={isEventFull ? "secondary" : "default"}
                                          disabled={isEventFull}
                                          onClick={() => handleEventClick(event)}
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
                          {/* {club?._id && (
                          <Link href={`/merchandise?clubId=${club._id}`}>
                            <Button variant="outline" className="border-2 font-bold">
                              Shop All
                            </Button>
                          </Link>
                        )} */}
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
              {/* Column 1 — Email / Phone */}
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

              {/* Column 2 — Website */}
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

              {/* Column 3 — Social */}
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

      {/* Purchase flow — member phone check, login, or continue as guest */}
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
              const hasVenues = Array.isArray((eventForRegistration as any).venues) && (eventForRegistration as any).venues.length > 0
              if (hasVenues) {
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
            router.push(registerNextUrl)
          }}
        />
      )}

      {/* Multi-ticket checkout (venue-tier matrix events) */}
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
