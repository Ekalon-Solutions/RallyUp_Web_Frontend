"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { 
  Search, 
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { PollCard } from "@/components/poll-card"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"

export default function UserPollsPage() {
  const { user } = useAuth()
  const clubId = useSelectedClubId()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    fetchActivePolls()
  }, [clubId])

  const fetchActivePolls = async () => {
    setLoading(true)
    try {
      if (!clubId) {
        setPolls([])
        setLoading(false)
        return
      }

      const response = await apiClient.getActivePolls({
        clubId,
        search: searchTerm || undefined,
        category: categoryFilter !== "all" ? categoryFilter as any : undefined,
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
  }, [searchTerm, categoryFilter, clubId])

  const handleVote = (updatedPoll?: Poll) => {
    if (updatedPoll) {
      setPolls(prevPolls => 
        prevPolls.map(poll => 
          poll._id === updatedPoll._id ? updatedPoll : poll
        )
      )
    } else {
      fetchActivePolls()
    }
  }

  const now = new Date()

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter
    const pollClubId = typeof (poll as any).club === 'string' ? (poll as any).club : (poll as any).club?._id
    const matchesClub = clubId ? pollClubId === clubId : true
    const matchesEndDate = !poll.endDate || new Date(poll.endDate) >= now

    return matchesSearch && matchesCategory && matchesClub && matchesEndDate
  })

  const activePolls = filteredPolls.filter(poll => poll.status === 'active')

  if (!clubId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Club Selected</h3>
              <p className="text-muted-foreground mb-4">Please select a club to view polls.</p>
              <Button onClick={() => (window.location.href = "/splash")}>Select Club</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

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

      {filteredPolls.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No polls available</h3>
            <p>There are currently no polls to participate in</p>
          </div>
        </div>
      )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
