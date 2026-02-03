"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  Eye
} from "lucide-react"
import { getApiUrl } from "@/lib/config"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

interface OnboardingProgress {
  _id: string
  user: {
    _id: string
    first_name: string
    last_name: string
    email: string
  }
  onboardingFlow: {
    _id: string
    name: string
  }
  completedSteps: string[]
  currentStep: number
  status: 'not_started' | 'in_progress' | 'completed'
  startedAt: string
  completedAt?: string
  responses: Record<string, any>
}

interface OnboardingFlow {
  _id: string
  name: string
}

export default function UserOnboardingProgressAdmin() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const [progressData, setProgressData] = useState<OnboardingProgress[]>([])
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFlow, setSelectedFlow] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  useEffect(() => {
    fetchFlows()
    fetchProgressData()
  }, [clubId])

  const fetchFlows = async () => {
    try {
      const token = localStorage.getItem("token")
      const url = clubId ? `${getApiUrl('/onboarding/flows')}?club=${encodeURIComponent(clubId)}` : getApiUrl('/onboarding/flows')
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFlows(data.flows || [])
      }
    } catch (error) {
    }
  }

  const fetchProgressData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const url = clubId ? `${getApiUrl('/onboarding/progress/all')}?club=${encodeURIComponent(clubId)}` : getApiUrl('/onboarding/progress/all')
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProgressData(data.progress || [])
      } else {
        toast.error("Failed to fetch user progress data")
      }
    } catch (error) {
      toast.error("Error loading user progress")
    } finally {
      setLoading(false)
    }
  }

  const filteredData = progressData.filter(progress => {
    if (!progress.user || !progress.onboardingFlow) return false
    
    const matchesSearch = 
      progress.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFlow = selectedFlow === "all" || progress.onboardingFlow._id === selectedFlow
    const matchesStatus = selectedStatus === "all" || progress.status === selectedStatus

    return matchesSearch && matchesFlow && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      case 'not_started':
        return <Badge variant="secondary">Not Started</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateProgress = (progress: OnboardingProgress) => {
    if (!progress.onboardingFlow) return 0
    return progress.status === 'completed' ? 100 : 
           progress.status === 'in_progress' ? 50 : 0
  }

  const exportToCSV = () => {
    const csvData = filteredData
      .filter(p => p.user && p.onboardingFlow)
      .map(p => ({
        'User Name': `${p.user.first_name} ${p.user.last_name}`,
        'Email': p.user.email,
        'Flow': p.onboardingFlow.name,
        'Status': p.status,
        'Started': new Date(p.startedAt).toLocaleDateString(),
        'Completed': p.completedAt ? new Date(p.completedAt).toLocaleDateString() : 'N/A',
      }))

    if (csvData.length === 0) {
      toast.error("No data to export")
      return
    }

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onboarding-progress-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Progress data exported successfully")
  }

  const stats = {
    total: progressData.length,
    completed: progressData.filter(p => p.status === 'completed').length,
    inProgress: progressData.filter(p => p.status === 'in_progress').length,
    notStarted: progressData.filter(p => p.status === 'not_started').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notStarted}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Onboarding Progress</CardTitle>
          <CardDescription>
            Track which users have completed which onboarding flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedFlow} onValueChange={setSelectedFlow}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by flow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flows</SelectItem>
                {flows.map(flow => (
                  <SelectItem key={flow._id} value={flow._id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No progress data found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((progress) => (
                    <TableRow key={progress._id}>
                      <TableCell className="font-medium">
                        {progress.user.first_name} {progress.user.last_name}
                      </TableCell>
                      <TableCell>{progress.user.email}</TableCell>
                      <TableCell>{progress.onboardingFlow.name}</TableCell>
                      <TableCell>{getStatusBadge(progress.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${calculateProgress(progress)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {calculateProgress(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(progress.startedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {progress.completedAt 
                          ? new Date(progress.completedAt).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            toast.info("View detailed progress (to be implemented)")
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
