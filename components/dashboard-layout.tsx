"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { NotificationCenterModal } from "@/components/modals/notification-center-modal"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  // { name: "Browse Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Club Chants", href: "/dashboard/chants", icon: Music },
  { name: "Merchandise Store", href: "/dashboard/merchandise", icon: Shirt },
  { name: "Order Management", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: ChartNoAxesColumn },
  // { name: "Match Center", href: "/dashboard/match-center", icon: Calendar },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  // { name: "Travel & Away Days", href: "/dashboard/travel", icon: Bus },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  // { name: "Inter Club Forum Mgmt", href: "/dashboard/forum", icon: MessageSquare },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Admin Settings", href: "/dashboard/admin-settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const systemOwnerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Club Management", href: "/dashboard/club-management", icon: Building },
  // { name: "Browse Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const superAdminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  // { name: "Browse Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Staff Management", href: "/dashboard/staff", icon: Shield },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Club Chants", href: "/dashboard/chants", icon: Music },
  { name: "Merchandise Store", href: "/dashboard/merchandise", icon: Shirt },
  { name: "Order Management", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: ChartNoAxesColumn },
  // { name: "Match Center", href: "/dashboard/match-center", icon: Calendar },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  // { name: "Travel & Away Days", href: "/dashboard/travel", icon: Bus },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  // { name: "Inter Club Forum Mgmt", href: "/dashboard/forum", icon: MessageSquare },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Admin Settings", href: "/dashboard/admin-settings", icon: Settings },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const userNavigation = [
  { name: "Feed", href: "/dashboard/user", icon: LayoutDashboard },
  { name: "Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "My Clubs", href: "/dashboard/user/my-clubs", icon: UserCheck },
  { name: "Members", href: "/dashboard/user/members", icon: Users },
  { name: "Events", href: "/dashboard/user/events", icon: Ticket },
  { name: "Leaderboard", href: "/dashboard/user/leaderboard", icon: ChartNoAxesColumn },
  { name: "News", href: "/dashboard/user/news", icon: Newspaper },
  { name: "Polls", href: "/dashboard/user/polls", icon: Vote },
  { name: "Club Chants", href: "/dashboard/user/chants", icon: Music },
  { name: "Merchandise", href: "/merchandise", icon: Shirt },
  { name: "My Orders", href: "/dashboard/user/orders", icon: ShoppingCart },
  { name: "Volunteer", href: "/dashboard/volunteer", icon: Heart },
  { name: "Member Onboarding", href: "/dashboard/member-onboarding", icon: GraduationCap },
  { name: "External Ticketing", href: "/dashboard/user/external-ticketing", icon: ExternalLink },
  { name: "Browse Plans", href: "/dashboard/user/browse-plans", icon: CreditCard },
  { name: "Membership Card", href: "/dashboard/user/membership-card", icon: CreditCard },
  { name: "My Profile", href: "/dashboard/user/profile", icon: User },
  { name: "My Settings", href: "/dashboard/user-settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
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
  const { user, logout, isAdmin, activeClubId } = useAuth()
  
  const getUserClubId = () => {
    if (!user || user.role === 'system_owner') return undefined
    const userWithMemberships = user as any
    
    if (activeClubId) {
      const activeMembership = userWithMemberships.memberships?.find(
        (m: any) => (m.club_id?._id || m.club_id) === activeClubId && m.status === 'active'
      )
      if (activeMembership) {
        return activeClubId
      }
    }

    const activeMembership = userWithMemberships.memberships?.find((m: any) => m.status === 'active')
    return activeMembership?.club_id?._id
  }
  
  const clubId = getUserClubId()
  const { isSectionVisible, settings, loading: settingsLoading } = useClubSettings(clubId)
  
  useDesignSettings(clubId)
  
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
        if (item.name === 'Merchandise' || item.name === 'Merchandise Store') {
          return canShowSection('merchandise')
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
        return true
      })
      return filtered
    }
    
    return nav
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full bg-card", mobile ? "w-full" : "w-72")}>
      <div className="flex items-center gap-3 p-8 border-b">
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
      </div>

      <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {getNavigation().map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:translate-x-1",
            )}
            onClick={() => mobile && setSidebarOpen(false)}
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
          {/* Club Name Display */}
          {(() => {
            const userAny = user as any
            let clubName: string | undefined
            let clubLogo: string | undefined
            
            if (activeClubId) {
              const activeMembership = userAny?.memberships?.find(
                (m: any) => (m.club_id?._id || m.club_id) === activeClubId && m.status === 'active'
              )
              if (activeMembership?.club_id) {
                clubName = activeMembership.club_id.name
                clubLogo = activeMembership.club_id.logo
              }
            }
            
            if (!clubName) {
              clubName = userAny?.club?.name
              clubLogo = userAny?.club?.logo
            }
            if (!clubName) {
              const firstMembership = userAny?.memberships?.find((m: any) => m.status === 'active')
              clubName = firstMembership?.club_id?.name
              clubLogo = firstMembership?.club_id?.logo
            }
            
            const settingsLogo = settings ? ((settings as any).designSettings?.logo) : undefined
            const displayLogo = settingsLogo || clubLogo
            
            const activeMemberships = userAny?.memberships?.filter((m: any) => m.status === 'active') || []
            const uniqueClubIds = new Set<string>()
            activeMemberships.forEach((m: any) => {
              const clubId = m.club_id?._id || m.club_id
              if (clubId) uniqueClubIds.add(clubId)
            })
            const hasMultipleClubs = uniqueClubIds.size > 1
            
            if (clubName) {
              return (
                <div 
                  className={cn(
                    "px-3 py-2 rounded-xl bg-primary/5 border border-primary/10",
                    hasMultipleClubs && "cursor-pointer hover:bg-primary/10 transition-colors"
                  )}
                  onClick={hasMultipleClubs ? () => router.push('/splash') : undefined}
                  title={hasMultipleClubs ? "Click to switch club" : undefined}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Selected Club</p>
                  <div className="flex items-center gap-2">
                    {displayLogo && (
                      <div className="relative w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={displayLogo}
                          alt={clubName}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm font-bold text-foreground truncate">{clubName}</p>
                    {hasMultipleClubs && (
                      <span className="text-xs text-muted-foreground ml-auto">↗</span>
                    )}
                  </div>
                </div>
              )
            }
            return null
          })()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-14 px-4 justify-start bg-card border-2 hover:bg-muted/50 transition-all rounded-2xl group shadow-sm">
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-sm font-black text-primary flex-shrink-0 ring-2 ring-primary/5 group-hover:scale-110 transition-transform">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
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
                onClick={logout}
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r bg-muted/5">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b lg:px-8 h-16 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
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
            </div>
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/5">
          <div className="container mx-auto p-6 md:p-8 lg:p-10 max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
