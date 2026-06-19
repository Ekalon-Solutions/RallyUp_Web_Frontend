'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type VendorOverrideModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken?: string;
  clubId?: string;
  eventId?: string;
  onActivated?: () => void;
};

export function VendorOverrideModal({
  open,
  onOpenChange,
  sessionToken,
  clubId,
  eventId,
  onActivated,
}: VendorOverrideModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!sessionToken || !clubId || !eventId || !code.trim()) {
      toast.error('Enter the override code from your club owner');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.activateVendorSessionOverride({
        sessionToken,
        overrideCode: code.trim(),
        clubId,
        eventId,
      });
      if (res.success) {
        toast.success('Venue lock override active for this session');
        setCode('');
        onOpenChange(false);
        onActivated?.();
      } else {
        toast.error(res.error || res.message || 'Invalid override code');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Master Admin Override</DialogTitle>
          <DialogDescription>
            Enter the one-time code from the club owner to temporarily lift venue and zone locks
            during a bottleneck.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="override-code">Override code</Label>
          <Input
            id="override-code"
            inputMode="numeric"
            autoComplete="off"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button className="w-full" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activate override
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
