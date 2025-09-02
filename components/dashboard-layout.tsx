"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
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
  MessageSquare,
  BarChart3,
  Shield,
  Newspaper,
  Shirt,
  Calendar,
  Bus,
  LayoutDashboard,
  User,
  Building,
  CreditCard,
  Building2,
  Heart,
  GraduationCap,
  Megaphone,
  Vote,
  Music,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Browse Clubs", href: "/dashboard/clubs", icon: Building2 },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Our Chants", href: "/dashboard/chants", icon: Music },
  { name: "Merchandise Store", href: "/dashboard/store", icon: Shirt },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Match Center", href: "/dashboard/match-center", icon: Calendar },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  { name: "Travel & Away Days", href: "/dashboard/travel", icon: Bus },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  { name: "Inter Club Forum Mgmt", href: "/dashboard/forum", icon: MessageSquare },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const systemOwnerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Club Management", href: "/dashboard/club-management", icon: Building },
  { name: "Browse Clubs", href: "/dashboard/clubs", icon: Building2 },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const superAdminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Browse Clubs", href: "/dashboard/clubs", icon: Building2 },
  { name: "Staff Management", href: "/dashboard/staff", icon: Shield },
  { name: "Membership Plans", href: "/dashboard/membership-plans", icon: CreditCard },
  { name: "Membership Cards", href: "/dashboard/membership-cards", icon: CreditCard },
  { name: "News & Updates", href: "/dashboard/content", icon: Newspaper },
  { name: "Polls", href: "/dashboard/polls", icon: Vote },
  { name: "Our Chants", href: "/dashboard/chants", icon: Music },
  { name: "Merchandise Store", href: "/dashboard/store", icon: Shirt },
  { name: "Events & Tickets", href: "/dashboard/events", icon: Ticket },
  { name: "Match Center", href: "/dashboard/match-center", icon: Calendar },
  { name: "Group Website", href: "/dashboard/website", icon: Globe },
  { name: "Travel & Away Days", href: "/dashboard/travel", icon: Bus },
  { name: "External Ticketing", href: "/dashboard/external-ticketing", icon: ExternalLink },
  { name: "Inter Club Forum Mgmt", href: "/dashboard/forum", icon: MessageSquare },
  { name: "Volunteer Management", href: "/dashboard/volunteer-management", icon: Heart },
  { name: "Onboarding & Promotions", href: "/dashboard/onboarding", icon: GraduationCap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const userNavigation = [
  { name: "Feed", href: "/dashboard/user", icon: LayoutDashboard },
  { name: "Clubs", href: "/dashboard/user/clubs", icon: Building2 },
  { name: "Members", href: "/dashboard/user/members", icon: Users },
  { name: "Events", href: "/dashboard/user/events", icon: Ticket },
  { name: "News", href: "/dashboard/user/news", icon: Newspaper },
  { name: "Polls", href: "/dashboard/user/polls", icon: Vote },
  { name: "Our Chants", href: "/dashboard/user/chants", icon: Music },
  { name: "Volunteer", href: "/dashboard/volunteer", icon: Heart },
  { name: "Member Onboarding", href: "/dashboard/member-onboarding", icon: GraduationCap },
  { name: "Membership Card", href: "/dashboard/user/membership-card", icon: CreditCard },
  { name: "My Profile", href: "/dashboard/user/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()

  // Get navigation based on user role
  const getNavigation = () => {
    if (!user) return userNavigation
    
    switch (user.role) {
      case 'system_owner':
        return systemOwnerNavigation
      case 'super_admin':
        return superAdminNavigation
      case 'admin':
        return adminNavigation
      default:
        return userNavigation
    }
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "w-full" : "w-64")}>
      <div className="flex items-center gap-2 p-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">RallyUp</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {getNavigation().map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            <span className="truncate">Get Started: 0% completed</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="truncate">{user?.name || 'User Account'}</span>
                  {isAdmin && (
                    <Shield className="w-3 h-3 text-primary" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="text-sm text-muted-foreground">Client Name</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
