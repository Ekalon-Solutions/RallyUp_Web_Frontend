'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, DollarSign, Settings, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { FeatureSelector } from '@/components/admin/feature-selector';
import { EstimatedMonthlyBill } from '@/components/admin/estimated-monthly-bill';
import { BillingAuditorDashboard } from '@/components/admin/billing-auditor-dashboard';

export default function ClubBillingTiersPage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const clubId = params?.clubId as string;
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(false);
    }
  }, [authLoading, user]);

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

  const handleTierChange = () => {
    // Trigger refresh of estimated monthly bill
    setRefreshTrigger(prev => prev + 1);
    toast.success('Tier updated. Bill recalculated.');
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Billing & Feature Management</h1>
                <p className="text-gray-600 mt-1">Manage your club's billing tier and premium features</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="selector" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selector" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tier & Add-ons
              </TabsTrigger>
              <TabsTrigger value="bill" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Bill
              </TabsTrigger>
              <TabsTrigger value="auditor" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Billing Alerts
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Feature Selector */}
            <TabsContent value="selector" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Feature Selection Guide
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select your <strong>Billing Tier</strong> - all bundled features will be automatically enabled</li>
                  <li>• Purchase <strong>Premium Add-ons</strong> individually - features can start with a 14-day trial</li>
                  <li>• <strong>Service IDs</strong> enable 1:1 reconciliation between usage (Reporting) and charges</li>
                  <li>• Monthly invoices are automatically generated with prorated charges for mid-month changes</li>
                  <li>• <strong>Delinquent status</strong> will auto-disable premium features within 24 hours</li>
                </ul>
              </div>

              <FeatureSelector clubId={clubId} onTierChange={handleTierChange} />
            </TabsContent>

            {/* Tab 2: Monthly Bill */}
            <TabsContent value="bill" className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Estimated Monthly Bill
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Shows base tier cost + all active add-ons</li>
                  <li>• Prorated charges calculated for remaining days in current month</li>
                  <li>• Each line item includes the Service ID for usage reconciliation</li>
                  <li>• Trial features are tracked separately and will auto-revert if no payment received</li>
                </ul>
              </div>

              <EstimatedMonthlyBill clubId={clubId} refreshTrigger={refreshTrigger} />
            </TabsContent>

            {/* Tab 3: Billing Auditor Dashboard */}
            <TabsContent value="auditor" className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Billing Auditor Dashboard
                </h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• <strong>Feature Above Tier</strong> - Feature enabled but not included in current tier</li>
                  <li>• <strong>Delinquent Premium Active</strong> - Premium features active while club is delinquent (auto-disable within 24h)</li>
                  <li>• <strong>Trial Expired Still Active</strong> - Feature trial ended but still enabled without payment</li>
                  <li>• <strong>Critical Alerts</strong> require immediate investigation and resolution</li>
                </ul>
              </div>

              <BillingAuditorDashboard clubFilter={clubId} />
            </TabsContent>
          </Tabs>

          {/* Important Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ All invoice generations are <strong>automatic and prorated</strong> based on remaining days in the month</li>
              <li>✓ Trial periods are <strong>14 days by default</strong> and auto-revert to OFF without payment</li>
              <li>✓ Delinquent billing status will <strong>auto-disable premium features within 24 hours</strong></li>
              <li>✓ Every feature toggle generates an <strong>audit log entry with Service ID</strong> for reconciliation</li>
              <li>✓ <strong>Billing conflicts</strong> are flagged in the Auditor Dashboard for manual review</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
