'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { 
  Activity, 
  Users, 
  Monitor, 
  Smartphone, 
  Tablet, 
  AlertTriangle,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Shield
} from 'lucide-react';

interface Session {
  _id: string;
  userId: string;
  userType: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    deviceType: string;
  };
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
  userInfo: {
    name: string;
    email: string;
    phone_number: string;
    countryCode: string;
    role: string;
  };
}

interface SessionStats {
  totalActiveSessions: number;
  totalSessions: number;
  sessionsByUserType: { [key: string]: number };
  sessionsByDeviceType: { [key: string]: number };
  recentTerminations: number;
}

interface SuspiciousSession {
  _id: string;
  count: number;
  riskLevel: string;
  sessions: Session[];
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [suspiciousSessions, setSuspiciousSessions] = useState<SuspiciousSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, userTypeFilter, deviceTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes, suspiciousRes] = await Promise.all([
        apiClient.getAllSessions({
          page: currentPage,
          search: searchTerm,
          userType: userTypeFilter,
          deviceType: deviceTypeFilter
        }),
        apiClient.getSessionStats(),
        apiClient.getSuspiciousSessions()
      ]);

      if (sessionsRes.success && statsRes.success && suspiciousRes.success) {
        setSessions(sessionsRes.data.sessions);
        setTotalPages(sessionsRes.data.pagination.pages);
        setStats(statsRes.data);
        setSuspiciousSessions(suspiciousRes.data.suspiciousSessions);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      // // console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch session data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogoutSession = async (sessionId: string) => {
    try {
      const response = await apiClient.forceLogoutSession(sessionId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Session terminated successfully',
        });
        fetchData();
      } else {
        throw new Error(response.error || 'Failed to terminate session');
      }
    } catch (error) {
      // // console.error('Error terminating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate session',
        variant: 'destructive',
      });
    }
  };

  const handleForceLogoutUser = async (userId: string, userType: string) => {
    try {
      const response = await apiClient.forceLogoutUser(userId, userType);
      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully terminated ${response.data.sessionsTerminated} sessions`,
        });
        fetchData();
      } else {
        throw new Error(response.error || 'Failed to terminate user sessions');
      }
    } catch (error) {
      // // console.error('Error terminating user sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate user sessions',
        variant: 'destructive',
      });
    }
  };

  const handleCleanupExpired = async () => {
    try {
      const response = await apiClient.cleanupExpiredSessions();
      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully cleaned up ${response.data.cleanedCount} expired sessions`,
        });
        fetchData();
      } else {
        throw new Error(response.error || 'Failed to cleanup expired sessions');
      }
    } catch (error) {
      // // console.error('Error cleaning up sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup expired sessions',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user sessions for security
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCleanupExpired} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActiveSessions}</div>
              <p className="text-xs text-muted-foreground">
                Total: {stats.totalSessions}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Terminations</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentTerminations}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Types</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.sessionsByDeviceType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Types</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.sessionsByUserType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Active Sessions
        </button>
        <button
          onClick={() => setActiveTab('suspicious')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'suspicious'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Suspicious Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="system_owner">System Owner</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Device Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Monitor all active user sessions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.userInfo?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.userInfo?.email || session.userInfo?.phone_number || 'No contact info'}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {session.userType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.deviceInfo.deviceType)}
                        <span className="capitalize">{session.deviceInfo.deviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {session.deviceInfo.ipAddress}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(session.lastActivity)}
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.lastActivity)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(session.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Terminate Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to force logout this session? 
                                The user will be immediately logged out and need to authenticate again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleForceLogoutSession(session._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Terminate Session
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Users className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Terminate All User Sessions</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will force logout ALL active sessions for this user across all devices.
                                Are you sure you want to proceed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleForceLogoutUser(session.userId, session.userType)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Terminate All Sessions
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'suspicious' && (
        <Card>
          <CardHeader>
            <CardTitle>Suspicious Activity</CardTitle>
            <CardDescription>
              Monitor sessions that may indicate security concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Session Count</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousSessions.map((suspicious) => (
                  <TableRow key={suspicious._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {suspicious._id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{suspicious.count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskLevelColor(suspicious.riskLevel)}>
                        {suspicious.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {suspicious.sessions.slice(0, 3).map((session) => (
                          <div key={session._id} className="text-sm">
                            {session.userInfo?.name || 'Unknown'} ({session.userType})
                          </div>
                        ))}
                        {suspicious.sessions.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{suspicious.sessions.length - 3} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {suspicious.sessions.map((session) => (
                          <AlertDialog key={session._id}>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <LogOut className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Terminate Suspicious Session</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Terminate this session from IP {suspicious._id} for user {session.userInfo?.name || 'Unknown'}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleForceLogoutSession(session._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Terminate Session
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
