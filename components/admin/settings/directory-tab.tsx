"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, List, Plus, X, Users } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface GroupListing {
  groupName: string
  description: string
  contactInfo: string
  members: string[]
  isVisible: boolean
}

export function DirectoryTab() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [listings, setListings] = useState<GroupListing[]>([])
  const [newListing, setNewListing] = useState<GroupListing>({
    groupName: "",
    description: "",
    contactInfo: "",
    members: [],
    isVisible: true
  })

  const handleAddListing = () => {
    if (!newListing.groupName.trim()) {
      toast.error("Please enter a group name")
      return
    }

    setListings([...listings, { ...newListing }])
    setNewListing({
      groupName: "",
      description: "",
      contactInfo: "",
      members: [],
      isVisible: true
    })
    toast.success("Group listing added")
  }

  const handleRemoveListing = (index: number) => {
    setListings(listings.filter((_, i) => i !== index))
    toast.success("Group listing removed")
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Implement API call
      // const response = await apiClient.updateGroupListings(listings)
      toast.success("Directory settings saved successfully!")
    } catch (error) {
      console.error("Error saving directory:", error)
      toast.error("Failed to save directory settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Group Directory
          </CardTitle>
          <CardDescription>
            Manage your club's directory listings so members can discover different groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {listings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No group listings yet. Add your first group below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{listing.groupName}</CardTitle>
                        <CardDescription className="mt-1">{listing.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveListing(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {listing.contactInfo && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Contact:</strong> {listing.contactInfo}
                      </p>
                    )}
                    {listing.members.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {listing.members.length} member{listing.members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <Badge variant={listing.isVisible ? "default" : "secondary"}>
                      {listing.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Listing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Group Listing
          </CardTitle>
          <CardDescription>
            Create a new group listing for your directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name *</Label>
            <Input
              id="groupName"
              value={newListing.groupName}
              onChange={(e) => setNewListing({ ...newListing, groupName: e.target.value })}
              placeholder="e.g., Youth Committee, Social Events Team"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newListing.description}
              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
              placeholder="Describe what this group does..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              value={newListing.contactInfo}
              onChange={(e) => setNewListing({ ...newListing, contactInfo: e.target.value })}
              placeholder="Email, phone, or social media handle"
            />
          </div>

          <Button onClick={handleAddListing} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Group Listing
          </Button>
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
              Save Directory
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
