"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Globe, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface WebsiteSettings {
  title: string
  description: string
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WebsiteSettings>({
    title: "",
    description: "",
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
    },
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
      console.log("Club settings response:", response)
      console.log("Full response structure:", JSON.stringify(response, null, 2))
      
      // Backend returns { success: true, data: settings }
      // API client wraps it as { success: true, data: { success: true, data: settings } }
      // So we need response.data.data.websiteSetup
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const websiteSetup = actualData.websiteSetup || {
          title: '',
          description: '',
          contactEmail: '',
          contactPhone: '',
          sections: {
            news: true,
            events: true,
            store: true,
            polls: true,
            chants: true,
            members: true,
            merchandise: true,
          }
        }
        setSettings(websiteSetup)
        console.log("Loaded websiteSetup:", websiteSetup)
      } else {
        console.warn("Invalid response format:", response)
        toast.error("Failed to load settings - invalid response")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    
    if (!clubId) {
      toast.error("Club ID not found")
      return
    }

    try {
      setSaving(true)
      console.log("=== SAVE ATTEMPT ===")
      console.log("Club ID:", clubId)
      console.log("Settings to save:", JSON.stringify(settings, null, 2))
      
      const response = await apiClient.updateWebsiteSetup(clubId, settings)
      console.log("=== SAVE RESPONSE ===")
      console.log("Full response:", response)
      
      if (response.success) {
        toast.success("Website settings saved successfully!")
        // Reload settings to confirm save
        await loadSettings()
      } else {
        toast.error(response.message || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: keyof WebsiteSettings["sections"]) => {
    setSettings({
      ...settings,
      sections: {
        ...settings.sections,
        [section]: !settings.sections[section],
      },
    })
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Information
          </CardTitle>
          <CardDescription>
            Configure your club basic website details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Website Title</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => {
                console.log("Title changed to:", e.target.value)
                setSettings({ ...settings, title: e.target.value })
              }}
              placeholder="Enter your club name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Website Description</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => {
                console.log("Description changed to:", e.target.value)
                setSettings({ ...settings, description: e.target.value })
              }}
              placeholder="Brief description of your club"
              rows={4}
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
                placeholder="contact@yourclub.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Visibility</CardTitle>
          <CardDescription>
            Enable or disable different sections of your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.sections).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {value ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <Label htmlFor={key} className="text-base font-medium capitalize cursor-pointer">
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
                onCheckedChange={() => toggleSection(key as keyof WebsiteSettings["sections"])}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="button"
          onClick={handleSave} 
          disabled={saving || !clubId} 
          size="lg"
        >
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
