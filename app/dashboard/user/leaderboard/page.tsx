"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Trophy, Medal, Award, Users, Calendar, Star, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
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

export default function UserLeaderboardPage() {
    const { user, isLoading: authLoading, isAuthenticated } = useAuth()
    const clubId = useRequiredClubId()
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [userRank, setUserRank] = useState<number | null>(null)
    const [userEventCount, setUserEventCount] = useState<number>(0)
    const [userPoints, setUserPoints] = useState<number>(0)

    const userId = user?._id ?? null

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true)
            if (!clubId) {
                setLeaderboard([])
                setUserRank(null)
                setUserEventCount(0)
                setUserPoints(0)
                setLoading(false)
                return
            }
            const response = await apiClient.getLeaderboard()

            if (response.success && response.data) {
                const filtered = (response.data.leaderboard || []).filter(
                    (e) => String((e as any)?.club || '') === String(clubId)
                )
                setLeaderboard(filtered)

                // Find user's rank and event count
                if (userId) {
                    const userEntry = filtered.find(
                        (entry) => entry.userId === userId
                    )
                    if (userEntry) {
                        setUserEventCount(userEntry.eventCount)
                        setUserPoints(userEntry.points || 0)
                        const rank = filtered.findIndex(
                            (entry) => entry.userId === userId
                        ) + 1
                        setUserRank(rank)
                    } else {
                        setUserRank(null)
                        setUserEventCount(0)
                        setUserPoints(0)
                    }
                } else {
                    setUserRank(null)
                    setUserEventCount(0)
                    setUserPoints(0)
                }
            } else {
                toast.error(response.error || 'Failed to fetch leaderboard')
            }
        } catch (error) {
            // console.error('Error fetching leaderboard:', error)
            toast.error('Error fetching leaderboard')
        } finally {
            setLoading(false)
        }
    }, [userId, clubId])

    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            return
        }

        fetchLeaderboard()
    }, [authLoading, isAuthenticated, fetchLeaderboard])

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

    const getInitials = (name?: string) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const isCurrentUser = (entryUserId: string) => {
        return user?._id === entryUserId
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="p-6">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading leaderboard...</p>
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
                <div className="p-6 space-y-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Event Attendance Leaderboard</h1>
                            <p className="text-muted-foreground mt-2">
                                See how you rank among all members based on event attendance
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchLeaderboard}
                            disabled={loading}
                            className="w-full md:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </>
                            )}
                        </Button>
                    </div>

                    {/* User Stats Card */}
                    {user && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Your Ranking
                                </CardTitle>
                                <CardDescription>Your current position on the leaderboard</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {userRank !== null ? (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(userRank)}
                                                    <span className="text-3xl font-bold">#{userRank}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Events Attended</p>
                                                    <p className="text-2xl font-semibold">{userEventCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Points</p>
                                                    <p className="text-2xl font-semibold flex items-center gap-1">
                                                        <Star className="w-5 h-5 text-yellow-500" />
                                                        {userPoints}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-muted-foreground">You haven't attended any events yet</p>
                                                <p className="text-2xl font-semibold">0 events</p>
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant={userRank && userRank <= 10 ? 'default' : 'secondary'}>
                                        {userRank ? `Rank ${userRank}` : 'Not Ranked'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Leaderboard Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                Top Performers
                            </CardTitle>
                            <CardDescription>
                                Members ranked by number of events attended
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-12">
                                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No leaderboard data available yet</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Attend events to start appearing on the leaderboard!
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
                                                <TableHead className="text-right">Events Attended</TableHead>
                                                <TableHead className="text-right">Points</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaderboard.map((entry, index) => {
                                                const rank = index + 1
                                                const isUser = isCurrentUser(entry.userId)

                                                return (
                                                    <TableRow
                                                        key={entry.userId}
                                                        className={isUser ? 'bg-primary/10 font-medium' : ''}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getRankIcon(rank) || (
                                                                    <span className="text-muted-foreground font-semibold">
                                                                        #{rank}
                                                                    </span>
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
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={entry.avatar} alt={entry.name || 'User'} />
                                                                    <AvatarFallback>
                                                                        {getInitials(entry.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {entry.name || 'Anonymous User'}
                                                                        {isUser && (
                                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                                You
                                                                            </Badge>
                                                                        )}
                                                                    </p>
                                                                    {entry.club && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Club: {entry.club}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm text-muted-foreground">
                                                                {entry.email || 'N/A'}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                                <span className="font-semibold">{entry.eventCount}</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {entry.eventCount === 1 ? 'event' : 'events'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Star className="w-4 h-4 text-yellow-500" />
                                                                <span className="font-semibold">{entry.points || 0}</span>
                                                            </div>
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

