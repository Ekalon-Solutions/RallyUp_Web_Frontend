"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { 
  Globe, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  Newspaper, 
  Vote, 
  Music, 
  Store,
  ExternalLink,
  Building2
} from "lucide-react"
import Link from "next/link"

interface ClubSettings {
  websiteSetup: {
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
  designSettings: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    logo: string | null
    motto: string
  }
}

interface Club {
  _id: string
  name: string
  description?: string
  logo?: string
  status: string
}

export default function PublicClubPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)

  useEffect(() => {
    if (slug) {
      loadClubData()
    }
  }, [slug])

  const loadClubData = async () => {
    try {
      setLoading(true)
      
      // Load club basic info (public access) - now using slug
      const clubResponse = await apiClient.getClubById(slug, true)
      if (clubResponse.success && clubResponse.data) {
        setClub(clubResponse.data)
      }

      // Load club settings (public access) - now using slug
      const settingsResponse = await apiClient.getClubSettings(slug, true)
      if (settingsResponse.success && settingsResponse.data) {
        const actualData = settingsResponse.data.data || settingsResponse.data
        setSettings(actualData)
      }
    } catch (error) {
      // console.error("Error loading club data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!club || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Club Not Found</CardTitle>
            <CardDescription>
              The club you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { websiteSetup, designSettings } = settings
  const title = websiteSetup.title || club.name
  const description = websiteSetup.description || club.description

  // Apply custom colors if set
  const primaryColor = designSettings.primaryColor || "#3b82f6"
  const secondaryColor = designSettings.secondaryColor || "#8b5cf6"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        />
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Logo */}
            {(designSettings.logo || club.logo) && (
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={designSettings.logo || club.logo} 
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Club Name */}
            <h1 
              className="text-5xl font-bold tracking-tight"
              style={{ color: primaryColor }}
            >
              {title}
            </h1>

            {/* Motto */}
            {designSettings.motto && (
              <p className="text-xl italic text-muted-foreground">
                "{designSettings.motto}"
              </p>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}

            {/* CTA Button */}
            <div className="pt-4">
              <Link href={`/clubs/?search=${club?.name}`}>
                <Button 
                  size="lg" 
                  className="px-8"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Join Our Club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {(websiteSetup.contactEmail || websiteSetup.contactPhone) && (
        <div className="bg-card border-y">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-8">
                {websiteSetup.contactEmail && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <a 
                      href={`mailto:${websiteSetup.contactEmail}`}
                      className="hover:text-primary transition-colors"
                    >
                      {websiteSetup.contactEmail}
                    </a>
                  </div>
                )}
                {websiteSetup.contactPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-5 w-5" />
                    <a 
                      href={`tel:${websiteSetup.contactPhone}`}
                      className="hover:text-primary transition-colors"
                    >
                      {websiteSetup.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Sections */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">What We Offer</h2>
            <p className="text-muted-foreground">
              Explore the different sections and activities available to our members
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* News Section */}
            {websiteSetup.sections.news && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" style={{ color: primaryColor }} />
                    News & Updates
                  </CardTitle>
                  <CardDescription>
                    Stay updated with the latest news, announcements, and articles from our club
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Events Section */}
            {websiteSetup.sections.events && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                    Events & Activities
                  </CardTitle>
                  <CardDescription>
                    Join exciting events, workshops, and activities organized by our club
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Store/Merchandise Section */}
            {(websiteSetup.sections.store || websiteSetup.sections.merchandise) && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" style={{ color: primaryColor }} />
                    Merchandise Store
                  </CardTitle>
                  <CardDescription>
                    Browse and purchase official club merchandise and products
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Polls Section */}
            {websiteSetup.sections.polls && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" style={{ color: primaryColor }} />
                    Polls & Voting
                  </CardTitle>
                  <CardDescription>
                    Participate in club decisions and share your opinions through polls
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Chants Section */}
            {websiteSetup.sections.chants && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" style={{ color: primaryColor }} />
                    Our Chants
                  </CardTitle>
                  <CardDescription>
                    Learn and practice our club's signature chants and songs
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Members Section */}
            {websiteSetup.sections.members && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: primaryColor }} />
                    Member Directory
                  </CardTitle>
                  <CardDescription>
                    Connect with fellow members and build our community together
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-card border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold">Ready to Join?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Become a member and get access to all our exclusive content, events, and community features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/auth/register?club=${club?._id || slug}`}>
                <Button 
                  size="lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Become a Member
                </Button>
              </Link>
              <Link href={`/auth/login`}>
                <Button size="lg" variant="outline">
                  Already a Member? Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {title}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
