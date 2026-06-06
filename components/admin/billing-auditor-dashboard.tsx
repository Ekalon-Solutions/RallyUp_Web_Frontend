'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingAlert {
  _id: string;
  club: string;
  club_name: string;
  alert_type: string;
  feature_key?: string;
  service_id?: string;
  description: string;
  severity: 'warning' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

interface AuditorDashboardProps {
  clubFilter?: string;
}

export function BillingAuditorDashboard({ clubFilter }: AuditorDashboardProps) {
  const [alerts, setAlerts] = useState<BillingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'warning' | 'critical'>('all');
  const [filterResolved, setFilterResolved] = useState<boolean>(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.listBillingAlerts({
        clubId: clubFilter,
        alert_type: filterType || undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        resolved: filterResolved,
        limit: 100,
      });

      if (res.success) {
        setAlerts(res.data);
      }

      // Also load count of unresolved
      const countRes = await apiClient.getBillingAlertCount();
      if (countRes.success) {
        setUnresolvedCount(countRes.data.count);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
      toast.error('Failed to load billing alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [clubFilter, filterType, filterSeverity, filterResolved]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await apiClient.resolveBillingAlert(alertId);
      if (res.success) {
        toast.success('Alert resolved');
        loadAlerts();
      } else {
        toast.error('Failed to resolve alert');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast.error('Failed to resolve alert');
    }
  };

  const alertTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
    feature_above_tier: {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      icon: 'TrendingUp',
    },
    delinquent_premium_active: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      icon: 'AlertCircle',
    },
    trial_expired_still_active: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      icon: 'Clock',
    },
    manual_override_delinquent: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      icon: 'AlertTriangle',
    },
  };

  const getAlertIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      delinquent_premium_active: <AlertTriangle className="h-5 w-5" />,
      trial_expired_still_active: <AlertCircle className="h-5 w-5" />,
      feature_above_tier: <AlertCircle className="h-5 w-5" />,
      manual_override_delinquent: <AlertTriangle className="h-5 w-5" />,
    };
    return iconMap[type] || <AlertCircle className="h-5 w-5" />;
  };

  const getAlertLabel = (type: string): string => {
    const labels: Record<string, string> = {
      feature_above_tier: 'Feature Above Tier',
      delinquent_premium_active: 'Delinquent Premium Active',
      trial_expired_still_active: 'Trial Expired Still Active',
      manual_override_delinquent: 'Manual Override - Delinquent',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unresolved Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{unresolvedCount}</div>
            <p className="text-xs text-gray-500 mt-1">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {unresolvedAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {unresolvedAlerts.filter(a => a.severity === 'warning').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</div>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterResolved ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterResolved(!filterResolved)}
            >
              {filterResolved ? 'Resolved' : 'Unresolved'}
            </Button>

            <div className="border-l pl-2">
              {['warning', 'critical'].map(severity => (
                <Button
                  key={severity}
                  variant={filterSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSeverity(severity as any)}
                  className="ml-1"
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
              <Button
                variant={filterSeverity === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity('all')}
                className="ml-1"
              >
                All Severities
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAlerts()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No alerts found</h3>
            <p className="text-gray-600">All billing checks passing!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const colors = alertTypeColors[alert.alert_type] || {
              bg: 'bg-gray-50',
              text: 'text-gray-800',
            };

            return (
              <Card key={alert._id} className={cn('border-l-4', alert.severity === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn('p-2 rounded-lg', colors.bg, colors.text)}>
                        {getAlertIcon(alert.alert_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{getAlertLabel(alert.alert_type)}</h4>
                          <Badge
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            className={alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {alert.club_name && <span>Club: {alert.club_name}</span>}
                          {alert.service_id && <span>Service: {alert.service_id}</span>}
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                          {alert.resolved && (
                            <span className="text-green-600">
                              Resolved by {alert.resolved_by} on {new Date(alert.resolved_at!).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <Button
                        onClick={() => handleResolveAlert(alert._id)}
                        size="sm"
                        variant="default"
                        className="flex-shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
