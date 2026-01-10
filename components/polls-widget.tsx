"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Vote, 
  Users, 
  MessageSquare, 
  Calendar,
  ArrowRight
} from "lucide-react"
import { apiClient, Poll } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { formatLocalDate } from "@/lib/timezone"

interface PollsWidgetProps {
  limit?: number
  showCreateButton?: boolean
}

export function PollsWidget({ limit = 3, showCreateButton = true }: PollsWidgetProps) {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPolls()
  }, [])

  const fetchRecentPolls = async () => {
    setLoading(true)
    try {
      // If authenticated admin, ask server for polls scoped to admin's club
      const isAdminLocal = user?.role === 'admin' || user?.role === 'super_admin'
      const response = isAdminLocal
        ? await apiClient.getActivePollsByMyClub({
            page: 1,
            limit: limit + 2, // Get a few extra in case some are filtered out
          })
        : await apiClient.getActivePolls({
            limit: limit + 2, // Get a few extra in case some are filtered out
          })
      
      if (response.success && response.data) {
        setPolls(response.data.polls.slice(0, limit))
      }
    } catch (error) {
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'date-short')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Recent Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Recent Polls
          </CardTitle>
          {showCreateButton && isAdmin && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/polls">
                <Vote className="w-4 h-4 mr-2" />
                Manage
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {polls.length === 0 ? (
          <div className="text-center py-6">
            <Vote className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">No active polls</p>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href="/dashboard/polls">
                  Create First Poll
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {polls.map((poll) => (
                <div key={poll._id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                      {poll.question}
                    </h4>
                    <Badge className={`ml-2 text-xs shrink-0 ${getStatusColor(poll.status)}`}>
                      {poll.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2 flex-grow">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 shrink-0" />
                      <span>{poll.totalVoters} voters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <span>{poll.totalVotes} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDate(poll.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant="outline" className="text-xs">
                      {poll.category}
                    </Badge>
                    <Button asChild size="sm" variant="ghost" className="h-6 px-2">
                      <Link href={isAdmin ? "/dashboard/polls" : "/dashboard/user/polls"}>
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={isAdmin ? "/dashboard/polls" : "/dashboard/user/polls"}>
                  View All Polls
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
