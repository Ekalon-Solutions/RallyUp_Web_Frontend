"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Filter,
  Download,
  Search,
  TrendingUp
} from "lucide-react"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { toast } from "sonner"
import { triggerBlobDownload, formatDisplayDate } from '@/lib/utils'

interface UserProgress {
  _id: string
  user: {
    _id: string
    first_name: string
    last_name: string
    email: string
    username: string
  }
  onboardingFlow: {
    _id: string
    name: string
    description: string
    type: string
  }
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  progress: number
  currentStepIndex: number
  completedSteps: number[]
  startedAt?: string
  completedAt?: string
  lastActivityAt: string
}

interface FlowStats {
  _id: string
  count: number
  avgProgress: number
}

interface OnboardingAnalyticsProps {
  flowId?: string
}

export default function OnboardingAnalytics({ flowId }: OnboardingAnalyticsProps) {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [stats, setStats] = useState<FlowStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchAnalytics()
  }, [flowId, statusFilter])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (flowId) {
        // Fetch specific flow stats
        const response = await fetch(
          getApiUrl(API_ENDPOINTS.onboardingProgress.flowStats(flowId)),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.data.stats || [])
          setUserProgress(data.data.userProgress || [])
        }
      } else {
        // Fetch all progress
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.append('status', statusFilter)
        
        const response = await fetch(
          getApiUrl(`${API_ENDPOINTS.onboardingProgress.allProgress}?${params}`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          setUserProgress(data.data || [])
        }
      }
    } catch (error) {
      // console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch onboarding analytics')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateCompletionRate = () => {
    if (userProgress.length === 0) return 0
    const completed = userProgress.filter(p => p.status === 'completed').length
    return Math.round((completed / userProgress.length) * 100)
  }

  const calculateAvgProgress = () => {
    if (userProgress.length === 0) return 0
    const total = userProgress.reduce((sum, p) => sum + p.progress, 0)
    return Math.round(total / userProgress.length)
  }

  const filteredProgress = userProgress.filter(progress => {
    const matchesSearch = searchTerm === '' || 
      progress.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const exportToCSV = () => {
    const headers = ['User Name', 'Email', 'Flow', 'Status', 'Progress', 'Started At', 'Completed At']
    const rows = filteredProgress.map(p => [
      `${p.user.first_name} ${p.user.last_name}`,
      p.user.email,
      p.onboardingFlow.name,
      p.status,
      `${p.progress}%`,
      p.startedAt ? formatDisplayDate(p.startedAt) : 'N/A',
      p.completedAt ? formatDisplayDate(p.completedAt) : 'N/A'
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const filename = `onboarding-analytics-${new Date().toISOString().split('T')[0]}.csv`
  triggerBlobDownload(blob, filename)
  toast.success('Analytics exported successfully!')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled in onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCompletionRate()}%</div>
            <p className="text-xs text-muted-foreground">
              Users completed onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAvgProgress()}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProgress.filter(p => p.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently onboarding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Progress</CardTitle>
              <CardDescription>Track onboarding completion by user</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'not_started' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('not_started')}
              >
                Not Started
              </Button>
            </div>
          </div>

          {/* User Progress Table */}
          <div className="space-y-2">
            {filteredProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria
              </div>
            ) : (
              filteredProgress.map((progress) => (
                <div
                  key={progress._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {progress.user.first_name} {progress.user.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {progress.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {progress.onboardingFlow.name}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{progress.progress}%</div>
                      <div className="text-xs text-muted-foreground">
                        Step {progress.currentStepIndex + 1}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(progress.status)}>
                      {progress.status.replace('_', ' ')}
                    </Badge>
                    
                    <div className="text-xs text-muted-foreground text-right min-w-[100px]">
                      {progress.completedAt ? (
                        <div>
                          <div className="font-medium text-green-600">Completed</div>
                          <div>{formatDisplayDate(progress.completedAt)}</div>
                        </div>
                      ) : progress.startedAt ? (
                        <div>
                          <div>Started</div>
                          <div>{formatDisplayDate(progress.startedAt)}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">Not started</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
