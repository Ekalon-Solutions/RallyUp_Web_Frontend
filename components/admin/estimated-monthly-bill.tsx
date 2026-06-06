'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyBillItem {
  feature_key: string;
  service_id: string;
  monthly_usd: number;
  is_trial: boolean;
}

interface MonthlyBillProps {
  clubId: string;
  refreshTrigger?: number; // Increment to trigger refresh
}

export function EstimatedMonthlyBill({ clubId, refreshTrigger = 0 }: MonthlyBillProps) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBill() {
      try {
        setLoading(true);
        const res = await apiClient.getEstimatedMonthlyBill(clubId);

        if (res.success) {
          setBill(res.data);
        } else {
          toast.error('Failed to load monthly bill');
        }
      } catch (err) {
        console.error('Error loading bill:', err);
        toast.error('Failed to load monthly bill');
      } finally {
        setLoading(false);
      }
    }

    loadBill();
  }, [clubId, refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!bill) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Unable to load billing information
        </CardContent>
      </Card>
    );
  }

  const periodEnd = new Date(bill.period_end);
  const daysRemaining = bill.days_remaining_in_month;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier Cost */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Base Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bill.tier_monthly_usd.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {bill.billing_tier.charAt(0).toUpperCase() + bill.billing_tier.slice(1)} plan
            </p>
          </CardContent>
        </Card>

        {/* Add-ons Cost */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bill.active_addons.reduce((s: number, a: any) => s + a.monthly_usd, 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {bill.active_addons.length} feature{bill.active_addons.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Total Monthly */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Monthly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${bill.total_monthly_usd.toFixed(2)}</div>
            <p className="text-xs text-blue-700 mt-1">
              {daysRemaining} days remaining (${bill.prorated_this_month_usd.toFixed(2)} prorated)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {bill.active_addons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Add-on Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Service ID</TableHead>
                  <TableHead>Monthly Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.active_addons.map((addon: MonthlyBillItem) => (
                  <TableRow key={addon.feature_key}>
                    <TableCell className="font-medium capitalize">
                      {addon.feature_key.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">
                      {addon.service_id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${addon.monthly_usd.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={addon.is_trial ? 'secondary' : 'default'}
                        className={addon.is_trial ? 'bg-yellow-100 text-yellow-800' : ''}
                      >
                        {addon.is_trial ? 'TRIAL' : 'ACTIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Billing Period Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Period End</div>
              <div className="font-semibold">{periodEnd.toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Days Remaining</div>
              <div className="font-semibold">{daysRemaining} days</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            Prorated charges are calculated based on remaining days in the billing month. Next full month will be charged on {periodEnd.toLocaleDateString()}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
