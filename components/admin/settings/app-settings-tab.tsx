"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Bell, Shield } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

interface NotificationSettings {
  events: boolean
  membershipRenewals: boolean
  membershipExpiry: boolean
  newMerchandise: boolean
  pollResults: boolean
  newsUpdates: boolean
}

interface AppSettings {
  notifications: NotificationSettings
  appRules: string
  maintenanceMode: boolean
  openRegistration: boolean
  publicEvents: boolean
}

export function AppSettingsTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      events: true,
      membershipRenewals: true,
      membershipExpiry: true,
      newMerchandise: true,
      pollResults: false,
      newsUpdates: true
    },
    appRules: "",
    maintenanceMode: false,
    openRegistration: true,
    publicEvents: false
  })

  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id

  useEffect(() => {
    if (clubId) {
      loadSettings()
    }
  }, [clubId])

  const loadSettings = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const appSettings = actualData.appSettings || {
          notifications: {
            events: true,
            membershipRenewals: true,
            membershipExpiry: true,
            newMerchandise: true,
            pollResults: false,
            newsUpdates: true
          },
          appRules: ""
        }
        setSettings({
          notifications: appSettings.notifications,
          appRules: appSettings.appRules,
          maintenanceMode: appSettings.maintenanceMode ?? false,
          openRegistration: appSettings.openRegistration ?? true,
          publicEvents: appSettings.publicEvents ?? false
        })
      }
    } catch (error) {
      console.error("Error loading app settings:", error)
      toast.error("Failed to load app settings")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    })
  }

  const handleSave = async () => {
    if (!clubId) {
      toast.error("Club ID not found")
      return
    }

    try {
      setSaving(true)
      const response = await apiClient.updateAppSettings(clubId, settings)
      
      if (response.success) {
        toast.success("App settings saved successfully!")
        await loadSettings()
      } else {
        toast.error(response.message || "Failed to save app settings")
      }
    } catch (error) {
      console.error("Error saving app settings:", error)
      toast.error("Failed to save app settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                User Notification Preferences
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                These are default notification settings for your club. Individual users can override these settings in their personal preferences (My Settings).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Default Notification Settings
          </CardTitle>
          <CardDescription>
            Configure default notification settings for new members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="events" className="text-base font-medium">
                  Event Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify members about new events and event updates
                </p>
              </div>
              <Switch
                id="events"
                checked={settings.notifications.events}
                onCheckedChange={() => handleNotificationToggle("events")}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="membershipRenewals" className="text-base font-medium">
                  Membership Renewals
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remind members when their membership is up for renewal
                </p>
              </div>
              <Switch
                id="membershipRenewals"
                checked={settings.notifications.membershipRenewals}
                onCheckedChange={() => handleNotificationToggle("membershipRenewals")}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="membershipExpiry" className="text-base font-medium">
                  Membership Expiry
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alert members when their membership is about to expire
                </p>
              </div>
              <Switch
                id="membershipExpiry"
                checked={settings.notifications.membershipExpiry}
                onCheckedChange={() => handleNotificationToggle("membershipExpiry")}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="newMerchandise" className="text-base font-medium">
                  New Merchandise
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify members when new merchandise is available
                </p>
              </div>
              <Switch
                id="newMerchandise"
                checked={settings.notifications.newMerchandise}
                onCheckedChange={() => handleNotificationToggle("newMerchandise")}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="pollResults" className="text-base font-medium">
                  Poll Results
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify members when poll results are available
                </p>
              </div>
              <Switch
                id="pollResults"
                checked={settings.notifications.pollResults}
                onCheckedChange={() => handleNotificationToggle("pollResults")}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="newsUpdates" className="text-base font-medium">
                  News Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify members about new news articles and announcements
                </p>
              </div>
              <Switch
                id="newsUpdates"
                checked={settings.notifications.newsUpdates}
                onCheckedChange={() => handleNotificationToggle("newsUpdates")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App-Wide Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            App-Wide Rules
          </CardTitle>
          <CardDescription>
            Define general rules and guidelines for all club members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="appRules">Community Rules & Guidelines</Label>
            <Textarea
              id="appRules"
              value={settings.appRules}
              onChange={(e) => setSettings({ ...settings, appRules: e.target.value })}
              placeholder="Enter app-wide rules and guidelines here...&#10;&#10;Example:&#10;1. Be respectful to all members&#10;2. No spam or promotional content&#10;3. Keep discussions relevant to the club&#10;4. Report inappropriate behavior to admins"
              rows={12}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {settings.appRules.length} characters • These rules will be visible to all members
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>
            More configuration options for your club app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode" className="text-base font-medium">
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable access for members (admins only)
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={false}
              disabled
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="memberRegistration" className="text-base font-medium">
                Open Member Registration
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow new members to sign up without approval
              </p>
            </div>
            <Switch
              id="memberRegistration"
              checked={true}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="publicEvents" className="text-base font-medium">
                Public Events
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow non-members to view event listings
              </p>
            </div>
            <Switch
              id="publicEvents"
              checked={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save App Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
