"use client"

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { Comment as CommentType } from '@/lib/api'
import { formatLocalDate } from '@/lib/timezone'
import { 
  Heart, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Reply,
  MoreVertical,
  Check,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CommentProps {
  comment: CommentType
  onCommentUpdate: (commentId: string, newContent: string) => void
  onCommentDelete: (commentId: string) => void
  onReply: (parentCommentId: string) => void
  level?: number
}

export function NewsComment({ 
  comment, 
  onCommentUpdate, 
  onCommentDelete, 
  onReply,
  level = 0 
}: CommentProps) {
  // Safety check for comment object
  if (!comment || !comment._id) {
    return null;
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content || '')
  const [isLiked, setIsLiked] = useState((comment.likes?.length || 0) > 0)
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const isOwner = user?._id === (typeof comment.author === 'string' ? comment.author : comment.author._id)
  const canEdit = isOwner && !comment.isDeleted
  const canDelete = isOwner || user?.role === 'admin' || user?.role === 'super_admin'

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment content cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.updateComment(comment._id, editContent.trim())
      
      if (response.success) {
        onCommentUpdate(comment._id, editContent.trim())
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Comment updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.deleteComment(comment._id)
      
      if (response.success) {
        onCommentDelete(comment._id)
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await apiClient.toggleCommentLike(comment._id)
      
      if (response.success) {
        setIsLiked(response.data.isLiked)
        setLikeCount(response.data.likeCount)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      })
    }
  }

  const handleReply = () => {
    onReply(comment._id)
  }

  if (comment.isDeleted) {
    return (
      <Card className={`mb-4 ${level > 0 ? 'ml-8' : ''}`}>
        <CardContent className="p-4">
          <p className="text-muted-foreground italic">Comment deleted</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`mb-4 ${level > 0 ? 'ml-8' : ''}`}>
      <CardContent className="p-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                {(comment.authorName || 'User').split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.authorName || 'Anonymous User'}</span>
                {comment.authorModel === 'Admin' && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">Edited</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt ? formatLocalDate(comment.createdAt, 'date-short') : 'Unknown date'}
              </span>
            </div>
          </div>

          {/* Action Menu */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-3">{comment.content || 'No content'}</p>
        )}

        {/* Comment Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReply}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Reply
          </Button>
        </div>

        {/* Replies */}
        {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => (
              <NewsComment
                key={reply._id}
                comment={reply}
                onCommentUpdate={onCommentUpdate}
                onCommentDelete={onCommentDelete}
                onReply={onReply}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
