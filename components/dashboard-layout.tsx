"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useClubSettings } from "@/hooks/useClubSettings"
import { useDesignSettings } from "@/hooks/useDesignSettings"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Ticket,
  Globe,
  ExternalLink,
  Shield,
  Newspaper,
  Shirt,
  LayoutDashboard,
  User,
  Building,
  CreditCard,
  Building2,
  Heart,
  GraduationCap,
  Vote,
  Music,
  ShoppingCart,
  UserCheck,
  ChartNoAxesColumn,
  Tag,
  RotateCcw,
  Trophy,
  Images,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { NotificationCenterModal } from "@/components/modals/notification-center-modal"
import { StorageAlertBanner } from "@/components/ui/storage-alert-banner"
import { SubscriptionCancelledModal } from "@/components/modals/subscription-cancelled-modal"
import { apiClient, type StorageAlertStatus } from "@/lib/api"
import { BASE_STORAGE_GB } from "@/lib/storageConstants"
import type { WebsiteSectionKey } from "@/lib/websiteSections"
import { EkalonAttribution } from "@/components/ekalon-attribution"

const USER_PATH_TO_SECTION: Record<string, WebsiteSectionKey> = {
  "/dashboard/user/news": "news",
  "/dashboard/user/events": "events",
  "/dashboard/user/polls": "polls",
  "/dashboard/user/chants": "chants",
  "/dashboard/user/members": "members",
  "/merchandise": "merchandise",
  "/dashboard/user/gallery": "gallery",
  "/dashboard/user/leaderboard": "leaderboard",
  "/dashboard/user/external-ticketing": "externalTicketing",
  "/dashboard/volunteer": "volunteer",
  "/dashboard/user/guess-the-score": "guessTheScore",
}

const FEED_PATH = "/dashboard/user"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Gallery", href: "/dashboard/gallery", icon: Images },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Merchandise", href: "/dashboard/merchandise", icon: Shirt },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  { name: "Club Chants", href: "/dashboard/chants", icon: Music },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Order Management", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: ChartNoAxesColumn },
  { name: "Coupons", href: "/dashboard/coupons", icon: Tag },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  { name: "Refunds", href: "/dashboard/admin/refunds", icon: RotateCcw },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
  { name: "Admin Settings", href: "/dashboard/admin-settings", icon: Settings },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
]

const systemOwnerNavigation = [
  { name: "Club Management", href: "/dashboard/club-management", icon: Building },
  // { name: "Browse Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Sports", href: "/dashboard/sports", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const superAdminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Gallery", href: "/dashboard/gallery", icon: Images },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Merchandise", href: "/dashboard/merchandise", icon: Shirt },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  { name: "Club Chants", href: "/dashboard/chants", icon: Music },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Order Management", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: ChartNoAxesColumn },
  { name: "Coupons", href: "/dashboard/coupons", icon: Tag },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  { name: "Refunds", href: "/dashboard/admin/refunds", icon: RotateCcw },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "Admin Settings", href: "/dashboard/admin-settings", icon: Settings },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Staff Management", href: "/dashboard/staff", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const userNavigation = [
  { name: "Feed", href: "/dashboard/user", icon: LayoutDashboard },
  { name: "Events", href: "/dashboard/user/events", icon: Ticket },
  { name: "Guess The Score", href: "/dashboard/user/guess-the-score", icon: Trophy },
  { name: "Gallery", href: "/dashboard/user/gallery", icon: Images },
  { name: "Club Chants", href: "/dashboard/user/chants", icon: Music },
  { name: "Leaderboard", href: "/dashboard/user/leaderboard", icon: ChartNoAxesColumn },
  { name: "Merchandise", href: "/merchandise", icon: Shirt },
  { name: "External Ticketing", href: "/dashboard/user/external-ticketing", icon: ExternalLink },
  { name: "News", href: "/dashboard/user/news", icon: Newspaper },
  { name: "Polls", href: "/dashboard/user/polls", icon: Vote },
  { name: "Volunteer", href: "/dashboard/volunteer", icon: Heart },
  { name: "My Orders", href: "/dashboard/user/orders", icon: ShoppingCart },
  { name: "Browse Plans", href: "/dashboard/user/browse-plans", icon: CreditCard },
  { name: "My Clubs", href: "/dashboard/user/my-clubs", icon: UserCheck },
  { name: "My Settings", href: "/dashboard/user-settings", icon: Settings },
  { name: "Members", href: "/dashboard/user/members", icon: Users },
  { name: "Membership Card", href: "/dashboard/user/membership-card", icon: CreditCard },
  { name: "My Profile", href: "/dashboard/user/profile", icon: User },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface DashboardSidebarProps {
  mobile?: boolean
  navigation: { name: string; href: string; icon: React.ElementType }[]
  pathname: string
  onCloseMobile?: () => void
  sidebarClubs: { _id: string; name: string; logo?: string }[]
  activeClubId?: string
  settings: any
  onClubSwitch: (clubId: string) => void
  user: any
  onLogout: () => void
}

function DashboardSidebar({
  mobile = false,
  navigation,
  pathname,
  onCloseMobile,
  sidebarClubs,
  activeClubId,
  settings,
  onClubSwitch,
  user,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-card", mobile ? "w-full" : "w-72")}>
      <Link href="/" className="flex items-center gap-2 h-16 p-2 border-b hover:opacity-90 transition-opacity">
        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white shadow-md border-2 ring-2 ring-primary/5">
          <Image
            src="/WingmanPro Logo (White BG).svg"
            alt="Wingman Pro logo"
            fill
            sizes="40px"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black leading-none">Wingman Pro</span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Platform</span>
        </div>
      </Link>

      <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:translate-x-1",
            )}
            onClick={() => mobile && onCloseMobile?.()}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
              pathname === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
            )} />
            <span className="truncate">{item.name}</span>
            {pathname === item.href && (
              <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full my-auto inset-y-0" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t bg-muted/20">
        <div className="space-y-4">
          {(() => {
            const currentClub = sidebarClubs.find((c) => c._id === activeClubId) ?? sidebarClubs[0]
            const settingsLogo = settings ? ((settings as any).designSettings?.logo) : undefined
            const displayLogo = settingsLogo || currentClub?.logo
            const hasMultipleClubs = sidebarClubs.length > 1

            if (!currentClub) return null

            const trigger = (
              <div className="flex items-center gap-2 min-w-0 w-full">
                {displayLogo && (
                  <div className="relative w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={displayLogo}
                      alt={currentClub.name}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-bold text-foreground truncate flex-1">{currentClub.name}</p>
                {hasMultipleClubs && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">↗</span>
                )}
              </div>
            )

            if (hasMultipleClubs) {
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                      title="Switch club"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Selected Club</p>
                      {trigger}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 p-2 rounded-xl border-2 shadow-xl">
                    {sidebarClubs.map((club) => (
                      <DropdownMenuItem
                        key={club._id}
                        onClick={() => onClubSwitch(club._id)}
                        className={cn(
                          "rounded-lg gap-2 cursor-pointer",
                          activeClubId === club._id && "bg-primary/10 font-bold"
                        )}
                      >
                        {club.logo ? (
                          <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                            <Image src={club.logo} alt={club.name} fill sizes="32px" className="object-cover" />
                          </div>
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate">{club.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Selected Club</p>
                {trigger}
              </div>
            )
          })()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-14 px-4 justify-start bg-card border-2 hover:bg-muted/50 transition-all rounded-2xl group shadow-sm">
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <Avatar className="w-9 h-9 rounded-xl flex-shrink-0 ring-2 ring-primary/5 group-hover:scale-110 transition-transform">
                    <AvatarImage src={(user as { profilePicture?: string })?.profilePicture} alt={user?.name ?? "User"} className="object-cover" />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-black text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-bold truncate w-full">{user?.name || 'User Account'}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide truncate w-full">
                      {user?.role?.replace('_', ' ') || 'Member'}
                    </span>
                  </div>
                  <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform flex-shrink-0" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-2">
              <DropdownMenuItem
                onClick={() => (window.location.href = "/dashboard/user/profile")}
                className="rounded-xl h-12 font-bold gap-3"
              >
                <User className="w-5 h-5 text-primary" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => (window.location.href = "/dashboard/settings")}
                className="rounded-xl h-12 font-bold gap-3"
              >
                <Settings className="w-5 h-5 text-primary" />
                Settings
              </DropdownMenuItem>
              <div className="my-2 border-t-2" />
              <DropdownMenuItem
                onClick={onLogout}
                className="rounded-xl h-12 font-bold gap-3 text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin, activeClubId, setActiveClubId } = useAuth()
  const [storageAlertStatus, setStorageAlertStatus] = useState<StorageAlertStatus | null>(null)
  const [storageBannerDismissed, setStorageBannerDismissed] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const getUserClubId = () => {
    if (!user || user.role === 'system_owner') return undefined
    const userWithMemberships = user as any

    if (activeClubId) {
      const activeMembership = userWithMemberships.memberships?.find(
        (m: any) => (m.club_id?._id || m.club_id) === activeClubId && m.status === 'active'
      )
      if (activeMembership) return activeClubId
      const isAdmin = userWithMemberships.role === 'admin' || userWithMemberships.role === 'super_admin'
      const inClubs = Array.isArray(userWithMemberships.clubs) &&
        userWithMemberships.clubs.some((c: any) => (c?._id?.toString?.() ?? c?.toString?.()) === activeClubId)
      if (isAdmin && inClubs) return activeClubId
    }

    const activeMembership = userWithMemberships.memberships?.find((m: any) => m.status === 'active')
    if (activeMembership?.club_id?._id) return activeMembership.club_id._id
    const firstClub = Array.isArray(userWithMemberships.clubs) ? userWithMemberships.clubs[0] : null
    const firstClubId = firstClub?._id?.toString?.() ?? (typeof firstClub === 'object' ? firstClub?._id : firstClub)
    return firstClubId ?? undefined
  }
  
  const clubId = getUserClubId()
  const { isSectionVisible, settings, loading: settingsLoading } = useClubSettings(clubId)
  
  useDesignSettings(clubId)
  const isRegularUser = !user?.role || user.role === "member"
  useEffect(() => {
    if (!isRegularUser || !clubId || settingsLoading || !pathname) return
    const section = USER_PATH_TO_SECTION[pathname]
    if (!section) return
    const visible =
      section === "merchandise"
        ? isSectionVisible("merchandise") || isSectionVisible("store")
        : isSectionVisible(section)
    if (!visible) {
      router.replace(FEED_PATH)
    }
  }, [isRegularUser, clubId, settingsLoading, pathname, settings])

  const isAdminRole = user?.role === 'admin' || user?.role === 'super_admin'

  useEffect(() => {
    if (!isAdminRole) return
    const clubId = getUserClubId()
    apiClient.getStorageAlertStatus(clubId ?? undefined).then((res) => {
      if (res.success && res.data) {
        setStorageAlertStatus(res.data)
        if (res.data.showUpgradeModal) {
          setShowSubscriptionModal(true)
        }
      }
    }).catch(() => {})
  }, [isAdminRole, activeClubId])

  const sidebarClubs = useMemo(() => {
    if (!user || user.role === 'system_owner') return []
    const userAny = user as any
    const list: { _id: string; name: string; logo?: string }[] = []
    const isAdmin = userAny.role === 'admin' || userAny.role === 'super_admin'
    if (isAdmin && Array.isArray(userAny.clubs)) {
      userAny.clubs.forEach((c: any) => {
        const id = c?._id?.toString?.() ?? c?.toString?.() ?? c
        if (!id) return
        const name = typeof c === 'object' && c?.name ? c.name : 'Unknown Club'
        const logo = typeof c === 'object' ? c.logo : undefined
        if (!list.some((x) => x._id === id)) list.push({ _id: id, name, logo })
      })
    }
    const memberships = userAny?.memberships?.filter((m: any) => m?.status === 'active') ?? []
    memberships.forEach((m: any) => {
      const club = m?.club_id ?? m?.club
      const id = club?._id?.toString?.() ?? (typeof club === 'string' ? club : null)
      if (!id || list.some((x) => x._id === id)) return
      const name = typeof club === 'object' && club?.name ? club.name : 'Unknown Club'
      const logo = typeof club === 'object' ? club.logo : undefined
      list.push({ _id: id, name, logo })
    })
    return list
  }, [user])
  
  const getNavigation = () => {
    if (!user) return userNavigation
    
    let nav = []
    switch (user.role) {
      case 'system_owner':
        nav = systemOwnerNavigation
        break
      case 'super_admin':
        nav = superAdminNavigation
        break
      case 'admin':
        nav = adminNavigation
        break
      default:
        nav = userNavigation
    }
    
    const isRegularUser = !user.role || user.role === 'member'
    
    if (isRegularUser && clubId) {
      const canShowSection = (section: Parameters<typeof isSectionVisible>[0]) => {
        if (settingsLoading && !settings) return false
        return isSectionVisible(section)
      }

      const filtered = nav.filter(item => {
        if (item.name === 'News') {
          return canShowSection('news')
        }
        if (item.name === 'Events') {
          return canShowSection('events')
        }
        if (item.name === 'Merchandise') {
          return canShowSection('merchandise') || canShowSection('store')
        }
        if (item.name === 'Polls') {
          return canShowSection('polls')
        }
        if (item.name === 'Club Chants') {
          return canShowSection('chants')
        }
        if (item.name === 'Members') {
          return canShowSection('members')
        }
        if (item.name === 'Gallery') {
          return canShowSection('gallery')
        }
        if (item.name === 'Leaderboard') {
          return canShowSection('leaderboard')
        }
        if (item.name === 'External Ticketing') {
          return canShowSection('externalTicketing')
        }
        if (item.name === 'Volunteer') {
          return canShowSection('volunteer')
        }
        if (item.name === 'Guess The Score') {
          return canShowSection('guessTheScore')
        }
        return true
      })
      return filtered
    }
    
    return nav
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r bg-muted/5">
        <DashboardSidebar
          navigation={getNavigation()}
          pathname={pathname}
          sidebarClubs={sidebarClubs}
          activeClubId={activeClubId ?? undefined}
          settings={settings}
          onClubSwitch={(id) => { setActiveClubId(id); router.refresh() }}
          user={user}
          onLogout={logout}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <DashboardSidebar
            mobile
            navigation={getNavigation()}
            pathname={pathname}
            onCloseMobile={() => setSidebarOpen(false)}
            sidebarClubs={sidebarClubs}
            activeClubId={activeClubId ?? undefined}
            settings={settings}
            onClubSwitch={(id) => { setActiveClubId(id); router.refresh(); setSidebarOpen(false) }}
            user={user}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b lg:px-8 h-16 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            
            <Link href="/" className="flex items-center gap-2 lg:hidden hover:opacity-90 transition-opacity">
              <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-white shadow-sm border">
                <Image
                  src="/WingmanPro Logo (White BG).svg"
                  alt="Wingman Pro logo"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-lg tracking-tight">Wingman Pro</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-muted/50 border text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {user?.role?.replace('_', ' ') || 'Member'}
            </div>
            <NotificationCenterModal />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout} className="h-9 px-4 font-bold border-2">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/5">
          <div className="container mx-auto p-6 md:p-8 lg:p-10 max-w-[1600px]">
            {isAdminRole && storageAlertStatus?.alertLevel && !storageBannerDismissed && (
              <StorageAlertBanner
                usagePercent={storageAlertStatus.usagePercent}
                usedGb={storageAlertStatus.usedGb}
                totalGb={storageAlertStatus.totalGb}
                alertLevel={storageAlertStatus.alertLevel}
                onDismiss={storageAlertStatus.alertLevel !== 'exceeded' ? () => setStorageBannerDismissed(true) : undefined}
              />
            )}
            {children}
          </div>
          <div className="mt-10 pt-6 border-t flex justify-center">
            <EkalonAttribution className="text-center" />
          </div>
        </main>
      </div>
      {isAdminRole && storageAlertStatus && (
        <SubscriptionCancelledModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          overageGb={storageAlertStatus.overageGb}
          usedGb={storageAlertStatus.usedGb}
          baseAllocationGb={BASE_STORAGE_GB}
        />
      )}
    </div>
  )
}
