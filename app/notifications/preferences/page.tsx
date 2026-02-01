"use client"

import React, { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bell, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { useAuth } from "@/contexts/auth-context"

export default function NotificationPreferencesLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  const type = searchParams.get("type")

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard/user-settings")
    }
  }, [isAuthenticated, isLoading, router])

  const goToLogin = () => {
    const next = "/dashboard/user-settings"
    router.push(`/login?tab=user-login&next=${encodeURIComponent(next)}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification preferences
            </CardTitle>
            <CardDescription>
              {type ? `Manage preferences for: ${type}` : "Manage what notifications you receive in the app."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To update your notification preferences, please sign in and you’ll be redirected to the in-app settings page.
            </p>
            <Button onClick={goToLogin} className="font-bold">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to manage preferences
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

