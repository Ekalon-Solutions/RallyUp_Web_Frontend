"use client"

import type React from "react"

import { useState, useMemo, useEffect, createContext, useContext } from "react"
import { useAuth } from "@/contexts/auth-context"
import { buildAccessibleClubs, reconcileActiveClubId, normalizeClubId } from "@/lib/clubContext"
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
  ShieldCheck,
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
  UserPlus,
  Lock,
  Grid3X3,
  Receipt,
  Repeat,
  Crown,
  Truck,
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
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { ADMIN_NAV_FEATURE_MAP, CLUB_FEATURE_DISABLED_EVENT, clubFeatureFlags, type ClubFeatureKey } from "@/lib/clubFeatures"
import { NAV_HREF_TO_PERMISSION_MODULE } from "@/lib/permissionMatrix"
import type { AdminClubContext } from "@/lib/api"
import { clearFeatureCache } from "@/lib/featureCacheStore"
import { UpgradeFeatureModal } from "@/components/modals/upgrade-feature-modal"
import { LockedFeaturePage } from "@/components/feature-gate/locked-feature-page"
import { ClubFeaturesProvider } from "@/contexts/club-features-context"
import { useFcmRegistration } from "@/hooks/useFcmRegistration"
import { ChevronDown, ChevronRight } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  admin: 'Admin',
  super_admin: 'Super Admin',
  system_owner: 'System Owner',
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  member: User,
  admin: Shield,
  super_admin: ShieldCheck,
  system_owner: Crown,
}

function formatRoleLabel(role: string): string {
  if (!role) return 'Member'
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRoleIcon(role: string): React.ElementType {
  return ROLE_ICONS[role] ?? User
}

// Derives the effective role for the currently active club.
// An admin whose account-level role is 'super_admin' is only super_admin
// for clubs listed in superAdminClubIds; for all other clubs they are 'admin'.
function getEffectiveRole(user: any, clubId: string | null | undefined): string {
  if (!user) return 'member'
  if (user.role === 'system_owner') return 'system_owner'
  if (user.role !== 'super_admin') return user.role || 'member'
  if (!clubId) return 'super_admin'
  const ids: string[] = user.superAdminClubIds ?? []
  return ids.includes(clubId) ? 'super_admin' : 'admin'
}

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
  // { name: "Logistics", href: "/dashboard/logistics", icon: Truck },
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
  { name: "Service Matrix", href: "/dashboard/feature-matrix", icon: Grid3X3 },
  { name: "Audit Logs", href: "/dashboard/admin-audit", icon: Shield },
  { name: "Billing Auditor", href: "/dashboard/billing-auditor", icon: Receipt },
  { name: "Logistics", href: "/dashboard/logistics", icon: Truck },
  // { name: "Browse Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Sports", href: "/dashboard/sports", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const superAdminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Elevate Admin", href: "/dashboard/elevate-admin", icon: UserPlus },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Gallery", href: "/dashboard/gallery", icon: Images },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Merchandise", href: "/dashboard/merchandise", icon: Shirt },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  { name: "Club Chants", href: "/dashboard/chants", icon: Music },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Order Management", href: "/dashboard/orders", icon: ShoppingCart },
  // { name: "Logistics", href: "/dashboard/logistics", icon: Truck },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: ChartNoAxesColumn },
  { name: "Coupons", href: "/dashboard/coupons", icon: Tag },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  { name: "Refunds", href: "/dashboard/admin/refunds", icon: RotateCcw },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "Admin Settings", href: "/dashboard/admin-settings", icon: Settings },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
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

// Tracks whether the dashboard chrome (sidebar + header) is already mounted
// above the current tree. The persistent `app/dashboard/layout.tsx` renders the
// chrome once and sets this to `true`, so any page that still wraps its content
// in <DashboardLayout> renders as a pass-through instead of mounting a second
// sidebar. This keeps the sidebar/header from unmounting & remounting (and
// re-fetching roles/settings/features) on every client-side navigation.
const DashboardChromeContext = createContext(false)

interface DashboardSidebarProps {
  mobile?: boolean
  navigation: { name: string; href: string; icon: React.ElementType }[]
  addOnNavigation: { name: string; href: string; icon: React.ElementType }[]
  pathname: string
  onCloseMobile?: () => void
  sidebarClubs: { _id: string; name: string; logo?: string }[]
  activeClubId?: string
  settings: any
  onClubSwitch: (clubId: string) => void
  user: any
  onLogout: () => void
  onLockedNavClick?: (href: string) => void
  availableRoles: { accountType: 'user' | 'admin' | 'system_owner'; accountId: string; role: string; name: string; clubIds?: string[] }[]
  onRoleSwitch: (accountType: 'user' | 'admin' | 'system_owner', accountId: string) => void
}

function DashboardSidebar({
  mobile = false,
  navigation,
  addOnNavigation,
  pathname,
  onCloseMobile,
  sidebarClubs,
  activeClubId,
  settings,
  onClubSwitch,
  user,
  onLogout,
  onLockedNavClick,
  availableRoles,
  onRoleSwitch,
}: DashboardSidebarProps) {
  const [addOnsOpen, setAddOnsOpen] = useState(false)

  const activeRowClass = (href: string) =>
    cn(
      "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative w-full text-left",
      pathname === href
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:translate-x-1",
    )

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
        {/* ── Active / enabled nav items ─────────────────────── */}
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={activeRowClass(item.href)}
            onClick={() => mobile && onCloseMobile?.()}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
              pathname === item.href
                ? "text-primary-foreground"
                : "text-muted-foreground group-hover:text-primary"
            )} />
            <span className="truncate flex-1">{item.name}</span>
            {pathname === item.href && (
              <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full my-auto inset-y-0" />
            )}
          </Link>
        ))}

        {/* ── Available Add-ons ──────────────────────────────── */}
        {addOnNavigation.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed">
            <button
              type="button"
              onClick={() => setAddOnsOpen((v) => !v)}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-500" />
                Available Add-ons
                <span className="tabular-nums bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5 text-[10px] font-black">
                  {addOnNavigation.length}
                </span>
              </span>
              {addOnsOpen
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
            </button>

            {addOnsOpen && (
              <div className="mt-1.5 space-y-1">
                {addOnNavigation.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left text-muted-foreground/60 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-200 group"
                    onClick={() => {
                      onLockedNavClick?.(item.href)
                      mobile && onCloseMobile?.()
                    }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0 text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
                    <span className="truncate flex-1 text-xs">{item.name}</span>
                    <Lock className="w-3 h-3 text-amber-500/70 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-6 border-t bg-muted/20">
        <div className="space-y-4">
          {(() => {
            const matchedClub = activeClubId
              ? sidebarClubs.find((c) => c._id === activeClubId)
              : null
            const staleSelection = Boolean(activeClubId && !matchedClub && sidebarClubs.length > 0)
            const currentClub = matchedClub ?? null
            const settingsLogo = settings ? ((settings as any).designSettings?.logo) : undefined
            const displayLogo = settingsLogo || currentClub?.logo
            const hasMultipleClubs = sidebarClubs.length > 1

            if (sidebarClubs.length === 0) return null

            const trigger = currentClub ? (
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
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Club unavailable — select one
                </p>
                {staleSelection && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Your previous selection is no longer valid.
                  </p>
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
          {availableRoles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors flex items-center justify-between gap-2"
                  title="Switch role"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const effectiveRole = getEffectiveRole(user, activeClubId)
                      const CurrentIcon = getRoleIcon(effectiveRole)
                      return <CurrentIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    })()}
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Logged in as</p>
                      <p className="text-sm font-bold text-foreground truncate">{formatRoleLabel(getEffectiveRole(user, activeClubId))}</p>
                    </div>
                  </div>
                  <Repeat className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 p-2 rounded-xl border-2 shadow-xl">
                {availableRoles.map((account) => {
                  const RoleIcon = getRoleIcon(account.role)
                  const isAdmin = account.role === 'admin'
                  const isSuperAdmin = account.role === 'super_admin'
                  const iconColor = isSuperAdmin
                    ? 'text-violet-500'
                    : isAdmin
                    ? 'text-blue-500'
                    : account.accountType === 'system_owner'
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                  return (
                    <DropdownMenuItem
                      key={`${account.accountType}-${account.accountId}`}
                      onClick={() => onRoleSwitch(account.accountType, account.accountId)}
                      className="rounded-lg gap-2 cursor-pointer"
                    >
                      <RoleIcon className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{formatRoleLabel(account.role)}</p>
                        <p className="text-xs text-muted-foreground truncate">{account.name}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                      {formatRoleLabel(getEffectiveRole(user, activeClubId))}
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
  // If the chrome is already provided by an ancestor (the dashboard layout),
  // render children directly so we don't mount a duplicate sidebar/header.
  const chromeAlreadyMounted = useContext(DashboardChromeContext)
  if (chromeAlreadyMounted) {
    return <>{children}</>
  }
  return <DashboardLayoutChrome>{children}</DashboardLayoutChrome>
}

function DashboardLayoutChrome({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin, activeClubId, setActiveClubId, switchRole } = useAuth()
  const [availableRoles, setAvailableRoles] = useState<{ accountType: 'user' | 'admin' | 'system_owner'; accountId: string; role: string; name: string; clubIds?: string[] }[]>([])

  useEffect(() => {
    if (!user) {
      setAvailableRoles([])
      return
    }
    let cancelled = false
    apiClient.getAvailableRoles().then((res) => {
      if (!cancelled && res.success && res.data) {
        setAvailableRoles(res.data.accounts)
      }
    })
    return () => { cancelled = true }
  }, [user])

  const handleRoleSwitch = async (accountType: 'user' | 'admin' | 'system_owner', accountId: string) => {
    const result = await switchRole(accountType, accountId)
    if (result.success) {
      router.push('/dashboard')
    }
  }

  const handleClubSwitch = async (clubId: string) => {
    const currentIsAdmin = user?.role === 'admin' || user?.role === 'super_admin'

    // If the currently-active admin/super_admin account already administers this
    // club, just change the active club — never switch accounts. Switching to a
    // linked member account here is what previously downgraded a super_admin to
    // 'member' when moving between their own clubs. The per-club effective role
    // (see getEffectiveRole) resolves super_admin vs admin for the new club.
    //
    // NOTE: the current account is deliberately excluded from `availableRoles`
    // by the backend (findLinkedAccounts), so we read the clubs the current
    // account administers from `user.clubs` directly, not from availableRoles.
    const ownAdminClubIds: string[] = currentIsAdmin
      ? (((user as any)?.clubs ?? [])
          .map((c: any) => normalizeClubId(c))
          .filter((id: string | null): id is string => Boolean(id)))
      : []
    if (currentIsAdmin && ownAdminClubIds.includes(clubId)) {
      setActiveClubId(clubId)
      router.refresh()
      return
    }

    // Otherwise a different linked account owns this club. Prefer an admin
    // account over a member account so we don't needlessly downgrade the role.
    const targetAccount =
      availableRoles.find((r) => r.accountType === 'admin' && r.clubIds?.includes(clubId)) ??
      availableRoles.find((r) => r.accountType === 'user' && r.clubIds?.includes(clubId))

    if (targetAccount) {
      const result = await switchRole(targetAccount.accountType, targetAccount.accountId)
      if (result.success) {
        setActiveClubId(clubId)
        router.refresh()
      }
    } else {
      // Current account already covers this club (or it's a system_owner)
      setActiveClubId(clubId)
      router.refresh()
    }
  }

  // Prevent body scroll so only the inner <main> scrolls (avoids double scrollbar)
  useEffect(() => {
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [])

  // Storage alert state (admin/super_admin only)
  const [storageAlertStatus, setStorageAlertStatus] = useState<StorageAlertStatus | null>(null)
  const [storageBannerDismissed, setStorageBannerDismissed] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const sidebarClubs = useMemo(() => buildAccessibleClubs(user), [user])

  useEffect(() => {
    if (!user || user.role === "system_owner") return
    if (sidebarClubs.length === 0) return

    const reconciled = reconcileActiveClubId(activeClubId, sidebarClubs)
    if (reconciled !== activeClubId) {
      setActiveClubId(reconciled)
    }
  }, [user, sidebarClubs, activeClubId, setActiveClubId])

  const clubId = useMemo(() => {
    if (!user || user.role === "system_owner") return undefined
    const reconciled = reconcileActiveClubId(activeClubId, sidebarClubs)
    return reconciled ?? undefined
  }, [user, activeClubId, sidebarClubs])

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
  const isAuthenticated = Boolean(user)

  // Register FCM device token for CONFIG_SYNC push notifications
  useFcmRegistration({ isAdmin: isAdminRole, isAuthenticated })
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean
    featureKey: ClubFeatureKey
    label: string
  } | null>(null)
  const { config: clubFeatures, loading: clubFeaturesLoading, isEnabled: isClubFeatureEnabled } = useClubFeatures(
    isAdminRole ? clubId ?? null : null
  )

  // Members also need the resolved feature flags so feature-gated nav items
  // (e.g. Guess the Score / predictions) are hidden when disabled for the club.
  // Uses the member-accessible endpoint; defaults to optimistically allowed while loading.
  const isRegularUserRole = !user?.role || user.role === 'member'
  const { isEnabled: isMemberFeatureEnabled } = useClubFeatures(
    isRegularUserRole ? clubId ?? null : null,
    { asMember: true }
  )

  const isNavLocked = (href: string) => {
    if (!isAdminRole || !clubFeatures) return false
    const key = ADMIN_NAV_FEATURE_MAP[href]
    if (!key) return false
    return !isClubFeatureEnabled(key)
  }

  const onLockedNavClick = (href: string) => {
    const key = ADMIN_NAV_FEATURE_MAP[href]
    if (!key || !clubId) return
    const label =
      clubFeatureFlags(clubFeatures).find((f) => f.key === key)?.label || key
    setUpgradeModal({ open: true, featureKey: key, label })
  }

  // SERVICE WORKER: listen for CONFIG_SYNC messages from the background push handler.
  // When received, bust the local cache so the next useClubFeatures fetch gets fresh data.
  useEffect(() => {
    if (!isAdminRole || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONFIG_SYNC' && event.data.clubId && clubId) {
        if (String(event.data.clubId) === String(clubId)) {
          void clearFeatureCache(clubId)
        }
      }
    }
    navigator.serviceWorker.addEventListener('message', onSwMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage)
  }, [isAdminRole, clubId])

  // Locked page feature key — replaces children with LockedFeaturePage (no redirect)
  const currentPageFeatureKey: ClubFeatureKey | null = (() => {
    if (!isAdminRole || !clubId || clubFeaturesLoading || !pathname) return null
    const key = ADMIN_NAV_FEATURE_MAP[pathname] ?? null
    if (!key) return null
    return !isClubFeatureEnabled(key) ? key : null
  })()

  useEffect(() => {
    if (!isAdminRole) return
    const onFeatureDisabled = (event: Event) => {
      const detail = (event as CustomEvent<{ feature?: ClubFeatureKey; message?: string }>).detail
      const featureKey = detail?.feature
      if (!featureKey) return
      const label =
        clubFeatureFlags(clubFeatures).find((f) => f.key === featureKey)?.label || featureKey
      setUpgradeModal({ open: true, featureKey, label })
    }
    window.addEventListener(CLUB_FEATURE_DISABLED_EVENT, onFeatureDisabled)
    return () => window.removeEventListener(CLUB_FEATURE_DISABLED_EVENT, onFeatureDisabled)
  }, [isAdminRole, clubFeatures])

  useEffect(() => {
    if (!isAdminRole) return
    apiClient.getStorageAlertStatus(clubId ?? undefined).then((res) => {
      if (res.success && res.data) {
        setStorageAlertStatus(res.data)
        if (res.data.showUpgradeModal) {
          setShowSubscriptionModal(true)
        }
      }
    }).catch(() => {})
  }, [isAdminRole, clubId])

  const getNavigation = () => {
    if (!user) return userNavigation

    // Use per-club effective role so an admin promoted to super_admin only in
    // specific clubs sees the correct nav for the currently active club.
    const effectiveRole = getEffectiveRole(user, clubId)

    let nav = []
    switch (effectiveRole) {
      case 'system_owner':
        nav = systemOwnerNavigation
        break
      case 'super_admin':
        nav = superAdminNavigation
        break
      case 'admin': {
        const contexts = (user as any).clubAdminContexts as AdminClubContext[] | undefined
        if (contexts && contexts.length > 0) {
          const ctx = contexts.find(
            (c) => c?.clubId && String(c.clubId) === String(clubId)
          )
          if (ctx) {
            const matrix: Record<string, { view: boolean; edit: boolean }> =
              (ctx as any).permissionsMatrix || (ctx as any).permissions?._matrix || {}
            nav = adminNavigation.filter((item) => {
              const moduleId = NAV_HREF_TO_PERMISSION_MODULE[item.href]
              if (!moduleId) return true
              return Boolean(matrix[moduleId]?.view)
            })
            break
          }
        }
        nav = adminNavigation
        break
      }
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
          // Require both the website-section toggle AND the predictions feature
          // flag — otherwise the page 403s with FEATURE_DISABLED_BY_SYSTEM.
          return canShowSection('guessTheScore') && isMemberFeatureEnabled('predictions')
        }
        return true
      })
      return filtered
    }
    
    return nav
  }

  const allNav = getNavigation()
  const activeNav = isAdminRole ? allNav.filter((item) => !isNavLocked(item.href)) : allNav
  const addOnNav = isAdminRole ? allNav.filter((item) => isNavLocked(item.href)) : []

  const lockedPageLabel = currentPageFeatureKey
    ? (clubFeatureFlags(clubFeatures).find((f) => f.key === currentPageFeatureKey)?.label ?? currentPageFeatureKey)
    : null

  return (
    <DashboardChromeContext.Provider value={true}>
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r bg-muted/5">
        <DashboardSidebar
          navigation={activeNav}
          addOnNavigation={addOnNav}
          pathname={pathname}
          sidebarClubs={sidebarClubs}
          activeClubId={activeClubId ?? undefined}
          settings={settings}
          onClubSwitch={handleClubSwitch}
          user={user}
          onLogout={logout}
          onLockedNavClick={onLockedNavClick}
          availableRoles={availableRoles}
          onRoleSwitch={handleRoleSwitch}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <DashboardSidebar
            mobile
            navigation={activeNav}
            addOnNavigation={addOnNav}
            pathname={pathname}
            onCloseMobile={() => setSidebarOpen(false)}
            sidebarClubs={sidebarClubs}
            activeClubId={activeClubId ?? undefined}
            settings={settings}
            onClubSwitch={(id) => { handleClubSwitch(id); setSidebarOpen(false) }}
            user={user}
            onLogout={logout}
            onLockedNavClick={onLockedNavClick}
            availableRoles={availableRoles}
            onRoleSwitch={(accountType, accountId) => { handleRoleSwitch(accountType, accountId); setSidebarOpen(false) }}
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
              {formatRoleLabel(getEffectiveRole(user, clubId))}
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
          {/* ClubFeaturesProvider gives all children a single shared config
              so the entire UI updates atomically on CONFIG_SYNC */}
          <ClubFeaturesProvider clubId={isAdminRole ? clubId : undefined}>
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
              {/* Replace page content with locked state instead of redirecting */}
              {currentPageFeatureKey && clubId && lockedPageLabel ? (
                <LockedFeaturePage
                  featureKey={currentPageFeatureKey}
                  featureLabel={lockedPageLabel}
                  clubId={clubId}
                  currentTier={clubFeatures?.billing_tier ?? undefined}
                />
              ) : (
                children
              )}
            </div>
            {/* <div className="mt-10 pt-6 border-t flex justify-center">
              <EkalonAttribution className="text-center" />
            </div> */}
          </ClubFeaturesProvider>
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
      {upgradeModal && clubId && (
        <UpgradeFeatureModal
          open={upgradeModal.open}
          onOpenChange={(open) => setUpgradeModal((m) => (m ? { ...m, open } : null))}
          clubId={clubId}
          featureKey={upgradeModal.featureKey}
          featureLabel={upgradeModal.label}
        />
      )}
    </div>
    </DashboardChromeContext.Provider>
  )
}
