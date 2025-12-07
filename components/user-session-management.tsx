"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../lib/api';
import { formatLocalDate } from '../lib/timezone';

interface Session {
  id: string;
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
}

export function UserSessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sessions/my-sessions');
      if (response.success) {
        setSessions(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSessions = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const logoutCurrentSession = async () => {
    try {
      const response = await apiClient.delete('/sessions/current');
      if (response.success) {
        toast({
          title: "Success",
          description: "Successfully logged out from current session",
        });
        // Redirect to login or refresh the page
        window.location.href = '/';
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to logout from current session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout from current session",
        variant: "destructive",
      });
    }
  };

  const logoutAllSessions = async () => {
    try {
      const response = await apiClient.delete('/sessions/all');
      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully logged out from ${response.invalidatedCount} sessions`,
        });
        // Redirect to login or refresh the page
        window.location.href = '/';
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to logout from all sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout from all sessions",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'long');
  };

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return 'bg-blue-100 text-blue-800';
      case 'mobile':
        return 'bg-green-100 text-green-800';
      case 'tablet':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentSession = (session: Session) => {
    // This is a simplified check - in a real app, you might want to compare with the current token
    return session.isActive && new Date(session.lastActivity) > new Date(Date.now() - 5 * 60 * 1000); // Within 5 minutes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Sessions</h2>
          <p className="text-muted-foreground">
            Manage your active sessions across different devices
          </p>
        </div>
        <Button onClick={refreshSessions} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions ({sessions.length})</CardTitle>
          <CardDescription>
            Your currently active sessions with device information and activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <Badge className={getDeviceTypeColor(session.deviceInfo.deviceType)}>
                            {session.deviceInfo.deviceType}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                            {session.deviceInfo.userAgent}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {session.deviceInfo.ipAddress}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(session.lastActivity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(session.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isCurrentSession(session) ? (
                          <Badge className="bg-green-100 text-green-800">
                            Current Session
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isCurrentSession(session) ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Logout This Device
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Logout Current Session</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will log you out from this device. You'll need to log in again to continue.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={logoutCurrentSession}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Logout
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Other device
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Manage all your sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Logout from Current Device</h3>
              <p className="text-sm text-muted-foreground">
                End your session on this device only
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  Logout This Device
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout Current Device</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will log you out from this device. You'll need to log in again to continue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logoutCurrentSession}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Logout from All Devices</h3>
              <p className="text-sm text-muted-foreground">
                End all your sessions across all devices for security
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Logout All Devices
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout All Devices</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will log you out from ALL devices. You'll need to log in again on any device you want to use.
                    This is useful if you suspect unauthorized access to your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logoutAllSessions}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout All Devices
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
