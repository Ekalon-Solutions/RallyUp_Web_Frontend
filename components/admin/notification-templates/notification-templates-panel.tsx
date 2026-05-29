"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import { useRequiredClubId } from "@/hooks/useRequiredClubId";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Mail, Smartphone, RotateCcw, Save, Map } from "lucide-react";
import { toast } from "sonner";
import { NotificationTemplateEditor } from "./template-editor";
import { NotificationTemplatePreview } from "./template-preview";
import { VariableChipSidebar } from "./variable-chip-sidebar";
import type { NotificationChannel } from "@/lib/notification-template-utils";

export type NotificationTemplateRecord = {
  id: string;
  triggerType: string;
  triggerLabel: string;
  channel: NotificationChannel;
  defaultSubject: string;
  defaultBody: string;
  customSubject: string;
  customBody: string;
  activeSubject: string;
  activeBody: string;
  isCustomized: boolean;
  suppressionEnabled: boolean;
  journeyStage: string;
  priority: number;
};

type UndoSnapshot = {
  customSubject?: string;
  customBody?: string;
  isCustomized: boolean;
  versionNumber: number;
};

const JOURNEY_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  event: "Event",
  feedback: "Feedback",
  commerce: "Commerce",
};

export function NotificationTemplatesPanel() {
  const clubId = useRequiredClubId();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [mappingOverview, setMappingOverview] = useState<Record<string, NotificationTemplateRecord[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | NotificationChannel>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [suppressionEnabled, setSuppressionEnabled] = useState(false);
  const [editorValid, setEditorValid] = useState(true);
  const [deviceOs, setDeviceOs] = useState<"ios" | "android">("ios");
  const [darkPreview, setDarkPreview] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const filteredTemplates = useMemo(() => {
    if (channelFilter === "all") return templates;
    return templates.filter((t) => t.channel === channelFilter);
  }, [templates, channelFilter]);

  const loadTemplates = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await apiClient.listNotificationTemplates(clubId);
      if (res.success && res.data) {
        setTemplates(res.data.templates);
        setMappingOverview(res.data.mappingOverview);
        setSelectedId((current) => current ?? res.data!.templates[0]?.id ?? null);
      }
    } catch {
      toast.error("Failed to load notification templates");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!selected) return;
    setSubject(selected.isCustomized ? selected.customSubject : selected.defaultSubject);
    setBody(selected.isCustomized ? selected.customBody : selected.defaultBody);
    setSuppressionEnabled(selected.suppressionEnabled);
  }, [selected]);

  const handleSave = async () => {
    if (!clubId || !selected || !editorValid) return;
    setSaving(true);
    try {
      const res = await apiClient.updateNotificationTemplate(clubId, selected.id, {
        subject,
        body,
        suppressionEnabled,
      });
      if (res.success && res.data) {
        setTemplates((prev) => prev.map((t) => (t.id === res.data!.id ? res.data! : t)));
        toast.success("Template saved");
      } else {
        toast.error(res.message || "Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!clubId || !selected) return;
    setSaving(true);
    try {
      const res = await apiClient.resetNotificationTemplate(clubId, selected.id);
      if (res.success && res.data) {
        const undoSnapshot = res.undoSnapshot as UndoSnapshot;
        setTemplates((prev) => prev.map((t) => (t.id === res.data!.id ? res.data! : t)));
        setSubject(res.data.defaultSubject);
        setBody(res.data.defaultBody);
        setSuppressionEnabled(res.data.suppressionEnabled);
        setRestoreOpen(false);
        toast.success("Template restored to default", {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: async () => {
              if (!undoSnapshot) return;
              const undoRes = await apiClient.undoResetNotificationTemplate(clubId, selected.id, undoSnapshot);
              if (undoRes.success && undoRes.data) {
                setTemplates((prev) => prev.map((t) => (t.id === undoRes.data!.id ? undoRes.data! : t)));
                setSubject(
                  undoRes.data.isCustomized ? undoRes.data.customSubject : undoRes.data.defaultSubject
                );
                setBody(undoRes.data.isCustomized ? undoRes.data.customBody : undoRes.data.defaultBody);
                toast.message("Restore undone");
              }
            },
          },
        });
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      } else {
        toast.error(res.message || "Failed to restore template");
      }
    } catch {
      toast.error("Failed to restore template");
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalReset = async () => {
    if (!clubId || user?.role !== "system_owner") return;
    if (!confirm("Force-reset ALL notification templates for this club to system defaults?")) return;
    const res = await apiClient.globalResetNotificationTemplates(clubId);
    if (res.success && res.data) {
      setTemplates(res.data.templates);
      toast.success(`Reset ${res.data.resetCount} template(s)`);
    } else {
      toast.error(res.message || "Global reset failed");
    }
  };

  const insertFromSidebar = (placeholder: string) => {
    const el = document.getElementById("template-body") as HTMLTextAreaElement | null;
    if (!el) {
      setBody((prev) => prev + placeholder);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + placeholder + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + placeholder.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pr-0 lg:pr-72">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Message Templates</h2>
          <p className="text-sm text-muted-foreground">
            Customize email and in-app notification copy for your club.
          </p>
        </div>
        {user?.role === "system_owner" && (
          <Button variant="destructive" size="sm" onClick={handleGlobalReset}>
            Global reset all
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4" />
            Mapping overview
          </CardTitle>
          <CardDescription>Templates grouped by member journey stage</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(mappingOverview).map(([stage, items]) => (
            <div key={stage} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">{JOURNEY_LABELS[stage] ?? stage}</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {(items as NotificationTemplateRecord[]).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span>{t.triggerLabel}</span>
                    <Badge variant="outline">{t.channel === "email" ? "Email" : "In-app"}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as typeof channelFilter)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="mr-1 h-3 w-3" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="in_app">
                  <Smartphone className="mr-1 h-3 w-3" />
                  In-app
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-lg border p-3 text-left transition hover:bg-muted/50 ${
                  selectedId === t.id ? "border-primary bg-muted/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.triggerLabel}</span>
                  {t.isCustomized ? <Badge>Customized</Badge> : <Badge variant="secondary">System Default</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{t.channel.replace("_", " ")}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{selected.triggerLabel}</CardTitle>
                    <CardDescription>
                      {selected.channel === "email" ? "Email template" : "In-app push template"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRestoreOpen(true)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore to Default
                    </Button>
                    <Button type="button" size="sm" disabled={!editorValid || saving} onClick={handleSave}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="suppression-toggle">Suppress this notification</Label>
                    <p className="text-xs text-muted-foreground">Stop sending without deleting the template text.</p>
                  </div>
                  <Switch
                    id="suppression-toggle"
                    checked={suppressionEnabled}
                    onCheckedChange={setSuppressionEnabled}
                  />
                </div>

                <NotificationTemplateEditor
                  channel={selected.channel}
                  subject={subject}
                  body={body}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                  onValidationChange={setEditorValid}
                />
              </CardContent>
            </Card>

            <NotificationTemplatePreview
              channel={selected.channel}
              subject={subject}
              body={body}
              deviceOs={deviceOs}
              onDeviceOsChange={setDeviceOs}
              darkPreview={darkPreview}
              onDarkPreviewChange={setDarkPreview}
            />
          </>
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">Select a template to edit.</CardContent>
          </Card>
        )}
      </div>

      <VariableChipSidebar onInsert={insertFromSidebar} />

      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore to default?</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete your custom club branding for this notification.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={saving} onClick={handleRestore}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
