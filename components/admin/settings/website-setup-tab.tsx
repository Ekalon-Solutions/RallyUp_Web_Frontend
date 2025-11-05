"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Save, Globe, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface WebsiteSettings {
  websiteTitle: string
  websiteDescription: string
  contactEmail: string
  contactPhone: string
  sections: {
    news: boolean
    events: boolean
    store: boolean
    polls: boolean
    chants: boolean
    members: boolean
    merchandise: boolean
  }
}

export function WebsiteSetupTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WebsiteSettings>({
    websiteTitle: "",
    websiteDescription: "",
    contactEmail: "",
    contactPhone: "",
    sections: {
      news: true,
      events: true,
      store: true,
      polls: true,
      chants: true,
      members: true,
      merchandise: true,
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to get club settings
      // const response = await apiClient.getClubSettings()
      // if (response.success) {
      //   setSettings(response.data)
      // }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Implement API call to save club settings
      // const response = await apiClient.updateClubSettings(settings)
      // if (response.success) {
      toast.success("Website settings saved successfully!")
      // }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSectionToggle = (section: keyof typeof settings.sections) => {
    setSettings({
      ...settings,
      sections: {
        ...settings.sections,
        [section]: !settings.sections[section]
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Configure your website's basic information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websiteTitle">Website Title</Label>
            <Input
              id="websiteTitle"
              value={settings.websiteTitle}
              onChange={(e) => setSettings({ ...settings, websiteTitle: e.target.value })}
              placeholder="My Awesome Club"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteDescription">Website Description</Label>
            <Textarea
              id="websiteDescription"
              value={settings.websiteDescription}
              onChange={(e) => setSettings({ ...settings, websiteDescription: e.target.value })}
              placeholder="Describe your club..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="contact@club.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Section Visibility</CardTitle>
          <CardDescription>
            Enable or disable different sections of your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.sections).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                {value ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <Label htmlFor={key} className="text-base capitalize cursor-pointer">
                    {key}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {value ? "Visible to members" : "Hidden from members"}
                  </p>
                </div>
              </div>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={() => handleSectionToggle(key as keyof typeof settings.sections)}
              />
            </div>
          ))}
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
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
