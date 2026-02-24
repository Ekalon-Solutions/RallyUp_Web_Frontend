"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Globe, Eye, EyeOff, ExternalLink, Copy, Share2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import {
  DEFAULT_WEBSITE_SECTIONS,
  WEBSITE_SECTION_OPTIONS,
  isWebsiteOptionEnabled,
  sanitizeWebsiteSections,
  setWebsiteOptionEnabled,
} from "@/lib/websiteSections"

interface WebsiteInfo {
  title: string
  description: string
  contactEmail: string
  contactPhone: string
  isPublished: boolean
}

export function WebsiteSetupTab() {
  const { user, checkAuth } = useAuth()
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slugInput, setSlugInput] = useState<string | null>(null)
  const [slugSaving, setSlugSaving] = useState(false)
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo>({
    title: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    isPublished: false,
  })
  const [memberSections, setMemberSections] = useState<Record<string, boolean>>({
    ...DEFAULT_WEBSITE_SECTIONS,
  })

  const currentClubSlug = useMemo(() => {
    if (!user || !clubId) return null
    const u = user as any
    const id = (c: any) => c?._id?.toString?.() ?? (typeof c === "string" ? c : null)
    const fromClubs = u.clubs?.find((c: any) => id(c) === clubId)
    if (fromClubs && typeof fromClubs === "object" && fromClubs.slug) return fromClubs.slug
    const fromMembership = u.memberships?.find(
      (m: any) => m?.status === "active" && (id(m.club_id) === clubId || id(m.club) === clubId)
    )
    const ref = fromMembership?.club_id ?? fromMembership?.club
    if (ref && typeof ref === "object" && ref.slug) return ref.slug
    if (u.club && id(u.club) === clubId && u.club.slug) return u.club.slug
    return null
  }, [user, clubId])

  useEffect(() => {
    if (clubId) {
      loadSettings()
    }
    if (currentClubSlug) setSlugInput(currentClubSlug)
  }, [clubId, currentClubSlug])

  const loadSettings = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const websiteSetup = actualData.websiteSetup || {}
        const memberVisibility = actualData.memberSectionVisibility || {}
        setWebsiteInfo({
          title: websiteSetup.title ?? '',
          description: websiteSetup.description ?? '',
          contactEmail: websiteSetup.contactEmail ?? '',
          contactPhone: websiteSetup.contactPhone ?? '',
          isPublished: Boolean(websiteSetup.isPublished),
        })
        setMemberSections({
          ...DEFAULT_WEBSITE_SECTIONS,
          ...sanitizeWebsiteSections(memberVisibility.sections),
        })
      } else {
        toast.error("Failed to load settings - invalid response")
      }
    } catch (error) {
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

      const [websiteRes, memberVisRes] = await Promise.all([
        apiClient.updateWebsiteSetup(clubId, {
          title: websiteInfo.title,
          description: websiteInfo.description,
          contactEmail: websiteInfo.contactEmail,
          contactPhone: websiteInfo.contactPhone,
          isPublished: websiteInfo.isPublished,
        }),
        apiClient.updateMemberSectionVisibility(clubId, { sections: memberSections }),
      ])

      if (websiteRes.success && memberVisRes.success) {
        toast.success("Website and member visibility settings saved successfully!")
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem(`clubSettings:${clubId}`)
          } catch {
          }
        }
        await loadSettings()
      } else {
        toast.error(websiteRes.message || memberVisRes.message || "Failed to save settings")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const toggleOption = (optionId: string) => {
    const option = WEBSITE_SECTION_OPTIONS.find((o) => o.id === optionId)
    if (!option) return
    const currentlyEnabled = isWebsiteOptionEnabled(memberSections, option)
    setMemberSections((prev) => setWebsiteOptionEnabled(prev, option, !currentlyEnabled))
  }

  const copyPublicUrl = () => {
    if (!clubId) return
    const identifier = slugInput || currentClubSlug || clubId
    const publicUrl = `${window.location.origin}/clubs/${identifier}`
    navigator.clipboard.writeText(publicUrl)
    toast.success("Public URL copied to clipboard!")
  }

  const openPublicPage = () => {
    if (!clubId) return
    const identifier = slugInput || currentClubSlug || clubId
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
            Your club's public page status: {websiteInfo.isPublished ? <Badge className="bg-green-500">Published</Badge> : <Badge variant="secondary">Not Published</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <code className="text-sm flex-1 truncate text-blue-600 dark:text-blue-400">
              {(slugInput || currentClubSlug || clubId) ? `${typeof window !== 'undefined' ? window.location.origin : ''}/clubs/${slugInput || currentClubSlug || clubId}` : 'Loading...'}
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
                      try { await checkAuth() } catch (e) {}
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
          <div className="flex gap-2 flex-col sm:flex-row">
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
              value={websiteInfo.title}
              onChange={(e) => setWebsiteInfo((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your club name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Website Description</Label>
            <Textarea
              id="description"
              value={websiteInfo.description}
              onChange={(e) => setWebsiteInfo((prev) => ({ ...prev, description: e.target.value }))}
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
                value={websiteInfo.contactEmail}
                onChange={(e) => setWebsiteInfo((prev) => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="contact@yourclub.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={websiteInfo.contactPhone}
                onChange={(e) => setWebsiteInfo((prev) => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member Dashboard Section Visibility</CardTitle>
          <CardDescription>
            Control which sections appear in the member dashboard sidebar (user view). This does not affect the public club page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {WEBSITE_SECTION_OPTIONS.map((option) => {
            const enabled = isWebsiteOptionEnabled(memberSections, option)
            return (
              <div key={option.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {enabled ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <div>
                    <Label htmlFor={option.id} className="text-base font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {enabled ? "Visible in member dashboard" : "Hidden in member dashboard"}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.id}
                  checked={enabled}
                  onCheckedChange={() => toggleOption(option.id)}
                />
              </div>
            )
          })}
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
