import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Calendar, Star } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  userId: string;
  name?: string;
  email?: string;
  avatar?: string;
  club?: string;
  eventCount: number;
  points: number;
}

interface MemberLeaderboardProps {
  clubId?: string;
  season?: string;
}

export function MemberLeaderboard({ clubId }: MemberLeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getLeaderboard(clubId);
      if (response.success && response.data) {
        const data = response.data.leaderboard || [];
        setEntries(data);
      } else {
        setError(response.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      // // console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    if (rank <= 10) return 'outline';
    return 'secondary';
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userEntry = useMemo(() => {
    if (!user?._id) return null;
    return entries.find((entry) => entry.userId === user._id) || null;
  }, [entries, user?._id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No leaderboard data available yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userEntry && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  #{entries.findIndex((entry) => entry.userId === userEntry.userId) + 1}
                </div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userEntry.eventCount}</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {userEntry.points}
                </div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              {userEntry.club && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{userEntry.club}</div>
                  <div className="text-sm text-muted-foreground">Club</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user?._id && entry.userId === user._id;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isCurrentUser ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(rank)}
                      <Badge variant={getRankBadgeVariant(rank)}>Rank {rank}</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar} alt={entry.name || 'User'} />
                        <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">
                          {entry.name || 'Anonymous User'}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{entry.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{entry.eventCount} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{entry.points} pts</span>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}