"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, Palette, Upload, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

interface DesignSettings {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  logo: string | null
  motto: string
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    youtube: string
  }
}

export function DesignSettingsTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<DesignSettings>({
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    fontFamily: "Inter",
    logo: null,
    motto: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: ""
    }
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
        const designSettings = actualData.designSettings || {
          primaryColor: "#3b82f6",
          secondaryColor: "#8b5cf6",
          fontFamily: "Inter",
          logo: null,
          motto: "",
          socialMedia: {
            facebook: "",
            twitter: "",
            instagram: "",
            youtube: ""
          }
        }
        setSettings(designSettings)
        console.log("Loaded design settings:", designSettings)
      }
    } catch (error) {
      console.error("Error loading design settings:", error)
      toast.error("Failed to load design settings")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file (JPG, PNG)")
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string })
        toast.success("Logo uploaded successfully")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!clubId) {
      toast.error("Club ID not found")
      return
    }

    try {
      setSaving(true)
      console.log("Saving design settings:", settings)
      
      const response = await apiClient.updateDesignSettings(clubId, settings)
      
      if (response.success) {
        toast.success("Design settings saved successfully!")
        await loadSettings()
      } else {
        toast.error(response.message || "Failed to save design settings")
      }
    } catch (error) {
      console.error("Error saving design settings:", error)
      toast.error("Failed to save design settings")
    } finally {
      setSaving(false)
    }
  }

  const fontOptions = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Colors
          </CardTitle>
          <CardDescription>
            Customize the color scheme of your club's website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2" style={{
            backgroundColor: settings.primaryColor + '20',
            borderColor: settings.primaryColor
          }}>
            <p className="font-medium" style={{ color: settings.primaryColor }}>
              Preview of primary color
            </p>
            <p className="text-sm mt-1" style={{ color: settings.secondaryColor }}>
              Preview of secondary color
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Choose a font family for your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <select
              id="fontFamily"
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: settings.fontFamily }}>
              This is how text will look with {settings.fontFamily}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Motto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Upload your club logo and set your motto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Club Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logo && (
                <div className="w-24 h-24 rounded-lg border-2 overflow-hidden">
                  <img
                    src={settings.logo}
                    alt="Club Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG or JPG (max 2MB)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motto">Club Motto</Label>
            <Input
              id="motto"
              value={settings.motto}
              onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
              placeholder="e.g., Unity, Passion, Excellence"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {settings.motto.length}/100 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Add links to your club's social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.socialMedia.facebook}
                onChange={(e) => setSettings({
                  ...settings,
                  socialMedia: { ...settings.socialMedia, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/yourclub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                value={settings.socialMedia.twitter}
                onChange={(e) => setSettings({
                  ...settings,
                  socialMedia: { ...settings.socialMedia, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/yourclub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.socialMedia.instagram}
                onChange={(e) => setSettings({
                  ...settings,
                  socialMedia: { ...settings.socialMedia, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/yourclub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={settings.socialMedia.youtube}
                onChange={(e) => setSettings({
                  ...settings,
                  socialMedia: { ...settings.socialMedia, youtube: e.target.value }
                })}
                placeholder="https://youtube.com/@yourclub"
              />
            </div>
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
              Save Design Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
