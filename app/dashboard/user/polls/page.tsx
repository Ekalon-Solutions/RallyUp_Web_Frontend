"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Poll } from "@/lib/api"
import { 
  Search, 
  Filter, 
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { PollCard } from "@/components/poll-card"
import { PollResultsModal } from "@/components/modals/poll-results-modal"

export default function UserPollsPage() {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedPollForResults, setSelectedPollForResults] = useState<string | null>(null)

  useEffect(() => {
    fetchActivePolls()
  }, [])

  const fetchActivePolls = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getActivePolls({
        search: searchTerm || undefined,
        category: categoryFilter !== "all" ? categoryFilter as any : undefined,
      })
      
      if (response.success && response.data) {
        setPolls(response.data.polls)
      } else {
        throw new Error(response.error || "Failed to load polls")
      }
    } catch (error: any) {
      // console.error("Error fetching polls:", error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes("Access denied") || error.message?.includes("Unauthorized")) {
        toast.error("You don't have permission to view polls")
      } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.")
      } else if (error.message?.includes("Club") || error.message?.includes("membership")) {
        toast.error("You must be a member of a club to view polls")
      } else {
        toast.error(error.message || "An error occurred while loading polls")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchActivePolls()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, categoryFilter])

  const handleVote = (updatedPoll?: Poll) => {
    if (updatedPoll) {
      // Update the specific poll in the state
      setPolls(prevPolls => 
        prevPolls.map(poll => 
          poll._id === updatedPoll._id ? updatedPoll : poll
        )
      )
    } else {
      // Fallback: refresh all polls
      fetchActivePolls()
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

  // Determine which club IDs the current user is associated with
  const currentUser: any = user
  const userClubIds = new Set<string>()
  if (currentUser?.club && currentUser.club._id) {
    userClubIds.add(currentUser.club._id)
  }
  if (currentUser?.memberships && Array.isArray(currentUser.memberships)) {
    currentUser.memberships.forEach((m: any) => {
      const cid = m?.club_id?._id || m?.club_id
      if (cid) userClubIds.add(cid)
    })
  }

  const now = new Date()

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter

    // Extract poll's club id (poll.club may be an object or a string)
    const pollClubId = typeof (poll as any).club === 'string' ? (poll as any).club : (poll as any).club?._id

    // Only include polls that belong to one of the user's clubs
    const matchesClub = pollClubId ? userClubIds.has(pollClubId) : false

    // Exclude polls whose endDate has passed
    const matchesEndDate = !poll.endDate || new Date(poll.endDate) >= now

    return matchesSearch && matchesCategory && matchesClub && matchesEndDate
  })

  // Separate polls by status
  const activePolls = filteredPolls.filter(poll => poll.status === 'active')
  const closedPolls = filteredPolls.filter(poll => poll.status === 'closed')

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Club Polls</h1>
        <p className="text-muted-foreground">Participate in polls and share your feedback with the club</p>
      </div>

      {/* Filters */}
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

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Active Polls</h2>
            <Badge variant="secondary">{activePolls.length}</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activePolls.map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                onVote={handleVote}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed Polls
      {closedPolls.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Closed Polls</h2>
            <Badge variant="secondary">{closedPolls.length}</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {closedPolls.map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                showResults={true}
                onVote={handleVote}
              />
            ))}
          </div>
        </div>
      )} */}

      {/* No Polls */}
      {filteredPolls.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No polls available</h3>
            <p>There are currently no polls to participate in</p>
          </div>
        </div>
      )}

      {/* Poll Statistics
      {polls.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Poll Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Polls</p>
                    <p className="text-2xl font-bold">{polls.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Polls</p>
                    <p className="text-2xl font-bold">{activePolls.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-2xl font-bold">
                      {polls.reduce((sum, poll) => sum + poll.totalVotes, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )} */}

        {/* Results Modal */}
        {/* {selectedPollForResults && (
          <PollResultsModal
            pollId={selectedPollForResults}
            isOpen={!!selectedPollForResults}
            onClose={() => setSelectedPollForResults(null)}
          />
        )} */}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
