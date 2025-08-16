import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Calendar, Clock, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface LeaderboardEntry {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  eventsAttended: number;
  totalHours: number;
  rank: number;
  streak: number;
  achievements: string[];
}

interface Leaderboard {
  _id: string;
  season: string;
  entries: LeaderboardEntry[];
  lastSynced: string;
}

interface UserRanking {
  rank: number;
  eventsAttended: number;
  totalHours: number;
  streak: number;
  achievements: string[];
}

interface MemberLeaderboardProps {
  clubId: string;
  season?: string;
}

export function MemberLeaderboard({ clubId, season }: MemberLeaderboardProps) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = React.useState<Leaderboard | null>(null);
  const [userRanking, setUserRanking] = React.useState<UserRanking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLeaderboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch leaderboard data
      const leaderboardResponse = await apiClient.getLeaderboard({ clubId, season });
      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.data);
      } else {
        setError(leaderboardResponse.error || 'Failed to fetch leaderboard');
      }

      // Fetch user's personal ranking
      if (user) {
        const rankingResponse = await apiClient.getUserRanking({ clubId, season });
        if (rankingResponse.success) {
          setUserRanking(rankingResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [clubId, season, user]);

  React.useEffect(() => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
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

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No leaderboard data available for this season.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard - {leaderboard.season}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(leaderboard.lastSynced).toLocaleDateString()}
          </p>
        </CardHeader>
      </Card>

      {/* User's Personal Ranking */}
      {userRanking && userRanking.rank > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">#{userRanking.rank}</div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userRanking.eventsAttended}</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userRanking.totalHours}h</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userRanking.streak}</div>
                <div className="text-sm text-muted-foreground">Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.entries.map((entry) => (
              <div
                key={entry._id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  entry.user._id === user?._id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <Badge variant={getRankBadgeVariant(entry.rank)}>
                      Rank {entry.rank}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {entry.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {entry.user.name}
                        {entry.user._id === user?._id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{entry.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{entry.eventsAttended} events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{entry.totalHours}h</span>
                  </div>
                  {entry.streak > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{entry.streak} streak</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


