"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Trash2, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editPoll?: Poll | null
}

export function CreatePollModal({ isOpen, onClose, onSuccess, editPoll }: CreatePollModalProps) {
  const { user } = useAuth()
  const [question, setQuestion] = useState(editPoll?.question || "")
  const [description, setDescription] = useState(editPoll?.description || "")
  const [options, setOptions] = useState<string[]>(
    editPoll?.options.map(opt => opt.text) || ["", ""]
  )
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(editPoll?.allowMultipleVotes || false)
  const [allowAnonymousVotes, setAllowAnonymousVotes] = useState(editPoll?.allowAnonymousVotes || false)
  const [startDate, setStartDate] = useState(
    editPoll?.startDate ? new Date(editPoll.startDate).toISOString().slice(0, 16) : ""
  )
  const [endDate, setEndDate] = useState(
    editPoll?.endDate ? new Date(editPoll.endDate).toISOString().slice(0, 16) : ""
  )
  const [isPublic, setIsPublic] = useState(editPoll?.isPublic !== undefined ? editPoll.isPublic : true)
  const [tags, setTags] = useState<string[]>(editPoll?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [category, setCategory] = useState(editPoll?.category || "general")
  const [priority, setPriority] = useState(editPoll?.priority || "medium")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      toast.error("Poll question is required")
      return
    }

    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      toast.error("Poll must have at least 2 options")
      return
    }

    if (validOptions.length > 10) {
      toast.error("Poll cannot have more than 10 options")
      return
    }

    setLoading(true)

    try {
      const data = {
        question: question.trim(),
        description: description.trim() || undefined,
        options: validOptions,
        allowMultipleVotes,
        allowAnonymousVotes,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isPublic,
        tags: tags.join(","),
        category,
        priority
      }

      let response
      if (editPoll) {
        response = await apiClient.updatePoll(editPoll._id, data)
      } else {
        response = await apiClient.createPoll(data)
      }

      if (response.success) {
        toast.success(response.message || "Poll saved successfully")
        onSuccess()
        onClose()
        resetForm()
      } else {
        throw new Error(response.error || "Failed to save poll")
      }
    } catch (error: any) {
      // console.error("Error saving poll:", error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes("Access denied") || error.message?.includes("Unauthorized")) {
        toast.error("You don't have permission to create or edit polls")
      } else if (error.message?.includes("Club")) {
        toast.error("You must be associated with a club to create polls")
      } else if (error.message?.includes("Network")) {
        toast.error("Network error. Please check your connection and try again.")
      } else if (error.message?.includes("validation") || error.message?.includes("required")) {
        toast.error("Please check your poll details and try again")
      } else if (error.message?.includes("options")) {
        toast.error("Poll must have between 2 and 10 options")
      } else {
        toast.error(error.message || "An error occurred while saving the poll")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setQuestion("")
    setDescription("")
    setOptions(["", ""])
    setAllowMultipleVotes(false)
    setAllowAnonymousVotes(false)
    setStartDate("")
    setEndDate("")
    setIsPublic(true)
    setTags([])
    setCategory("general")
    setPriority("medium")
  }

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const isPollActive = editPoll?.status === 'active'
  const canEditOptions = !editPoll || editPoll.totalVotes === 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editPoll ? "Edit Poll" : "Create Poll"}
          </DialogTitle>
          {user && (
            <div className="text-sm text-muted-foreground">
              Creator: {user.name} ({user.role === 'admin' || user.role === 'super_admin' ? 'Admin' : 'User'})
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Poll Question *</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or context for the poll"
              rows={3}
              maxLength={1000}
            />
            <div className="text-sm text-muted-foreground">
              {description.length}/1000 characters
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Poll Options *</Label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={!canEditOptions}
                    className="flex-1"
                  />
                  {canEditOptions && options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {canEditOptions && options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
            {!canEditOptions && (
              <p className="text-sm text-muted-foreground">
                Cannot modify options after votes have been cast
              </p>
            )}
            <div className="text-sm text-muted-foreground">
              {options.filter(opt => opt.trim()).length}/10 options
            </div>
          </div>

          {/* Poll Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowMultipleVotes">Allow Multiple Votes</Label>
                <Switch
                  id="allowMultipleVotes"
                  checked={allowMultipleVotes}
                  onCheckedChange={setAllowMultipleVotes}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowAnonymousVotes">Anonymous Votes</Label>
                <Switch
                  id="allowAnonymousVotes"
                  checked={allowAnonymousVotes}
                  onCheckedChange={setAllowAnonymousVotes}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic">Public Poll</Label>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editPoll ? "Update Poll" : "Create Poll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
