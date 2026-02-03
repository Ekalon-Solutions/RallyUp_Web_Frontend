"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  Play,
  Pause,
  Archive
} from "lucide-react"
import { toast } from "sonner"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"
import { CreatePollModal } from "@/components/modals/create-poll-modal"
import { PollResultsModal } from "@/components/modals/poll-results-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function PollsManagementPage() {
  const { user } = useAuth()
  const clubId = useSelectedClubId()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null)
  const [selectedPollForResults, setSelectedPollForResults] = useState<string | null>(null)

  useEffect(() => {
    fetchPolls()
  }, [clubId])

  const fetchPolls = async () => {
    setLoading(true)
    try {
      if (!clubId) {
        setPolls([])
        setLoading(false)
        return
      }

      const response = await apiClient.getPolls({
        clubId,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        category: categoryFilter !== "all" ? categoryFilter as any : undefined,
        page: 1,
        limit: 200
      })
      
      if (response.success && response.data) {
        setPolls(response.data.polls)
      } else {
        throw new Error(response.error || "Failed to load polls")
      }
    } catch (error: any) {
      if (error.message?.includes("Access denied") || error.message?.includes("Unauthorized")) {
        toast.error("You don't have permission to view polls")
      } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.")
      } else if (error.message?.includes("Club")) {
        toast.error("You must be associated with a club to view polls")
      } else {
        toast.error(error.message || "An error occurred while loading polls")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPolls()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, statusFilter, categoryFilter])

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return
    }

    try {
      const response = await apiClient.deletePoll(pollId)
      if (response.success) {
        toast.success("Poll deleted successfully")
        fetchPolls()
      } else {
        throw new Error(response.error || "Failed to delete poll")
      }
    } catch (error: any) {
      if (error.message?.includes("Poll not found")) {
        toast.error("Poll not found or has already been deleted")
      } else if (error.message?.includes("Access denied")) {
        toast.error("You don't have permission to delete this poll")
      } else if (error.message?.includes("Network")) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error(error.message || "An error occurred while deleting the poll")
      }
    }
  }

  const handleUpdatePollStatus = async (pollId: string, status: 'draft' | 'active' | 'closed' | 'archived') => {
    try {
      const response = await apiClient.updatePollStatus(pollId, status)
      if (response.success) {
        toast.success(`Poll ${status} successfully`)
        fetchPolls()
      } else {
        throw new Error(response.error || `Failed to ${status} poll`)
      }
    } catch (error: any) {
      if (error.message?.includes("Poll not found")) {
        toast.error("Poll not found or has been deleted")
      } else if (error.message?.includes("Access denied")) {
        toast.error("You don't have permission to update this poll")
      } else if (error.message?.includes("Network")) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error(error.message || `An error occurred while updating the poll status`)
      }
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || poll.status === statusFilter
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading polls...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Polls Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Create and manage polls for your club members</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Poll
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="decision">Decision</SelectItem>
            <SelectItem value="survey">Survey</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No polls found</h3>
            <p>Create your first poll to start gathering member feedback</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Poll
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPolls.map((poll) => (
            <Card key={poll._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 break-words">
                      {poll.question}
                    </CardTitle>
                    {poll.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPoll(poll)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedPollForResults(poll._id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </DropdownMenuItem>
                      {poll.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleUpdatePollStatus(poll._id, 'active')}>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      {poll.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleUpdatePollStatus(poll._id, 'closed')}>
                          <Pause className="w-4 h-4 mr-2" />
                          Close
                        </DropdownMenuItem>
                      )}
                      {poll.status === 'closed' && (
                        <DropdownMenuItem onClick={() => handleUpdatePollStatus(poll._id, 'archived')}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeletePoll(poll._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(poll.status)}>
                    {poll.status}
                  </Badge>
                  <Badge className={getPriorityColor(poll.priority)}>
                    {poll.priority}
                  </Badge>
                  <Badge variant="outline">
                    {poll.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Votes:</span>
                    <span className="font-medium">{poll.options.reduce((sum, option) => sum + option.voters.length, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Voters:</span>
                    <span className="font-medium">{poll.totalVoters}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Options:</span>
                    <span className="font-medium">{poll.options.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDate(poll.createdAt)}</span>
                  </div>
                  {poll.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ends:</span>
                      <span className="font-medium">{formatDate(poll.endDate)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPollForResults(poll._id)}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPoll(poll)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {showCreateModal && (
          <CreatePollModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchPolls()
            }}
          />
        )}

        {editingPoll && (
          <CreatePollModal
            isOpen={!!editingPoll}
            onClose={() => setEditingPoll(null)}
            onSuccess={() => {
              setEditingPoll(null)
              fetchPolls()
            }}
            editPoll={editingPoll}
          />
        )}

        {selectedPollForResults && (
          <PollResultsModal
            pollId={selectedPollForResults}
            isOpen={!!selectedPollForResults}
            onClose={() => setSelectedPollForResults(null)}
          />
        )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
