"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { Comment, CommentResponse } from '@/lib/api'
import { NewsComment } from './news-comment'
import { MessageCircle, Send, Loader2 } from 'lucide-react'

interface CommentSectionProps {
  newsId: string
  onCommentUpdate?: (newCommentCount: number) => void
}

export function CommentSection({ newsId, onCommentUpdate }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { user } = useAuth()

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getComments(newsId, page, 20)
      
      if (response.success && response.data) {
        const newComments = response.data.comments || []
        
        if (page === 1) {
          setComments(newComments)
        } else {
          setComments(prev => [...(prev || []), ...newComments])
        }
        setHasMore(page < (response.data.pagination?.pages || 1))
      } else {
        if (page === 1) {
          setComments([])
        }
        toast.error(response.error || "Failed to load comments")
      }
    } catch (error) {
      // console.error('❌ Error loading comments:', error)
      // If there's an error, ensure we have a valid array
      if (page === 1) {
        setComments([])
      }
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }, [newsId, page])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment content cannot be empty")
      return
    }

    setSubmitting(true)
    try {
      // console.log('📝 Submitting comment:', { newsId, content: newComment.trim() })
      const response = await apiClient.createComment({
        newsId,
        content: newComment.trim()
      })
      
      // console.log('✅ Comment creation response:', response)
      
      if (response.success) {
        setNewComment('')
        // console.log('🔄 Reloading comments after successful creation')
        // console.log('📊 Comment creation response data:', response.data)
        
        // Reload comments to show the new one
        setPage(1)
        const loadResponse = await loadComments()
        
        // Update comment count - use the actual new count from the loaded comments
        if (onCommentUpdate) {
          // Get the current comments count after reloading
          const currentComments = await apiClient.getComments(newsId, 1, 20)
          if (currentComments.success && currentComments.data) {
            const newTotal = currentComments.data.comments?.length || 0
            onCommentUpdate(newTotal)
          }
        }
        
        toast.success("Comment posted successfully")
      } else {
        toast.error(response.error || "Failed to post comment")
      }
    } catch (error) {
      // console.error('❌ Error creating comment:', error)
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyTo) return

    setSubmitting(true)
    try {
      const response = await apiClient.createComment({
        newsId,
        content: replyContent.trim(),
        parentCommentId: replyTo
      })
      
      if (response.success) {
        setReplyContent('')
        setReplyTo(null)
        // Reload comments to show the new reply
        setPage(1)
        await loadComments()
        
        // Update comment count - use the actual new count from the loaded comments
        if (onCommentUpdate) {
          // Get the current comments count after reloading
          const currentComments = await apiClient.getComments(newsId, 1, 20)
          if (currentComments.success && currentComments.data) {
            const newTotal = currentComments.data.comments?.length || 0
            onCommentUpdate(newTotal)
          }
        }
        
        toast.success("Reply posted successfully")
      } else {
        toast.error(response.error || "Failed to post reply")
      }
    } catch (error) {
      toast.error("Failed to post reply")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCommentUpdate = (commentId: string, newContent: string) => {
    setComments(prev => {
      if (!prev) return prev;
      const updatedComments = prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
          : comment
      )
      
      // Comment count doesn't change on update, so no need to call onCommentUpdate
      return updatedComments
    })
  }

  const handleCommentDelete = (commentId: string) => {
    setComments(prev => {
      if (!prev) return prev;
      const updatedComments = prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, isDeleted: true, deletedAt: new Date().toISOString() }
          : comment
      )
      
      // Calculate new count safely
      const newCount = updatedComments.filter(c => !c.isDeleted).length
      
      // Update comment count in parent
      if (onCommentUpdate) {
        onCommentUpdate(newCount)
      }
      
      return updatedComments
    })
  }

  const handleReply = (parentCommentId: string) => {
    setReplyTo(parentCommentId)
    setReplyContent('')
  }

  const loadMoreComments = () => {
    setPage(prev => prev + 1)
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Join the conversation</h3>
          <p className="text-muted-foreground">
            Please log in to view and add comments.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Add a Comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {newComment.length}/1000 characters
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {replyTo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Reply to comment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={2}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {replyContent.length}/1000 characters
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Post Reply
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments?.filter(c => !c.isDeleted)?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* console.log('🔍 Rendering comments section. Comments:', comments, 'Length:', comments?.length) */}
              {!comments || comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    // console.log('📝 Rendering comment:', comment)
                    return (
                      <NewsComment
                        key={comment._id}
                        comment={comment}
                        onCommentUpdate={handleCommentUpdate}
                        onCommentDelete={handleCommentDelete}
                        onReply={handleReply}
                      />
                    )
                  })}
                  
                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={loadMoreComments}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Load More Comments'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
