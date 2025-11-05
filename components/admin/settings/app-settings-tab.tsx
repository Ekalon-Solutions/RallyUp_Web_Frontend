"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Bell, Shield } from "lucide-react"
import { toast } from "sonner"

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
}

export function AppSettingsTab() {
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
    appRules: ""
  })

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
    try {
      setSaving(true)
      // TODO: Implement API call
      // const response = await apiClient.updateAppSettings(settings)
      toast.success("App settings saved successfully!")
    } catch (error) {
      console.error("Error saving app settings:", error)
      toast.error("Failed to save app settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure which events trigger notifications for your members
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
