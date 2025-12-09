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
  user?: {
    name: string;
    email: string;
    phone_number: string;
  } | null;
}

export function SessionManagement() {
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
      const response = await apiClient.get('/sessions/admin/all');
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

  const forceLogoutSession = async (sessionId: string) => {
    try {
      const response = await apiClient.delete(`/sessions/admin/session/${sessionId}`);
      if (response.success) {
        toast({
          title: "Success",
          description: "Session successfully invalidated",
        });
        await fetchSessions(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to invalidate session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invalidate session",
        variant: "destructive",
      });
    }
  };

  const forceLogoutUser = async (userId: string, userType: string) => {
    try {
      const response = await apiClient.delete(`/sessions/admin/user/${userId}/${userType}`);
      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully invalidated ${response.invalidatedCount} sessions`,
        });
        await fetchSessions(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to invalidate user sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invalidate user sessions",
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

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'super_admin':
        return 'bg-orange-100 text-orange-800';
      case 'system_owner':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Session Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage active user sessions across the platform
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
            All currently active user sessions with device information and activity status
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
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {session.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.user?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUserTypeColor(session.userType)}>
                          {session.userType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
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
                        <div className="flex space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Force Logout
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Force Logout Session</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately invalidate this session and force the user to log in again.
                                  Are you sure you want to continue?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => forceLogoutSession(session.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Force Logout
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Logout All
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Force Logout All User Sessions</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately invalidate ALL sessions for this user across all devices.
                                  They will need to log in again on all devices. Are you sure?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => forceLogoutUser(session.userId, session.userType)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Logout All Sessions
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
