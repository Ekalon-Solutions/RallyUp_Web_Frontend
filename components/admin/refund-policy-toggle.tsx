"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, History } from "lucide-react";
import { apiClient, Event } from "@/lib/api";
import { toast } from "sonner";

const CANNOT_MODIFY_HISTORICAL_POLICIES_CODE = "CANNOT_MODIFY_HISTORICAL_POLICIES";

function isLiveEventWithTicketHolders(event: Event): boolean {
  if (event.isActive === false) return false;
  const now = Date.now();
  const end = event.endTime ? new Date(event.endTime).getTime() : null;
  const start = event.startTime ? new Date(event.startTime).getTime() : null;
  if (end != null && !Number.isNaN(end) && end < now) return false;
  if (start != null && !Number.isNaN(start) && start < now && (end == null || Number.isNaN(end))) return false;
  const regs = event.registrations;
  if (!Array.isArray(regs) || regs.length === 0) return false;
  return regs.some((r) => r?.status === "confirmed");
}

interface RefundPolicyToggleProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedEvent: Event) => void;
  onNeedAck: (newPolicy: boolean, reason: string) => void;
}

export function RefundPolicyToggle({
  event,
  open,
  onClose,
  onSuccess,
  onNeedAck,
}: RefundPolicyToggleProps) {
  const currentPolicy = event.isRefundAllowed !== false && event.is_refund_allowed !== false;

  const [newPolicy, setNewPolicy] = useState(currentPolicy);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const policyChanged = newPolicy !== currentPolicy;

  const handleClose = () => {
    setNewPolicy(currentPolicy);
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (policyChanged && !reason.trim()) {
      toast.error("A reason is required when changing the refund policy.");
      return;
    }

    if (isLiveEventWithTicketHolders(event)) {
      onNeedAck(newPolicy, reason);
      handleClose();
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.updateEvent(event._id, {
        isRefundAllowed: newPolicy,
        is_refund_allowed: newPolicy,
        refund_policy_change_reason: reason.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Refund policy updated to ${newPolicy ? "Refundable" : "Non-Refundable"}.`);
        onSuccess(res.data.event);
        handleClose();
        return;
      }

      const code = (res as any).data?.code;
      if (code === CANNOT_MODIFY_HISTORICAL_POLICIES_CODE) {
        toast.error("Cannot Modify Historical Policies", {
          description: "This event has already completed. Refund policy cannot be changed.",
        });
      } else {
        toast.error((res as any).error || "Failed to update refund policy");
      }
    } catch {
      toast.error("Failed to update refund policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentPolicy ? (
              <ShieldCheck className="w-5 h-5 text-green-600" />
            ) : (
              <ShieldOff className="w-5 h-5 text-muted-foreground" />
            )}
            Refund Policy
          </DialogTitle>
          <DialogDescription>
            Change the refund policy for <span className="font-semibold">{event.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Allow Refunds</p>
              <div className="flex items-center gap-2">
                <Badge variant={currentPolicy ? "default" : "secondary"} className="text-xs">
                  Current: {currentPolicy ? "Refundable" : "Non-Refundable"}
                </Badge>
                {policyChanged && (
                  <Badge variant={newPolicy ? "default" : "outline"} className="text-xs">
                    New: {newPolicy ? "Refundable" : "Non-Refundable"}
                  </Badge>
                )}
              </div>
            </div>
            <Switch
              checked={newPolicy}
              onCheckedChange={setNewPolicy}
              disabled={loading}
            />
          </div>

          {policyChanged && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for change <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g. Venue change, operational constraint..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="w-3 h-3" />
                Recorded in Admin Action Audit Trail with old and new policy.
              </p>
            </div>
          )}

          {!policyChanged && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Toggle the switch above to change the refund policy.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !policyChanged}
          >
            {loading ? "Saving..." : "Save Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
