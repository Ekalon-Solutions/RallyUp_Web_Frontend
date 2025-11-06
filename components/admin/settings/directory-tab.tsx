"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Users, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

interface ClubInfo {
  name: string
  description: string
  contactInfo: string
  members: string[]
}

export function DirectoryTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    name: "",
    description: "",
    contactInfo: "",
    members: []
  })
  const [newMemberEmail, setNewMemberEmail] = useState("")

  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id

  useEffect(() => {
    if (clubId) {
      loadClubInfo()
    }
  }, [clubId])

  const loadClubInfo = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      
      console.log('📡 Load response:', response)
      
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const groupListings = actualData.groupListings || []
        
        console.log('📋 Group listings:', groupListings)
        
        // Load the first (and only) group listing which represents the admin's club
        if (groupListings.length > 0) {
          const listing = groupListings[0]
          setClubInfo({
            name: listing.name || "",
            description: listing.description || "",
            contactInfo: listing.contactInfo || "",
            members: listing.members || []
          })
        }
      }
    } catch (error) {
      console.error("Error loading club info:", error)
      toast.error("Failed to load club information")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast.error("Please enter a member email")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if member already exists
    if (clubInfo.members.includes(newMemberEmail)) {
      toast.error("This member is already in the list")
      return
    }

    setClubInfo({
      ...clubInfo,
      members: [...clubInfo.members, newMemberEmail]
    })
    setNewMemberEmail("")
    toast.success("Member added")
  }

  const handleRemoveMember = (email: string) => {
    setClubInfo({
      ...clubInfo,
      members: clubInfo.members.filter(m => m !== email)
    })
    toast.success("Member removed")
  }

  const handleSave = async () => {
    if (!clubId) {
      toast.error("Club ID not found")
      return
    }

    if (!clubInfo.name.trim()) {
      toast.error("Please enter a club name")
      return
    }

    try {
      setSaving(true)
      
      // 1. Update ClubSettings (for directory listing)
      const listings = [{
        name: clubInfo.name,
        description: clubInfo.description,
        contactInfo: clubInfo.contactInfo,
        members: clubInfo.members,
        memberCount: clubInfo.members.length,
        isVisible: true
      }]
      
      console.log('💾 Saving club settings:', listings)
      const settingsResponse = await apiClient.updateGroupListings(clubId, listings)
      console.log('📥 Settings response:', settingsResponse)
      
      // 2. Update the actual Club model (so name appears everywhere)
      console.log('💾 Updating club basic info:', { name: clubInfo.name, description: clubInfo.description })
      const clubResponse = await apiClient.updateClubBasicInfo(clubId, {
        name: clubInfo.name,
        description: clubInfo.description,
        contactInfo: clubInfo.contactInfo
      })
      console.log('📥 Club response:', clubResponse)
      
      if (settingsResponse.success && clubResponse.success) {
        toast.success("Club information saved successfully!")
        // Reload to show updated data
        await loadClubInfo()
        // Refresh the page to show updated club name everywhere
        window.location.reload()
      } else {
        toast.error("Failed to save some information")
      }
    } catch (error) {
      console.error("Error saving club info:", error)
      toast.error("Failed to save club information")
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
      {/* Club Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Information
          </CardTitle>
          <CardDescription>
            Update your club's information and manage members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clubName">Club Name</Label>
            <Input
              id="clubName"
              value={clubInfo.name}
              onChange={(e) => setClubInfo({ ...clubInfo, name: e.target.value })}
              placeholder="Enter your club name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={clubInfo.description}
              onChange={(e) => setClubInfo({ ...clubInfo, description: e.target.value })}
              placeholder="Brief description of your club"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              value={clubInfo.contactInfo}
              onChange={(e) => setClubInfo({ ...clubInfo, contactInfo: e.target.value })}
              placeholder="Email or phone number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Members
          </CardTitle>
          <CardDescription>
            Add or remove members from your club directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Members */}
          {clubInfo.members.length > 0 && (
            <div className="space-y-2">
              <Label>Current Members ({clubInfo.members.length})</Label>
              <div className="flex flex-wrap gap-2">
                {clubInfo.members.map((email, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                    {email}
                    <button
                      onClick={() => handleRemoveMember(email)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add New Member */}
          <div className="space-y-2">
            <Label htmlFor="newMember">Add New Member</Label>
            <div className="flex gap-2">
              <Input
                id="newMember"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter member email"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMember()
                  }
                }}
              />
              <Button onClick={handleAddMember} type="button">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {clubInfo.members.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No members added yet. Add members using their email address.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !clubId} size="lg" type="button">
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
