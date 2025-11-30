"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface CreateTopicModalProps {
  trigger?: React.ReactNode
}

export function CreateTopicModal({ trigger }: CreateTopicModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
    tags: "",
    pinTopic: false,
    lockTopic: false,
    membersOnly: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // console.log("Creating topic:", formData)
    setOpen(false)
    // Reset form
    setFormData({
      title: "",
      category: "",
      content: "",
      tags: "",
      pinTopic: false,
      lockTopic: false,
      membersOnly: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Topic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Topic</DialogTitle>
          <DialogDescription>Start a new discussion topic in the forum</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Topic Title *</Label>
            <Input
              id="title"
              placeholder="Enter topic title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match-discussion">Match Discussion</SelectItem>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="general">General Discussion</SelectItem>
                <SelectItem value="announcements">Announcements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your topic content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pinTopic">Pin Topic</Label>
                <p className="text-sm text-muted-foreground">Keep this topic at the top</p>
              </div>
              <Switch
                id="pinTopic"
                checked={formData.pinTopic}
                onCheckedChange={(checked) => setFormData({ ...formData, pinTopic: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lockTopic">Lock Topic</Label>
                <p className="text-sm text-muted-foreground">Prevent replies to this topic</p>
              </div>
              <Switch
                id="lockTopic"
                checked={formData.lockTopic}
                onCheckedChange={(checked) => setFormData({ ...formData, lockTopic: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="membersOnly">Members Only</Label>
                <p className="text-sm text-muted-foreground">Only club members can view</p>
              </div>
              <Switch
                id="membersOnly"
                checked={formData.membersOnly}
                onCheckedChange={(checked) => setFormData({ ...formData, membersOnly: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Topic</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
