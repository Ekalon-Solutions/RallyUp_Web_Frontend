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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, ShieldOff, History } from "lucide-react";
import { apiClient, Event } from "@/lib/api";
import { toast } from "sonner";

const LIVE_POLICY_CHANGE_REQUIRES_ACK = "LIVE_POLICY_CHANGE_REQUIRES_ACK";
const CANNOT_MODIFY_HISTORICAL_POLICIES_CODE = "CANNOT_MODIFY_HISTORICAL_POLICIES";

interface RefundPolicyToggleProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedEvent: Event) => void;
}

export function RefundPolicyToggle({
  event,
  open,
  onClose,
  onSuccess,
}: RefundPolicyToggleProps) {
  const currentPolicy = event.isRefundAllowed !== false && event.is_refund_allowed !== false;

  const [newPolicy, setNewPolicy] = useState(currentPolicy);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsAck, setNeedsAck] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const policyChanged = newPolicy !== currentPolicy;

  const handleClose = () => {
    setNewPolicy(currentPolicy);
    setReason("");
    setNeedsAck(false);
    setAcknowledged(false);
    setWarningMessage(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (policyChanged && !reason.trim()) {
      toast.error("A reason is required when changing the refund policy.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.patchEventRefundPolicy(event._id, {
        isRefundAllowed: newPolicy,
        reason: reason.trim() || undefined,
        acknowledgeLivePolicyImpact: needsAck && acknowledged ? true : undefined,
      });

      if (res.success && res.data) {
        const label = newPolicy ? "Refundable" : "Non-Refundable";
        toast.success(`Refund policy updated to ${label}.`);
        onSuccess(res.data.event);
        handleClose();
        return;
      }

      const code = (res as any).code;
      const message = (res as any).error || "Failed to update refund policy";

      if (code === LIVE_POLICY_CHANGE_REQUIRES_ACK) {
        setNeedsAck(true);
        setWarningMessage(message);
        setLoading(false);
        return;
      }

      if (code === CANNOT_MODIFY_HISTORICAL_POLICIES_CODE) {
        toast.error("Cannot Modify Historical Policies", {
          description: "This event has already completed. Refund policy cannot be changed.",
        });
        setLoading(false);
        return;
      }

      toast.error(message);
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
          {/* Current vs New */}
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
              onCheckedChange={(v) => {
                setNewPolicy(v);
                setNeedsAck(false);
                setAcknowledged(false);
                setWarningMessage(null);
              }}
              disabled={loading}
            />
          </div>

          {/* Warning: live event with ticket holders */}
          {needsAck && warningMessage && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Warning: This will impact existing ticket holders
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Members who purchased tickets under the previous policy will retain their
                    grandfathered rights. A Policy Change Timestamp is recorded to protect them.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ack"
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(Boolean(v))}
                  disabled={loading}
                />
                <Label htmlFor="ack" className="text-sm cursor-pointer">
                  I understand this affects live event ticket holders
                </Label>
              </div>
            </div>
          )}

          {/* Reason (required when toggling) */}
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
            disabled={loading || !policyChanged || (needsAck && !acknowledged)}
          >
            {loading ? "Saving..." : "Save Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
