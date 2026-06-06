'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Settings, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

interface ClubTierInfo {
  clubId: string;
  clubName: string;
  billingTier: string;
  billingStatus: string;
  estimatedMonthlyUsd: number;
  activeAddOns: number;
  unresolvedAlerts: number;
}

export default function BillingTiersManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [clubs, setClubs] = useState<ClubTierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadClubs() {
      try {
        setLoading(true);
        // Fetch club feature matrix which includes billing tier info
        const res = await apiClient.getClubFeatureMatrix();

        if (res.success && res.data) {
          const tierInfos: ClubTierInfo[] = res.data.clubs.map((club: any) => ({
            clubId: club._id,
            clubName: club.name,
            billingTier: club.billing_tier || 'free',
            billingStatus: club.billing_status || 'active',
            estimatedMonthlyUsd: club.estimated_monthly_usd || 0,
            activeAddOns: (club.flags?.filter((f: any) => f.enabled && f.key !== 'events' && f.key !== 'membership') || []).length,
            unresolvedAlerts: 0, // TODO: fetch from auditor
          }));

          setClubs(tierInfos);
        }
      } catch (err) {
        console.error('Failed to load clubs:', err);
        toast.error('Failed to load billing tier information');
      } finally {
        setLoading(false);
      }
    }

    loadClubs();
  }, [authLoading, user]);

  const filteredClubs = clubs.filter(club =>
    club.clubName.toLowerCase().includes(search.toLowerCase())
  );

  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-800',
    starter: 'bg-blue-100 text-blue-800',
    pro: 'bg-violet-100 text-violet-800',
    enterprise: 'bg-amber-100 text-amber-800',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    delinquent: 'bg-red-100 text-red-800',
    trial: 'bg-yellow-100 text-yellow-800',
  };

  if (loading || authLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Billing Tier Management</h1>
            <p className="text-gray-600 mt-1">Manage billing tiers and premium features for all clubs</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Clubs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pro/Enterprise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clubs.filter(c => ['pro', 'enterprise'].includes(c.billingTier)).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Delinquent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {clubs.filter(c => c.billingStatus === 'delinquent').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Monthly MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${clubs.reduce((s, c) => s + c.estimatedMonthlyUsd, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Clubs Table */}
          {filteredClubs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No clubs found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredClubs.map(club => (
                <Card key={club.clubId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{club.clubName}</h3>

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge className={tierColors[club.billingTier] || tierColors.free}>
                            {club.billingTier.toUpperCase()}
                          </Badge>
                          <Badge className={statusColors[club.billingStatus] || statusColors.active}>
                            {club.billingStatus.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Monthly Bill:</span>
                            <div className="font-semibold flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {club.estimatedMonthlyUsd.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Active Add-ons:</span>
                            <div className="font-semibold">{club.activeAddOns}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Unresolved Alerts:</span>
                            <div className={`font-semibold ${club.unresolvedAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {club.unresolvedAlerts}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link href={`/dashboard/billing-tiers/${club.clubId}`}>
                        <Button className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
