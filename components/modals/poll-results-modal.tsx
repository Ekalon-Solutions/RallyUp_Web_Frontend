"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock,
  Download,
  Share2
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { triggerBlobDownload } from '@/lib/utils'

interface PollResultsModalProps {
  pollId: string
  isOpen: boolean
  onClose: () => void
  refreshTrigger?: number // Add refresh trigger
}

interface PollResult {
  _id: string
  text: string
  votes: number
  percentage: number
  voters: {
    _id: string
    name: string
    email: string
    profile_picture?: string
  }[]
}

interface PollData {
  _id: string
  question: string
  description?: string
  status: string
  totalVotes: number
  totalVoters: number
  allowMultipleVotes: boolean
  allowAnonymousVotes: boolean
  startDate?: string
  endDate?: string
  createdAt: string
}

export function PollResultsModal({ pollId, isOpen, onClose, refreshTrigger }: PollResultsModalProps) {
  const [poll, setPoll] = useState<PollData | null>(null)
  const [results, setResults] = useState<PollResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && pollId) {
      fetchPollResults()
    }
  }, [isOpen, pollId, refreshTrigger])

  const fetchPollResults = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getPollResults(pollId)
      if (response.success && response.data) {
        setPoll(response.data.poll)
        setResults(response.data.results)
      } else {
        throw new Error(response.error || "Failed to load poll results")
      }
    } catch (error: any) {
      console.error("Error fetching poll results:", error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes("Poll not found")) {
        toast.error("Poll not found or has been deleted")
      } else if (error.message?.includes("Access denied")) {
        toast.error("You don't have permission to view these poll results")
      } else if (error.message?.includes("Network")) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error(error.message || "An error occurred while loading poll results")
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.question,
          text: `Check out this poll: ${poll?.question}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  const handleExport = () => {
    if (!poll || !results.length) return

    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...results.map(result => [
        result.text,
        result.votes.toString(),
        `${result.percentage}%`
      ])
    ].map(row => row.join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const filename = `poll-results-${poll._id}.csv`
  triggerBlobDownload(blob, filename)
    
    toast.success("Results exported successfully")
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading poll results...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!poll) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load poll results</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold mb-2">
                Poll Results
              </DialogTitle>
              <h3 className="text-lg font-medium mb-2">
                {poll.question}
              </h3>
              {poll.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {poll.description}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(poll.status)}>
              {poll.status}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{poll.totalVoters} voters</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{poll.totalVotes} votes</span>
            </div>
            {poll.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Started {formatDate(poll.startDate)}</span>
              </div>
            )}
            {poll.endDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Ended {formatDate(poll.endDate)}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Results</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No votes have been cast yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results
                  .sort((a, b) => b.votes - a.votes)
                  .map((result, index) => (
                    <div key={result._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="font-medium">
                            {result.text}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {result.votes} vote{result.votes !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={result.percentage} className="h-3" />
                      
                      {/* Show voter details if not anonymous */}
                      {!poll.allowAnonymousVotes && result.voters.length > 0 && (
                        <div className="mt-2 pl-6 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Voted by:
                          </p>
                          <div className="space-y-1">
                            {result.voters.map((voter) => (
                              <div key={voter._id} className="flex items-center gap-2 text-sm">
                                {voter.profile_picture ? (
                                  <img 
                                    src={voter.profile_picture} 
                                    alt={voter.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                    {voter.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-muted-foreground">{voter.name}</span>
                                <span className="text-xs text-muted-foreground">({voter.email})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Poll Settings Info */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Poll Settings</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Multiple Votes:</span>
                <span className="ml-2 font-medium">
                  {poll.allowMultipleVotes ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Anonymous:</span>
                <span className="ml-2 font-medium">
                  {poll.allowAnonymousVotes ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
