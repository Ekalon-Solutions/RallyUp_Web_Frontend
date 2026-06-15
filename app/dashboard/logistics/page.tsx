'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Truck,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

type HealthStatus = 'connected' | 'degraded' | 'disconnected' | null;

interface Courier {
  id: number;
  name: string;
  etd?: string;
  rating?: number;
}

interface TraceRow {
  _id: string;
  requestId: string;
  endpoint: string;
  method: string;
  responseCode: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  env: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  NonNullable<HealthStatus>,
  { label: string; icon: React.ReactNode; badgeClass: string; dotClass: string }
> = {
  connected: {
    label: 'Connected',
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    dotClass: 'bg-green-500',
  },
  degraded: {
    label: 'Degraded',
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  disconnected: {
    label: 'Disconnected',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    dotClass: 'bg-red-500',
  },
};

export default function LogisticsPage() {
  const { user } = useAuth();

  const [health, setHealth] = useState<HealthStatus>(null);
  const [healthReason, setHealthReason] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [testLoading, setTestLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(true);

  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [tracesLoading, setTracesLoading] = useState(true);
  const [tracesPage, setTracesPage] = useState(1);
  const [tracesTotal, setTracesTotal] = useState(0);
  const [tracesPages, setTracesPages] = useState(1);

  const isSystemOwner = (user as any)?.role === 'system_owner';

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await apiClient.getLogisticsHealth();
      if (res.success && res.data) {
        setHealth(res.data.status as HealthStatus);
        setHealthReason(res.data.reason);
      }
    } catch {
      setHealth('disconnected');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchCouriers = useCallback(
    async (refresh = false) => {
      if (!isSystemOwner) return;
      setCouriersLoading(true);
      try {
        const res = await apiClient.getShiprocketCouriers(refresh);
        if (res.success && res.data) setCouriers(res.data.couriers ?? []);
      } finally {
        setCouriersLoading(false);
      }
    },
    [isSystemOwner]
  );

  const fetchTraces = useCallback(
    async (page = 1) => {
      if (!isSystemOwner) return;
      setTracesLoading(true);
      try {
        const res = await apiClient.getLogisticsTraces(page, 15);
        if (res.success && res.data) {
          setTraces(res.data.traces ?? []);
          setTracesTotal(res.data.total ?? 0);
          setTracesPages(res.data.pages ?? 1);
          setTracesPage(page);
        }
      } finally {
        setTracesLoading(false);
      }
    },
    [isSystemOwner]
  );

  useEffect(() => {
    fetchHealth();
    fetchCouriers();
    fetchTraces(1);

    // Poll health every 60 seconds
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchCouriers, fetchTraces]);

  const handleTestConnectivity = async () => {
    setTestLoading(true);
    setLastTestResult(null);
    try {
      const res = await apiClient.testShiprocketConnectivity();
      if (res.success && res.data) {
        setLastTestResult(res.data);
        if (res.data.ok) {
          toast.success(`Connected — ${res.data.latencyMs}ms`);
          setHealth('connected');
          setHealthReason(null);
        } else {
          toast.error(res.data.message);
          setHealth('disconnected');
          setHealthReason(res.data.message);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Connectivity test failed');
    } finally {
      setTestLoading(false);
    }
  };

  const statusCfg = health ? STATUS_CONFIG[health] : null;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Logistics Health</h1>
            <p className="text-sm text-muted-foreground">
              Shiprocket API integration status and diagnostics
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={healthLoading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Health card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                API Handshake Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking…</span>
                </div>
              ) : statusCfg ? (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span
                    className={`inline-block h-3 w-3 rounded-full shrink-0 ${statusCfg.dotClass} ${health === 'connected' ? 'animate-pulse' : ''}`}
                  />
                  {statusCfg.icon}
                  <Badge variant="outline" className={statusCfg.badgeClass}>
                    {statusCfg.label}
                  </Badge>
                  {healthReason && (
                    <span className="text-sm text-muted-foreground w-full sm:w-auto sm:truncate sm:max-w-xs">
                      {healthReason}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unknown</span>
              )}

              {lastTestResult && (
                <div className="mt-3 rounded-md border px-3 py-2 bg-muted/40 text-sm">
                  <span className="font-medium">Last test: </span>
                  {lastTestResult.ok ? (
                    <span className="text-green-600">
                      {lastTestResult.message} ({lastTestResult.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-red-600">{lastTestResult.message}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Connectivity button card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {health === 'connected' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                Test Connectivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Perform an instant handshake to verify the Shiprocket connection.
              </p>
              <Button
                onClick={handleTestConnectivity}
                disabled={testLoading || !isSystemOwner}
                className="w-full"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing…
                  </>
                ) : (
                  'Ping Shiprocket'
                )}
              </Button>
              {!isSystemOwner && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  System owner access required
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Couriers */}
        {isSystemOwner && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 shrink-0" />
                Available Couriers ({couriers.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCouriers(true)}
                disabled={couriersLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${couriersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {couriersLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading couriers…</span>
                </div>
              ) : couriers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No couriers loaded. Ensure the Shiprocket token is active and click Refresh.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {couriers.map((c) => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.name}
                      {c.etd && (
                        <span className="ml-1 text-muted-foreground">· {c.etd}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trace log */}
        {isSystemOwner && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <CardTitle className="text-base">
                Logistics Traces{' '}
                <span className="text-muted-foreground font-normal text-sm">
                  ({tracesTotal} total)
                </span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTraces(tracesPage)}
                disabled={tracesLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${tracesLoading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tracesLoading ? (
                <div className="flex items-center gap-2 p-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading traces…</span>
                </div>
              ) : traces.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6">No traces yet.</p>
              ) : (
                <>
                  <div className="md:hidden divide-y">
                    {traces.map((t) => (
                      <div key={t._id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {t.method}
                          </Badge>
                          <span
                            className={`text-xs font-medium ${
                              t.responseCode >= 200 && t.responseCode < 300
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {t.responseCode || '—'}
                          </span>
                        </div>
                        <p className="font-mono text-xs break-all">{t.endpoint}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t.durationMs != null ? `${t.durationMs}ms` : '—'}</span>
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {t.success ? 'Success' : t.errorMessage ?? 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="w-[80px]">Code</TableHead>
                        <TableHead className="w-[80px]">ms</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                        <TableHead className="w-[160px]">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traces.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {t.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[220px]">
                            {t.endpoint}
                          </TableCell>
                          <TableCell
                            className={`text-xs font-medium ${
                              t.responseCode >= 200 && t.responseCode < 300
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {t.responseCode || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {t.durationMs ?? '—'}
                          </TableCell>
                          <TableCell>
                            {t.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <span title={t.errorMessage}><XCircle className="h-4 w-4 text-red-500" /></span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(t.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  {tracesPages > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
                      <span className="text-sm text-muted-foreground text-center sm:text-left">
                        Page {tracesPage} of {tracesPages}
                      </span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => fetchTraces(tracesPage - 1)}
                          disabled={tracesPage <= 1 || tracesLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => fetchTraces(tracesPage + 1)}
                          disabled={tracesPage >= tracesPages || tracesLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
