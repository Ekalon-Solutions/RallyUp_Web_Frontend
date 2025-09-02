"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Circle,
  Eye,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { PollResultsModal } from "./modals/poll-results-modal"

interface PollCardProps {
  poll: Poll
  onVote?: (updatedPoll?: Poll) => void
  showResults?: boolean
}

export function PollCard({ poll, onVote, showResults = false }: PollCardProps) {
  const { user } = useAuth()
  const [isVoting, setIsVoting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVotes || [])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [resultsRefreshTrigger, setResultsRefreshTrigger] = useState(0)

  const isPollActive = poll.status === 'active'
  const hasUserVoted = poll.userVotes && poll.userVotes.length > 0
  const canVote = isPollActive && user && !hasUserVoted
  const canChangeVote = isPollActive && user && hasUserVoted

  // Sync selectedOptions with poll.userVotes when poll data changes
  useEffect(() => {
    if (poll.userVotes) {
      setSelectedOptions(poll.userVotes)
    } else {
      setSelectedOptions([])
    }
  }, [poll.userVotes])

  const handleOptionSelect = (optionId: string) => {
    if (!isPollActive || !user) return

    if (poll.allowMultipleVotes) {
      // Toggle option in multiple selection
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      // Single selection - allow deselection if clicking on already selected option
      const isCurrentlySelected = selectedOptions.includes(optionId)
      if (isCurrentlySelected) {
        // Deselect the option
        setSelectedOptions([])
      } else {
        // Select the option
        setSelectedOptions([optionId])
      }
    }
  }

  const handleVote = async () => {
    if (!user) return

    setIsVoting(true)
    try {
      // WhatsApp-style voting: handle both new votes and vote removals
      if (hasUserVoted && poll.userVotes) {
        let updatedPoll: Poll | undefined;
        
        // Remove votes for options that user previously voted for but now unselected
        for (const oldVote of poll.userVotes) {
          if (!selectedOptions.includes(oldVote)) {
            const response = await apiClient.removeVoteFromPoll(poll._id, oldVote)
            if (!response.success) {
              throw new Error(response.error || "Failed to remove vote")
            }
            if (response.data?.poll) {
              updatedPoll = response.data.poll;
            }
          }
        }
        
        // Add votes for newly selected options
        for (const optionId of selectedOptions) {
          if (!poll.userVotes.includes(optionId)) {
            const response = await apiClient.voteOnPoll(poll._id, optionId)
            if (!response.success) {
              throw new Error(response.error || "Failed to add vote")
            }
            if (response.data?.poll) {
              updatedPoll = response.data.poll;
            }
          }
        }
        
        // Determine success message based on actions taken
        const removedVotes = poll.userVotes?.filter(vote => !selectedOptions.includes(vote)).length || 0
        const addedVotes = selectedOptions.filter(option => !poll.userVotes?.includes(option)).length
        
        if (removedVotes > 0 && addedVotes > 0) {
          toast.success("Votes updated successfully!")
        } else if (removedVotes > 0) {
          toast.success("Vote removed successfully!")
        } else if (addedVotes > 0) {
          toast.success("Vote added successfully!")
        } else {
          toast.info("No changes made to your vote")
          return
        }
        
        onVote?.(updatedPoll)
        // Trigger results modal refresh
        setResultsRefreshTrigger(prev => prev + 1)
      } else {
        // First time voting - add all selected votes
        if (selectedOptions.length === 0) {
          toast.info("Please select at least one option to vote")
          return
        }
        
        let updatedPoll: Poll | undefined;
        for (const optionId of selectedOptions) {
          const response = await apiClient.voteOnPoll(poll._id, optionId)
          if (!response.success) {
            throw new Error(response.error || "Failed to cast vote")
          }
          if (response.data?.poll) {
            updatedPoll = response.data.poll;
          }
        }
        toast.success("Vote cast successfully!")
        
        onVote?.(updatedPoll)
        // Trigger results modal refresh
        setResultsRefreshTrigger(prev => prev + 1)
      }
    } catch (error: any) {
      console.error("Error voting:", error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes("already voted for this option")) {
        toast.error("You have already voted for this option")
      } else if (error.message?.includes("already voted in this poll")) {
        toast.error("You have already voted in this poll. Please change your selection.")
      } else if (error.message?.includes("Poll is not active")) {
        toast.error("This poll is no longer active")
      } else if (error.message?.includes("Poll has ended")) {
        toast.error("This poll has ended")
      } else if (error.message?.includes("Poll has not started yet")) {
        toast.error("This poll has not started yet")
      } else if (error.message?.includes("Access denied")) {
        toast.error("You don't have permission to vote in this poll")
      } else if (error.message?.includes("Option not found")) {
        toast.error("The selected option is no longer available")
      } else {
        toast.error(error.message || "Failed to cast vote. Please try again.")
      }
    } finally {
      setIsVoting(false)
    }
  }

  const handleRemoveVote = async (optionId: string) => {
    if (!user) return

    setIsVoting(true)
    try {
      const response = await apiClient.removeVoteFromPoll(poll._id, optionId)
      if (response.success) {
        toast.success("Vote removed successfully!")
        onVote?.()
        // Trigger results modal refresh
        setResultsRefreshTrigger(prev => prev + 1)
      } else {
        throw new Error(response.error || "Failed to remove vote")
      }
    } catch (error: any) {
      console.error("Error removing vote:", error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes("User has not voted for this option")) {
        toast.error("You haven't voted for this option")
      } else if (error.message?.includes("Poll is not active")) {
        toast.error("This poll is no longer active")
      } else if (error.message?.includes("Poll has ended")) {
        toast.error("This poll has ended")
      } else if (error.message?.includes("Access denied")) {
        toast.error("You don't have permission to modify votes in this poll")
      } else if (error.message?.includes("Option not found")) {
        toast.error("The selected option is no longer available")
      } else {
        toast.error(error.message || "Failed to remove vote. Please try again.")
      }
    } finally {
      setIsVoting(false)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-2">
                {poll.question}
              </CardTitle>
              {poll.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {poll.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Badge className={getStatusColor(poll.status)}>
                {poll.status}
              </Badge>
              <Badge className={getPriorityColor(poll.priority)}>
                {poll.priority}
              </Badge>
            </div>
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
                <span>Starts {formatDate(poll.startDate)}</span>
              </div>
            )}
            {poll.endDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Ends {formatDate(poll.endDate)}</span>
              </div>
            )}
          </div>

          {poll.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {poll.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {showResults ? (
            // Show results view
            <div className="space-y-4">
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0
                const isUserVote = poll.userVotes?.includes(option._id)
                
                return (
                  <div key={option._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {option.text}
                        {isUserVote && (
                          <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {option.votes} votes ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          ) : (
            // Show voting interface
            <div className="space-y-4">
                             {(canVote || canChangeVote) && (
                 <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                   {hasUserVoted 
                     ? "Click on your votes to remove them, or select new options to add votes. Submit to save changes."
                     : poll.allowMultipleVotes 
                     ? "Select one or more options. Click again to deselect."
                     : "Select an option. Click again to deselect."
                   }
                 </div>
               )}
              {poll.options.map((option) => {
                const isSelected = selectedOptions.includes(option._id)
                const isUserVote = poll.userVotes?.includes(option._id)
                const isCurrentlyVoted = isUserVote && !isSelected // User voted but now unselected
                
                return (
                  <div key={option._id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOptionSelect(option._id)}
                        disabled={!canVote && !canChangeVote}
                        className={`flex items-center gap-2 p-3 rounded-lg border w-full text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : isUserVote
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-border hover:border-primary/50'
                        } ${!canVote && !canChangeVote ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50 hover:shadow-sm'}`}
                        title={
                          isSelected ? "Click to deselect" : 
                          isUserVote ? "Click to remove your vote" : 
                          "Click to select"
                        }
                      >
                        {poll.allowMultipleVotes ? (
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'border-primary bg-primary scale-110' 
                              : isUserVote 
                              ? 'border-green-500 bg-green-500 scale-110' 
                              : 'border-muted-foreground hover:border-primary/70'
                          }`}>
                            {(isSelected || isUserVote) && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'border-primary scale-110' 
                              : isUserVote 
                              ? 'border-green-500 scale-110' 
                              : 'border-muted-foreground hover:border-primary/70'
                          }`}>
                            {isSelected && <Circle className="w-2 h-2 bg-primary rounded-full" />}
                            {isUserVote && !isSelected && <Circle className="w-2 h-2 bg-green-500 rounded-full" />}
                          </div>
                        )}
                        <span className="flex-1">{option.text}</span>
                        {isUserVote && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">You voted</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}

              {(canVote || canChangeVote) && (
                <div className="space-y-2">
                  {selectedOptions.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOptions([])}
                      className="w-full"
                    >
                      Clear Selection
                    </Button>
                  )}
                                     <Button
                     onClick={handleVote}
                     disabled={isVoting}
                     className="w-full"
                   >
                     {isVoting ? "Processing..." : 
                       hasUserVoted 
                         ? (() => {
                             const removedVotes = poll.userVotes?.filter(vote => !selectedOptions.includes(vote)).length || 0
                             const addedVotes = selectedOptions.filter(option => !poll.userVotes?.includes(option)).length
                             
                             if (removedVotes > 0 && addedVotes > 0) {
                               return "Update Votes"
                             } else if (removedVotes > 0) {
                               return `Remove ${removedVotes} Vote${removedVotes > 1 ? 's' : ''}`
                             } else if (addedVotes > 0) {
                               return `Add ${addedVotes} Vote${addedVotes > 1 ? 's' : ''}`
                             } else {
                               return "No Changes"
                             }
                           })()
                         : selectedOptions.length === 0 
                         ? "Select Options to Vote"
                         : `Vote for ${selectedOptions.length} Option${selectedOptions.length > 1 ? 's' : ''}`
                     }
                   </Button>
                </div>
              )}

              {hasUserVoted && !canChangeVote && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    You have voted in this poll
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResultsModal(true)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                </div>
              )}

              {!isPollActive && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    This poll is {poll.status}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResultsModal(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showResultsModal && (
        <PollResultsModal
          pollId={poll._id}
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          refreshTrigger={resultsRefreshTrigger}
        />
      )}
    </>
  )
}
