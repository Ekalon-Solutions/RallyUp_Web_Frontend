"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Layout, Users } from "lucide-react"

const navigationOptions = [
  { id: "news", label: "News", description: "Appears just below 'welcome' text near top of site" },
  { id: "events", label: "Events", description: "Recommended. Populate your events for the season" },
  { id: "where-we-meet", label: "Where we meet", description: "Show meeting locations and venues" },
  { id: "about", label: "About", description: "Recommended. Anchors to top of 'About' section" },
  { id: "tickets", label: "Tickets", description: "Show upcoming events and ticket sales" },
  { id: "membership", label: "Membership", description: "Can show invitation to join or full registration form" },
  { id: "leadership", label: "Leadership", description: "Display club leadership and bios" },
  { id: "community", label: "Community", description: "Community features and social content" },
  { id: "store", label: "Store", description: "Recommended if you will have merchandise throughout the season" },
  { id: "gallery", label: "Gallery", description: "Photo gallery from events and activities" },
  { id: "fixtures", label: "Match Fixtures", description: "Upcoming match schedule" },
  { id: "away-days", label: "Away Day Info", description: "Travel and accommodation for away matches" },
  { id: "member-stories", label: "Member Stories", description: "Share stories from club members" },
  { id: "chants", label: "Chants & Songs", description: "Club anthems and supporter chants" },
  { id: "sponsors", label: "Sponsors", description: "Showcase sponsors and partners" },
  { id: "match-day", label: "Match Day Info", description: "Info about upcoming match days" },
]

export default function WebsitePage() {
  const [websiteSettings, setWebsiteSettings] = useState({
    published: false,
    url: "https://group.chant.fan/arsenalmumbai",
    navigation: {
      news: true,
      events: true,
      about: true,
      membership: true,
      store: true,
      gallery: true,
      fixtures: false,
      "away-days": false,
      "member-stories": false,
      chants: false,
      sponsors: false,
      "match-day": false,
    },
    welcomeText: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
    matchUpdates: {
      twitter: "",
    },
  })

  const handleNavigationChange = (item: string, checked: boolean) => {
    setWebsiteSettings((prev) => ({
      ...prev,
      navigation: { ...prev.navigation, [item]: checked },
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Club Website</h1>
            <p className="text-muted-foreground">Configure your hosted website for supporters group</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={websiteSettings.published ? "default" : "secondary"}>
              {websiteSettings.published ? "Published" : "Unpublished"}
            </Badge>
            <Button>Publish Website</Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General Setup
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Directory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Website Info */}
            <Card>
              <CardHeader>
                <CardTitle>Website Information</CardTitle>
                <CardDescription>
                  Wingman Pro offers a hosted, single-page website for your supporters group with news, events, tickets,
                  gallery, store, member registration, leader bios and more. Use of the website solution is ₹499/month
                  (paid annually).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="website-url">Your URL (when published)</Label>
                  <Input id="website-url" value={websiteSettings.url} readOnly className="bg-muted" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="published">Website Published</Label>
                    <p className="text-sm text-muted-foreground">Make your website live and accessible to visitors</p>
                  </div>
                  <Switch
                    id="published"
                    checked={websiteSettings.published}
                    onCheckedChange={(checked) => setWebsiteSettings((prev) => ({ ...prev, published: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>
                  Select up to 8 navigation items. Sections do not need navigation in header for content to appear in
                  the site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {navigationOptions.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={
                            websiteSettings.navigation[option.id as keyof typeof websiteSettings.navigation] || false
                          }
                          onCheckedChange={(checked) => handleNavigationChange(option.id, checked as boolean)}
                        />
                        <Label htmlFor={option.id} className="font-medium">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{option.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Header & Intro */}
            <Card>
              <CardHeader>
                <CardTitle>Header, Intro & Section Breaks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="welcome-text">Welcome Text</Label>
                  <Textarea
                    id="welcome-text"
                    placeholder="Enter welcome message for your website visitors"
                    value={websiteSettings.welcomeText}
                    onChange={(e) => setWebsiteSettings((prev) => ({ ...prev, welcomeText: e.target.value }))}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourpage"
                    value={websiteSettings.socialLinks.facebook}
                    onChange={(e) =>
                      setWebsiteSettings((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, facebook: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/yourhandle"
                    value={websiteSettings.socialLinks.twitter}
                    onChange={(e) =>
                      setWebsiteSettings((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/yourhandle"
                    value={websiteSettings.socialLinks.instagram}
                    onChange={(e) =>
                      setWebsiteSettings((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Match Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Match Updates Integration</CardTitle>
                <CardDescription>Integrate live match updates via Twitter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="twitter-updates">Twitter Handle</Label>
                  <Input
                    id="twitter-updates"
                    placeholder="https://twitter.com/yourhandle"
                    value={websiteSettings.matchUpdates.twitter}
                    onChange={(e) =>
                      setWebsiteSettings((prev) => ({
                        ...prev,
                        matchUpdates: { ...prev.matchUpdates, twitter: e.target.value },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Member Login */}
            <Card>
              <CardHeader>
                <CardTitle>Member Login Area</CardTitle>
                <CardDescription>Enable a member login area for exclusive content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Member login functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections">
            <Card>
              <CardHeader>
                <CardTitle>Website Sections</CardTitle>
                <CardDescription>Configure individual sections of your website</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Section configuration will be available here. Each selected navigation item can be customized with
                  specific content and settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="directory">
            <Card>
              <CardHeader>
                <CardTitle>Directory/Group Listing</CardTitle>
                <CardDescription>Manage your group's directory and member listings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Directory management features will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button size="lg">Save Website Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
