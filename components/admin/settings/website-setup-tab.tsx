"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Globe, Eye, EyeOff, ExternalLink, Copy, Share2 } from "lucide-react"
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
  const { user, checkAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slugInput, setSlugInput] = useState<string | null>(null)
  const [slugSaving, setSlugSaving] = useState(false)
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
    // initialize slug input from user club data
    const existingSlug = (user as any)?.club?.slug || (user as any)?.club_id?.slug
    if (existingSlug) setSlugInput(existingSlug)
  }, [clubId])

    const loadSettings = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      // console.log("Club settings response:", response)
      // console.log("Full response structure:", JSON.stringify(response, null, 2))
      
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
        // console.log("Loaded websiteSetup:", websiteSetup)
      } else {
        // console.warn("Invalid response format:", response)
        toast.error("Failed to load settings - invalid response")
      }
    } catch (error) {
      // console.error("Error loading settings:", error)
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
      // console.log("=== SAVE ATTEMPT ===")
      // console.log("Club ID:", clubId)
      // console.log("Settings to save:", JSON.stringify(settings, null, 2))
      
      const response = await apiClient.updateWebsiteSetup(clubId, settings)
      // console.log("=== SAVE RESPONSE ===")
      // console.log("Full response:", response)
      
      if (response.success) {
        toast.success("Website settings saved successfully!")
        // Reload settings to confirm save
        await loadSettings()
      } else {
        toast.error(response.message || "Failed to save settings")
      }
    } catch (error) {
      // console.error("Error saving settings:", error)
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

  const copyPublicUrl = () => {
    if (!clubId) return
    
    // Get club slug from user object
    const clubSlug = (user as any)?.club?.slug || (user as any)?.club_id?.slug
    const identifier = clubSlug || clubId
    
    const publicUrl = `${window.location.origin}/clubs/${identifier}`
    navigator.clipboard.writeText(publicUrl)
    toast.success("Public URL copied to clipboard!")
  }

  const openPublicPage = () => {
    if (!clubId) return
    
    // Get club slug from user object
    const clubSlug = (user as any)?.club?.slug || (user as any)?.club_id?.slug
    const identifier = clubSlug || clubId
    
    const publicUrl = `${window.location.origin}/clubs/${identifier}`
    window.open(publicUrl, '_blank')
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
      {/* Public Page URL Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Share2 className="h-5 w-5" />
            Public Club Page
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Your club's public page is live and can be shared with anyone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <code className="text-sm flex-1 truncate text-blue-600 dark:text-blue-400">
              {(user as any)?.club?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/clubs/${(user as any)?.club?.slug}` : 'Loading...'}
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="md:col-span-2">
              <Label htmlFor="slug">Custom Slug</Label>
              <Input
                id="slug"
                value={slugInput || ''}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="enter a custom slug (lowercase, letters, numbers, hyphens)"
              />
              <p className="text-sm text-muted-foreground mt-1">Only lowercase letters, numbers and hyphens are allowed.</p>
            </div>
            <div>
              <Button
                className="w-full mt-2 md:mt-6"
                onClick={async () => {
                  if (!clubId) return toast.error('Club id missing')
                  const slug = (slugInput || '').trim()
                  if (!slug) return toast.error('Please enter a slug')
                  if (!/^[a-z0-9-]+$/.test(slug)) return toast.error('Slug must contain only lowercase letters, numbers, and hyphens')
                  try {
                    setSlugSaving(true)
                    const resp = await apiClient.updateClubBasicInfo(clubId, { slug })
                    if (resp.success) {
                      toast.success('Slug updated successfully')
                      // refresh auth/user so displayed club slug updates
                      try { await checkAuth() } catch (e) { /* ignore */ }
                    } else {
                      toast.error(resp.error || resp.message || 'Failed to update slug')
                    }
                  } catch (err) {
                    toast.error('Error updating slug')
                  } finally {
                    setSlugSaving(false)
                  }
                }}
                disabled={slugSaving}
              >
                {slugSaving ? 'Saving...' : 'Update Slug'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={copyPublicUrl}
              variant="outline"
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button 
              onClick={openPublicPage}
              variant="default"
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Public Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Information
          </CardTitle>
          <CardDescription>
            Configure your club basic website details that will appear on the public page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Website Title</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => {
                // console.log("Title changed to:", e.target.value)
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
                // console.log("Description changed to:", e.target.value)
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
