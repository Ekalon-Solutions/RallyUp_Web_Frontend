'use client';

import React from 'react';
import { VolunteerOptInWidget } from '@/components/volunteer/volunteer-opt-in-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminVolunteerList from '@/components/volunteer/admin-volunteer-list';
import { useAuth } from '@/contexts/auth-context';
import { useSelectedClubId } from '@/hooks/useSelectedClubId';

/**
 * Volunteer Management Demo Page
 * 
 * This page demonstrates both user-facing and admin-facing volunteer features:
 * - User: Opt-in/out toggle widget
 * - Admin: Complete volunteer list with filtering
 * 
 * Usage:
 * Add this to your routing structure at /dashboard/volunteers
 */
export default function VolunteerManagementPage() {
  const { user } = useAuth();
  const clubId = useSelectedClubId() ?? undefined;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Volunteer Management</h1>
        <p className="text-gray-600">
          Manage your volunteer status and view all volunteers
        </p>
      </div>

      <Tabs defaultValue="user" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="user">My Volunteer Status</TabsTrigger>
          <TabsTrigger value="admin">Admin View</TabsTrigger>
        </TabsList>

        {/* User Tab - Volunteer Opt-In Widget */}
        <TabsContent value="user" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volunteer Opt-In Widget */}
            <div className="lg:col-span-2">
              <VolunteerOptInWidget 
                currentUser={user}
                clubId={clubId}
                onProfileUpdate={(profile) => {
                  // // console.log('Volunteer profile updated:', profile);
                }}
              />
            </div>

            {/* Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Volunteer?</CardTitle>
                <CardDescription>Benefits of volunteering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">🤝 Make an Impact</p>
                  <p className="text-gray-600">Help your community and make a difference</p>
                </div>
                <div>
                  <p className="font-medium mb-1">🌟 Build Skills</p>
                  <p className="text-gray-600">Develop new abilities and expertise</p>
                </div>
                <div>
                  <p className="font-medium mb-1">👥 Connect</p>
                  <p className="text-gray-600">Meet like-minded people and grow your network</p>
                </div>
                <div>
                  <p className="font-medium mb-1">🏆 Recognition</p>
                  <p className="text-gray-600">Earn badges and certificates for your contributions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  i
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">How It Works</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Toggle the switch above to opt-in as a volunteer</li>
                    <li>Fill in your skills, interests, and availability</li>
                    <li>Admins will be able to see you in the volunteer list</li>
                    <li>You'll receive notifications about volunteer opportunities</li>
                    <li>You can opt-out anytime by toggling the switch off</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab - Volunteer List */}
        <TabsContent value="admin" className="space-y-6">
          {clubId && (user?.role === 'super_admin' || user?.role === 'system_owner') ? (
            <AdminVolunteerList 
              clubId={clubId}
              currentUser={user}
            />
          ) : !clubId ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Club Selected</h3>
                <p className="text-gray-600">
                  Please select a club to view volunteers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
                <p className="text-gray-600">
                  You need admin privileges to view the volunteer list.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
