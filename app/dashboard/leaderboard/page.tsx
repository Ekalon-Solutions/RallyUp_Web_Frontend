"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Trophy, Medal, Award, Calendar, Star, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'

interface LeaderboardEntry {
  userId: string
  name?: string
  email?: string
  avatar?: string
  club?: string
  eventCount: number
  points: number
}

export default function AdminLeaderboardPage() {
  const clubId = useRequiredClubId()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editedPoints, setEditedPoints] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      if (!clubId) {
        setLeaderboard([])
        setEditedPoints({})
        setLoading(false)
        return
      }
      const response = await apiClient.getLeaderboard()

      if (response.success && response.data) {
        const entries = (response.data.leaderboard || []).filter((e: any) => String(e?.club || '') === String(clubId))
        setLeaderboard(entries)

        const pointsMap: Record<string, string> = {}
        entries.forEach(entry => {
          pointsMap[entry.userId] = String(entry.points ?? 0)
        })
        setEditedPoints(pointsMap)
      } else {
        toast.error(response.error || 'Failed to fetch leaderboard')
      }
    } catch (error) {
      // console.error('Error fetching leaderboard:', error)
      toast.error('Error fetching leaderboard')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  const getInitials = (name?: string) => {
    if (!name) return '??'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const handlePointsChange = (userId: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setEditedPoints(prev => ({ ...prev, [userId]: value }))
    }
  }

  const handleUpdatePoints = async (userId: string) => {
    const rawValue = editedPoints[userId]

    if (rawValue === undefined || rawValue === '') {
      toast.error('Please enter a points value')
      return
    }

    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      toast.error('Points must be a non-negative number')
      return
    }

    try {
      setSavingId(userId)
      const response = await apiClient.updateLeaderboardPoints(userId, numericValue)

      if (response.success) {
        toast.success('Points updated successfully')
        await fetchLeaderboard()
      } else {
        toast.error(response.error || 'Failed to update points')
      }
    } catch (error) {
      // console.error('Error updating points:', error)
      toast.error('Error updating points')
    } finally {
      setSavingId(null)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default'
    if (rank <= 3) return 'secondary'
    if (rank <= 10) return 'outline'
    return 'secondary'
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Leaderboard Management</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Review member rankings and adjust points awarded for event attendance. Updates are applied immediately.
              </p>
            </div>
            <Button variant="outline" onClick={fetchLeaderboard} disabled={loading || savingId !== null}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Leaderboard Overview
              </CardTitle>
              <CardDescription>
                Points determine the ordering. Adjust them to reflect manual corrections or bonus awards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No leaderboard data available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Once members attend events they will appear here.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Events</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry, index) => {
                        const rank = index + 1
                        const inputValue = editedPoints[entry.userId] ?? String(entry.points ?? 0)
                        const isSaving = savingId === entry.userId
                        const parsedValue = Number(inputValue)
                        const hasChanged =
                          inputValue !== '' && Number.isFinite(parsedValue) && parsedValue !== entry.points

                        return (
                          <TableRow key={entry.userId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRankIcon(rank) || (
                                  <span className="text-muted-foreground font-semibold">#{rank}</span>
                                )}
                                {rank <= 3 && (
                                  <Badge variant={getRankBadgeVariant(rank)} className="ml-1">
                                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={entry.avatar} alt={entry.name || 'User'} />
                                  <AvatarFallback>
                                    {getInitials(entry.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{entry.name || 'Anonymous User'}</p>
                                  {entry.club && (
                                    <p className="text-xs text-muted-foreground">Club: {entry.club}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">{entry.email || 'N/A'}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{entry.eventCount}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="\\d*"
                                  value={inputValue}
                                  onChange={(event) => handlePointsChange(entry.userId, event.target.value)}
                                  className="w-24 text-right"
                                  disabled={isSaving}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePoints(entry.userId)}
                                disabled={isSaving || !hasChanged}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving
                                  </>
                                ) : (
                                  'Update'
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
