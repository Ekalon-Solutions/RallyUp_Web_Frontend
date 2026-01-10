"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  ArrowRight
} from "lucide-react"
import { apiClient, Event } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { formatLocalDate } from "@/lib/timezone"

interface LatestEventsWidgetProps {
  limit?: number
  showManageButton?: boolean
}

export function LatestEventsWidget({ limit = 3, showManageButton = true }: LatestEventsWidgetProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentEvents()
  }, [])

  const fetchRecentEvents = async () => {
    setLoading(true)
    try {
      const response = isAdmin
        ? await apiClient.getEventsByClub()
        : await apiClient.getPublicEvents()


      if (response.success && response.data) {
        const eventsData = Array.isArray(response.data) ? response.data : (response.data as any).events || []
        const sortedEvents = eventsData
          .filter((event: Event) => event.isActive)
          .sort((a: Event, b: Event) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, limit)
        setEvents(sortedEvents)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'date-short')
  }

  const formatTime = (dateString: string) => {
    return formatLocalDate(dateString, 'time-only')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isEventUpcoming = (event: Event) => {
    return new Date(event.startTime) > new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Latest Events
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
            <Calendar className="w-5 h-5" />
            Latest Events
          </CardTitle>
          {showManageButton && isAdmin && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/events">
                <Calendar className="w-4 h-4 mr-2" />
                Manage
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">No upcoming events</p>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href="/dashboard/events">
                  Create First Event
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {events.map((event) => (
                <div key={event._id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                      {event.title}
                    </h4>
                    <Badge variant={isEventUpcoming(event) ? "default" : "secondary"} className="ml-2 text-xs shrink-0">
                      {isEventUpcoming(event) ? "Upcoming" : "Past"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs text-muted-foreground mb-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">{formatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{formatTime(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {event.currentAttendees || 0}
                        {event.maxAttendees ? `/${event.maxAttendees}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.category?.replace("-", " ")}
                    </Badge>
                    <Button asChild size="sm" variant="ghost" className="h-6 px-2">
                      <Link href={isAdmin ? "/dashboard/events" : "/dashboard/user"}>
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
                <Link href={isAdmin ? "/dashboard/events" : "/dashboard/user"}>
                  View All Events
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
