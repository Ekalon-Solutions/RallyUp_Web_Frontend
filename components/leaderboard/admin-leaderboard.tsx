import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Clock, TrendingUp, RefreshCw, Plus, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeaderboardStats {
  totalSeasons: number;
  currentSeason: string;
  totalMembers: number;
  averageEventsPerMember: number;
  topPerformers: Array<{
    name: string;
    eventsAttended: number;
    totalHours: number;
    rank: number;
  }>;
}

interface AdminLeaderboardProps {
  clubId: string;
}

export function AdminLeaderboard({ clubId }: AdminLeaderboardProps) {
  const [stats, setStats] = React.useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    season: '',
    startDate: '',
    endDate: ''
  });
  const { toast } = useToast();

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLeaderboardStats({ clubId });
      if (response.success) {
        setStats(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch leaderboard stats',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leaderboard stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clubId, toast]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSyncLeaderboard = async () => {
    if (!stats?.currentSeason) {
      toast({
        title: 'Error',
        description: 'No current season found. Please create a leaderboard first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSyncing(true);
      const response = await apiClient.syncLeaderboard({
        clubId,
        season: stats.currentSeason
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Leaderboard synced successfully! ${response.data.totalEntries} entries updated.`,
        });
        fetchStats(); // Refresh stats
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to sync leaderboard',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync leaderboard',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateLeaderboard = async () => {
    if (!createForm.season || !createForm.startDate || !createForm.endDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createOrUpdateLeaderboard({
        clubId,
        season: createForm.season,
        startDate: createForm.startDate,
        endDate: createForm.endDate
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: response.data.message,
        });
        setShowCreateModal(false);
        setCreateForm({ season: '', startDate: '', endDate: '' });
        fetchStats(); // Refresh stats
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create leaderboard',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create leaderboard',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">Loading leaderboard stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard Management
          </h2>
          <p className="text-muted-foreground">Manage and sync event attendance leaderboards</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Leaderboard
          </Button>
          <Button
            onClick={handleSyncLeaderboard}
            disabled={syncing || !stats?.currentSeason}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seasons</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSeasons}</div>
              <p className="text-xs text-muted-foreground">
                {stats.currentSeason ? `Current: ${stats.currentSeason}` : 'No active season'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">Participating members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Events/Member</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageEventsPerMember}</div>
              <p className="text-xs text-muted-foreground">Events per member</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Synced</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data sync status</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {stats && stats.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformers.map((performer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Trophy className="w-5 h-5 text-amber-600" />}
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        #{performer.rank}
                      </Badge>
                    </div>
                    <span className="font-medium">{performer.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{performer.eventsAttended} events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{performer.totalHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Leaderboard Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Leaderboard</DialogTitle>
            <DialogDescription>
              Create a new leaderboard season to track member event attendance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="season">Season Name</Label>
              <Input
                id="season"
                placeholder="e.g., 2024, Q1-2024, Summer-2024"
                value={createForm.season}
                onChange={(e) => setCreateForm(prev => ({ ...prev, season: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={createForm.endDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLeaderboard}>
              Create Leaderboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


