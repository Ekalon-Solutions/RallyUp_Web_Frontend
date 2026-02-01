"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Bell, Save } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

export default function UserSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    events: true,
    membershipRenewals: true,
    membershipExpiry: true,
    newMerchandise: true,
    pollResults: true,
    newsUpdates: true,
    orders: true,
    refunds: true,
    ticketStatus: true,
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUserProfile()
      
      if (response.success && response.data) {
        const userPrefs = response.data.notificationPreferences
        if (userPrefs) {
          setPreferences(userPrefs)
        }
      }
    } catch (error) {
      // console.error("Error loading preferences:", error)
      toast.error("Failed to load notification preferences")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await apiClient.updateUserProfile({
        notificationPreferences: preferences
      })
      
      if (response.success) {
        toast.success("Notification preferences saved!")
      } else {
        toast.error("Failed to save preferences")
      }
    } catch (error) {
      // console.error("Error saving preferences:", error)
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your notification preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive. These settings override the club's default notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="events">Event Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about new events and event updates
                    </p>
                  </div>
                  <Switch
                    id="events"
                    checked={preferences.events}
                    onCheckedChange={() => handleToggle('events')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="membershipRenewals">Membership Renewals</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind me when my membership is up for renewal
                    </p>
                  </div>
                  <Switch
                    id="membershipRenewals"
                    checked={preferences.membershipRenewals}
                    onCheckedChange={() => handleToggle('membershipRenewals')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="membershipExpiry">Membership Expiry</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert me when my membership is about to expire
                    </p>
                  </div>
                  <Switch
                    id="membershipExpiry"
                    checked={preferences.membershipExpiry}
                    onCheckedChange={() => handleToggle('membershipExpiry')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newMerchandise">New Merchandise</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when new merchandise is available
                    </p>
                  </div>
                  <Switch
                    id="newMerchandise"
                    checked={preferences.newMerchandise}
                    onCheckedChange={() => handleToggle('newMerchandise')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pollResults">Poll Results</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when poll results are available
                    </p>
                  </div>
                  <Switch
                    id="pollResults"
                    checked={preferences.pollResults}
                    onCheckedChange={() => handleToggle('pollResults')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsUpdates">News Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me about new news articles and announcements
                    </p>
                  </div>
                  <Switch
                    id="newsUpdates"
                    checked={preferences.newsUpdates}
                    onCheckedChange={() => handleToggle('newsUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ticketStatus">Ticket Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates when your event registration/ticket status changes
                    </p>
                  </div>
                  <Switch
                    id="ticketStatus"
                    checked={preferences.ticketStatus}
                    onCheckedChange={() => handleToggle('ticketStatus')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="orders">Orders</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about your merchandise orders and deliveries
                    </p>
                  </div>
                  <Switch
                    id="orders"
                    checked={preferences.orders}
                    onCheckedChange={() => handleToggle('orders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="refunds">Refunds</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about refund requests and refund status
                    </p>
                  </div>
                  <Switch
                    id="refunds"
                    checked={preferences.refunds}
                    onCheckedChange={() => handleToggle('refunds')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
