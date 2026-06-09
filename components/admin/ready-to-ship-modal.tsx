'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Package,
  Zap,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface Courier {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days?: number;
}

interface PickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  phone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  shiprocketShipmentId?: number;
  deliveryPincode?: string;
  onSuccess: (updatedOrder: any) => void;
}

export function ReadyToShipModal({
  open,
  onClose,
  orderId,
  orderNumber,
  shiprocketShipmentId,
  deliveryPincode,
  onSuccess,
}: Props) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sortBy, setSortBy] = useState<'cost' | 'speed'>('cost');
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');

  const [courierBusyAlert, setCourierBusyAlert] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    manifestUrl?: string;
    labelUrl?: string;
    awbCode?: string;
    courierName?: string;
  } | null>(null);

  const loadCouriers = useCallback(async () => {
    if (!shiprocketShipmentId) return;
    setLoadingCouriers(true);
    setCourierBusyAlert(null);
    try {
      const res = await apiClient.getFulfillmentCouriers(orderId, {
        pickupPin: locations[0]?.pin_code || '400001',
        sort: sortBy,
      });
      if (res.success && res.data) {
        setCouriers((res.data as Courier[]) ?? []);
        if ((res.data as Courier[]).length > 0 && !selectedCourierId) {
          setSelectedCourierId(String((res.data as Courier[])[0].courier_company_id));
        }
      }
    } finally {
      setLoadingCouriers(false);
    }
  }, [orderId, shiprocketShipmentId, sortBy, locations, selectedCourierId]);

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await apiClient.getFulfillmentPickupLocations();
      if (res.success && res.data) {
        setLocations(res.data as PickupLocation[]);
        if ((res.data as PickupLocation[]).length > 0) {
          setSelectedLocationName((res.data as PickupLocation[])[0].pickup_location);
        }
      }
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadLocations();
    // Default pickup date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
    setSuccessData(null);
    setCourierBusyAlert(null);
  }, [open, loadLocations]);

  useEffect(() => {
    if (open && locations.length > 0) loadCouriers();
  }, [open, sortBy, locations, loadCouriers]);

  const selectedCourier = couriers.find((c) => String(c.courier_company_id) === selectedCourierId);

  const handleSubmit = async () => {
    if (!selectedCourierId) { toast.error('Select a courier'); return; }
    if (!pickupDate) { toast.error('Select a pickup date'); return; }

    const pickupDateTime = `${pickupDate} ${pickupTime}`;

    setSubmitting(true);
    setCourierBusyAlert(null);

    try {
      const res = await apiClient.triggerReadyToShip(orderId, {
        courierId: parseInt(selectedCourierId),
        pickupDate: pickupDateTime,
        pickupLocationName: selectedLocationName,
      });

      if (res.success) {
        const data = res as any;
        setSuccessData({
          manifestUrl: data.manifestUrl,
          labelUrl: data.labelUrl,
          awbCode: data.awbCode,
          courierName: data.courierName,
        });
        toast.success(`Manifest generated — pickup via ${data.courierName}`);
        onSuccess(data.data);
      } else if ((res as any).code === 'COURIER_BUSY') {
        // Find the next best courier
        const currentIdx = couriers.findIndex((c) => String(c.courier_company_id) === selectedCourierId);
        const next = couriers[currentIdx + 1];
        setCourierBusyAlert(
          next
            ? `${selectedCourier?.courier_name} is unavailable. Suggested alternative: ${next.courier_name} (₹${next.rate})`
            : `${selectedCourier?.courier_name} is unavailable. No alternative found — try a different date.`
        );
        if (next) setSelectedCourierId(String(next.courier_company_id));
      } else {
        toast.error(res.message || 'Fulfillment failed');
      }
    } catch {
      toast.error('Failed to trigger fulfillment');
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ready to Ship — {orderNumber}
          </DialogTitle>
          <DialogDescription>
            Select a courier and schedule a pickup. Manifest and label will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        {successData ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Manifest Generated &amp; Pickup Scheduled
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              {successData.courierName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier:</span>
                  <span className="font-medium">{successData.courierName}</span>
                </div>
              )}
              {successData.awbCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AWB:</span>
                  <span className="font-mono">{successData.awbCode}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {successData.labelUrl && (
                <Button asChild variant="default" size="sm" className="flex-1">
                  <a href={successData.labelUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Label
                  </a>
                </Button>
              )}
              {successData.manifestUrl && (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <a href={successData.manifestUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Manifest
                  </a>
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="w-full">Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {courierBusyAlert && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {courierBusyAlert}
              </div>
            )}

            {/* Courier sort */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Courier</Label>
                <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'cost' | 'speed')}>
                  <TabsList className="h-7 text-xs">
                    <TabsTrigger value="cost" className="px-2 h-6 text-xs gap-1">
                      <DollarSign className="h-3 w-3" /> Cost
                    </TabsTrigger>
                    <TabsTrigger value="speed" className="px-2 h-6 text-xs gap-1">
                      <Zap className="h-3 w-3" /> Speed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {loadingCouriers ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading couriers…
                </div>
              ) : couriers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No couriers available. Check that the order is pushed to Shiprocket.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {couriers.map((c) => (
                    <button
                      key={c.courier_company_id}
                      type="button"
                      onClick={() => setSelectedCourierId(String(c.courier_company_id))}
                      className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                        selectedCourierId === String(c.courier_company_id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.courier_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            ₹{c.rate}
                          </Badge>
                          {c.etd && (
                            <span className="text-xs text-muted-foreground">{c.etd}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pickup location */}
            <div className="space-y-1.5">
              <Label>Pickup Location</Label>
              {loadingLocations ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                </div>
              ) : (
                <Select value={selectedLocationName} onValueChange={setSelectedLocationName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.pickup_location}>
                        {l.name || l.pickup_location} — {l.city}
                      </SelectItem>
                    ))}
                    {locations.length === 0 && (
                      <SelectItem value="Primary">Primary (default)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Pickup date + time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pickup-date">Pickup Date</Label>
                <Input
                  id="pickup-date"
                  type="date"
                  min={minDateStr}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickup-time">Time Slot</Label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger id="pickup-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="14:00">02:00 PM</SelectItem>
                    <SelectItem value="15:00">03:00 PM</SelectItem>
                    <SelectItem value="16:00">04:00 PM</SelectItem>
                    <SelectItem value="17:00">05:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !selectedCourierId || loadingCouriers}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scheduling…</>
                ) : (
                  <><Truck className="h-4 w-4 mr-2" />Schedule Pickup</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
