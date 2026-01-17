"use client"

import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient, News } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface CreateNewsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editNews?: News | null
}

export function CreateNewsModal({ isOpen, onClose, onSuccess, editNews }: CreateNewsModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(editNews?.title || "")
  const [content, setContent] = useState(editNews?.content || "")
  const [summary, setSummary] = useState(editNews?.summary || "")
  const [tags, setTags] = useState<string[]>(editNews?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [category, setCategory] = useState(editNews?.category || "general")
  const [priority, setPriority] = useState(editNews?.priority || "medium")
  const [isPublished, setIsPublished] = useState(editNews?.isPublished || false)
  const [images, setImages] = useState<File[]>([])
  const [featuredImage, setFeaturedImage] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("content", content)
      formData.append("summary", summary)
      formData.append("tags", tags.join(","))
      formData.append("category", category)
      formData.append("priority", priority)
      formData.append("isPublished", isPublished.toString())
      
      images.forEach((image, index) => {
        formData.append("images", image)
      })
      
      if (images.length > 0) {
        formData.append("featuredImageIndex", featuredImage.toString())
      }

      let response
      if (editNews) {
        response = await apiClient.updateNews(editNews._id, formData)
      } else {
        response = await apiClient.createNews(formData)
      }

      if (response.success) {
        toast.success(response.message || "News article saved successfully")
        onSuccess()
        onClose()
        resetForm()
      } else {
        toast.error(response.error || "Failed to save news article")
      }
    } catch (error) {
      // console.error("Error saving news:", error)
      toast.error("An error occurred while saving the news article")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setContent("")
    setSummary("")
    setTags([])
    setCategory("general")
    setPriority("medium")
    setIsPublished(false)
    setImages([])
    setFeaturedImage(0)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith("image/"))
    
    if (imageFiles.length === 0) {
      toast.error("Please select only image files")
      return
    }

    setImages(prev => [...prev, ...imageFiles])
    
    if (images.length === 0 && imageFiles.length > 0) {
      setFeaturedImage(0)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    
    if (featuredImage === index) {
      setFeaturedImage(0)
    } else if (featuredImage > index) {
      setFeaturedImage(featuredImage - 1)
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editNews ? "Edit News Article" : "Create News Article"}
          </DialogTitle>
          {user && (
            <div className="text-sm text-muted-foreground">
              Author: {user.name} ({user.role === 'admin' || user.role === 'super_admin' ? 'Admin' : 'User'})
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter news title"
              required
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of the news article"
              rows={3}
              maxLength={500}
            />
            <div className="text-sm text-muted-foreground">
              {summary.length}/500 characters
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your news content here..."
              rows={8}
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
              <p className="text-sm text-muted-foreground">
                Upload up to 10 images (JPG, PNG, GIF). Max 5MB each.
              </p>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="space-y-4">
                <Label>Uploaded Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <input
                          type="radio"
                          name="featuredImage"
                          value={index}
                          checked={featuredImage === index}
                          onChange={() => setFeaturedImage(index)}
                          className="mr-2"
                        />
                        <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                          Featured
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPublished">Publish immediately</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editNews ? "Update News" : "Create News"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
