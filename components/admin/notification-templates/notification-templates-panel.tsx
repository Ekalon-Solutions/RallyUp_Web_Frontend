"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import type { TriggerMapEntry } from "@/lib/api";
import { useRequiredClubId } from "@/hooks/useRequiredClubId";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Mail,
  Smartphone,
  RotateCcw,
  Save,
  Map,
  Clock,
  BellOff,
  Info,
  AlertCircle,
  CheckCircle2,
  Zap,
  Settings2,
  Search,
  Eye,
  Bell,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationTemplateEditor } from "./template-editor";
import { NotificationTemplatePreview } from "./template-preview";
import { AppSettingsTab } from "@/components/admin/settings/app-settings-tab";
import type { NotificationChannel } from "@/lib/notification-template-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  delayAfterEventEndHours?: number;
};

type UndoSnapshot = {
  customSubject?: string;
  customBody?: string;
  isCustomized: boolean;
  versionNumber: number;
};

// ─── Journey config ───────────────────────────────────────────────────────────

const JOURNEY_CONFIG: Record<
  string,
  { label: string; color: string; dotColor: string; headerColor: string }
> = {
  onboarding: {
    label: "Onboarding",
    color: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
    headerColor: "text-blue-600 dark:text-blue-400",
  },
  event: {
    label: "Events",
    color: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    headerColor: "text-emerald-600 dark:text-emerald-400",
  },
  feedback: {
    label: "Feedback",
    color: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    headerColor: "text-amber-600 dark:text-amber-400",
  },
  commerce: {
    label: "Commerce",
    color: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
    headerColor: "text-purple-600 dark:text-purple-400",
  },
};

// ─── Template browser sidebar ─────────────────────────────────────────────────

function TemplateBrowser({
  templates,
  selectedId,
  onSelect,
  channelFilter,
  onChannelFilter,
}: {
  templates: NotificationTemplateRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  channelFilter: "all" | NotificationChannel;
  onChannelFilter: (f: "all" | NotificationChannel) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["onboarding", "event", "feedback", "commerce"])
  );

  const filtered = useMemo(() => {
    let list = templates;
    if (channelFilter !== "all") list = list.filter((t) => t.channel === channelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.triggerLabel.toLowerCase().includes(q));
    }
    return list;
  }, [templates, channelFilter, search]);

  const grouped = useMemo(() => {
    const map: Record<string, NotificationTemplateRecord[]> = {};
    for (const t of filtered) {
      const key = t.journeyStage || "other";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [filtered]);

  const toggleGroup = (stage: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search */}
      <div className="relative mb-2.5">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="h-8 pl-8 text-xs"
        />
      </div>

      {/* Channel filter */}
      <div className="mb-3 flex rounded-lg border bg-muted/30 p-0.5 gap-0.5">
        {(["all", "email", "in_app"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChannelFilter(f)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-all ${
              channelFilter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "email" ? (
              <Mail className="h-3 w-3" />
            ) : f === "in_app" ? (
              <Smartphone className="h-3 w-3" />
            ) : (
              <Bell className="h-3 w-3" />
            )}
            {f === "all" ? "All" : f === "email" ? "Email" : "Push"}
          </button>
        ))}
      </div>

      {/* Template groups */}
      <ScrollArea className="flex-1">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Search className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No templates found</p>
          </div>
        ) : (
          <div className="space-y-1 pb-2 pr-1">
            {Object.entries(grouped).map(([stage, items]) => {
              const config = JOURNEY_CONFIG[stage] ?? {
                label: stage,
                color: "text-muted-foreground",
                dotColor: "bg-muted-foreground",
                headerColor: "text-muted-foreground",
              };
              const isExpanded = expandedGroups.has(stage);

              return (
                <div key={stage}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(stage)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition hover:bg-muted/40 ${config.headerColor}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotColor}`}
                    />
                    <span className="flex-1 text-left">{config.label}</span>
                    <Badge
                      variant="outline"
                      className="h-4 min-w-[18px] justify-center px-1 py-0 text-[9px] font-medium"
                    >
                      {items.length}
                    </Badge>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {items.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelect(t.id)}
                          className={`w-full rounded-lg border px-2.5 py-2 text-left transition-all ${
                            selectedId === t.id
                              ? "border-primary/30 bg-primary/5 shadow-sm"
                              : "border-transparent hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {/* Status dot */}
                            {t.suppressionEnabled ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                            ) : t.isCustomized ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            ) : (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                            )}
                            <span className="flex-1 truncate text-xs font-medium leading-tight">
                              {t.triggerLabel}
                            </span>
                            {t.channel === "email" ? (
                              <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                            ) : (
                              <Smartphone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                            )}
                          </div>

                          {(t.suppressionEnabled ||
                            t.isCustomized ||
                            (t.delayAfterEventEndHours ?? 0) > 0) && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {t.suppressionEnabled ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-destructive/25 bg-destructive/10 px-1.5 py-0 text-[9px] font-medium text-destructive">
                                  <BellOff className="h-2 w-2" />
                                  Suppressed
                                </span>
                              ) : t.isCustomized ? (
                                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0 text-[9px] font-medium text-primary">
                                  Customized
                                </span>
                              ) : null}
                              {(t.delayAfterEventEndHours ?? 0) > 0 && (
                                <Badge
                                  variant="outline"
                                  className="h-4 gap-0.5 border-amber-300 px-1 py-0 text-[9px] text-amber-600"
                                >
                                  <Clock className="h-2 w-2" />
                                  +{t.delayAfterEventEndHours}h
                                </Badge>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Trigger map overview ─────────────────────────────────────────────────────

function TriggerMapOverview({ entries }: { entries: TriggerMapEntry[] }) {
  const byStage = useMemo(() => {
    const map: Record<string, TriggerMapEntry[]> = {
      onboarding: [],
      event: [],
      feedback: [],
      commerce: [],
    };
    for (const e of entries) map[e.journeyStage]?.push(e);
    return map;
  }, [entries]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(byStage).map(([stage, items]) => {
        const config = JOURNEY_CONFIG[stage] ?? {
          label: stage,
          color: "text-muted-foreground",
          dotColor: "bg-muted-foreground",
          headerColor: "text-muted-foreground",
        };
        return (
          <div key={stage} className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
              <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">No triggers</p>
            ) : (
              <ul className="space-y-3">
                {items.map((entry) => (
                  <li key={entry.eventKey}>
                    <p className="text-xs font-medium">{entry.triggerLabel}</p>
                    <p className="mb-1.5 font-mono text-[10px] text-muted-foreground">
                      {entry.eventKey}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {entry.channels.map((ch) => {
                        const suppressed = ch.suppressionEnabled;
                        const delayed = (ch.delayAfterEventEndHours ?? 0) > 0;
                        const customized = ch.isCustomized;
                        return (
                          <span
                            key={ch.channel}
                            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                              suppressed
                                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                                : customized
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {ch.channel === "email" ? (
                              <Mail className="h-2.5 w-2.5" />
                            ) : (
                              <Smartphone className="h-2.5 w-2.5" />
                            )}
                            {ch.channel === "email" ? "Email" : "Push"}
                            {suppressed && <BellOff className="h-2.5 w-2.5" />}
                            {delayed && !suppressed && (
                              <Clock className="h-2.5 w-2.5 text-amber-500" />
                            )}
                            {!suppressed && !delayed && customized && (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {entry.channels.some(
                      (c) => (c.delayAfterEventEndHours ?? 0) > 0
                    ) && (
                      <p className="mt-1 text-[10px] text-amber-600">
                        Sent{" "}
                        {
                          entry.channels.find(
                            (c) => (c.delayAfterEventEndHours ?? 0) > 0
                          )?.delayAfterEventEndHours
                        }
                        h after event ends
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function NotificationTemplatesPanel() {
  const clubId = useRequiredClubId();
  const { user } = useAuth();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [triggerMapEntries, setTriggerMapEntries] = useState<TriggerMapEntry[]>([]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [suppressionEnabled, setSuppressionEnabled] = useState(false);
  const [editorValid, setEditorValid] = useState(true);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | NotificationChannel>("all");
  const [deviceOs, setDeviceOs] = useState<"ios" | "android">("ios");
  const [darkPreview, setDarkPreview] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "trigger-map" | "preferences">(
    "templates"
  );
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  // Mobile master-detail: "browse" shows the template list, "edit" shows the editor
  const [mobileView, setMobileView] = useState<"browse" | "edit">("browse");

  // ── Sync form only when selected ID changes (not on save) ─────────────────
  const syncedIdRef = useRef<string | null>(undefined as unknown as null);

  useEffect(() => {
    if (selectedId === syncedIdRef.current) return;
    syncedIdRef.current = selectedId ?? null;

    if (!selectedId) {
      setSubject("");
      setBody("");
      setSuppressionEnabled(false);
      return;
    }

    const tmpl = templates.find((t) => t.id === selectedId);
    if (!tmpl) return;

    setSubject(tmpl.activeSubject);
    setBody(tmpl.activeBody);
    setSuppressionEnabled(tmpl.suppressionEnabled);
  }, [selectedId, templates]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const templatesRes = await apiClient.listNotificationTemplates(clubId);

      if (templatesRes.success && templatesRes.data) {
        const incoming = templatesRes.data.templates as NotificationTemplateRecord[];
        setTemplates(incoming);
        setLoadError(false);
        setSelectedId((cur) => {
          if (cur && incoming.some((t) => t.id === cur)) return cur;
          return incoming[0]?.id ?? null;
        });
      } else {
        setLoadError(true);
        toast.error(templatesRes.message || "Failed to load notification templates");
      }

      apiClient
        .getNotificationTriggerMap(clubId)
        .then((res) => {
          if (res.success && res.data)
            setTriggerMapEntries(res.data as TriggerMapEntry[]);
        })
        .catch(() => {});
    } catch (err) {
      setLoadError(true);
      toast.error("Failed to load notification templates");
      console.error("[NotificationTemplatesPanel] loadTemplates error:", err);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: templates.length,
      customized: templates.filter((t) => t.isCustomized).length,
      suppressed: templates.filter((t) => t.suppressionEnabled).length,
    }),
    [templates]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!clubId || !selected || !editorValid) return;
    setSaving(true);
    try {
      const res = await apiClient.updateNotificationTemplate(clubId, selected.id, {
        subject,
        body,
        suppressionEnabled,
      });
      if (res.success && res.data) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === (res.data as NotificationTemplateRecord).id
              ? (res.data as NotificationTemplateRecord)
              : t
          )
        );
        toast.success("Template saved");
      } else {
        toast.error(res.message || "Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }, [clubId, selected, editorValid, subject, body, suppressionEnabled]);

  const handleRestore = useCallback(async () => {
    if (!clubId || !selected) return;
    setSaving(true);
    try {
      const res = await apiClient.resetNotificationTemplate(clubId, selected.id);
      if (res.success && res.data) {
        const restored = res.data as NotificationTemplateRecord;
        const undoSnapshot = res.undoSnapshot as UndoSnapshot;

        setTemplates((prev) => prev.map((t) => (t.id === restored.id ? restored : t)));
        syncedIdRef.current = null;
        setSelectedId((cur) => cur);
        setSubject(restored.activeSubject);
        setBody(restored.activeBody);
        setSuppressionEnabled(restored.suppressionEnabled);
        setRestoreOpen(false);

        toast.success("Template restored to default", {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: async () => {
              if (!undoSnapshot) return;
              const undoRes = await apiClient.undoResetNotificationTemplate(
                clubId,
                selected.id,
                undoSnapshot
              );
              if (undoRes.success && undoRes.data) {
                const undone = undoRes.data as NotificationTemplateRecord;
                setTemplates((prev) => prev.map((t) => (t.id === undone.id ? undone : t)));
                syncedIdRef.current = null;
                setSubject(undone.activeSubject);
                setBody(undone.activeBody);
                setSuppressionEnabled(undone.suppressionEnabled);
                toast.message("Restore undone");
              }
            },
          },
        });
      } else {
        toast.error(res.message || "Failed to restore template");
      }
    } catch {
      toast.error("Failed to restore template");
    } finally {
      setSaving(false);
    }
  }, [clubId, selected]);

  const handleGlobalReset = useCallback(async () => {
    if (!clubId || user?.role !== "system_owner") return;
    if (
      !confirm(
        "Force-reset ALL notification templates for this club to system defaults?"
      )
    )
      return;
    try {
      const res = await apiClient.globalResetNotificationTemplates(clubId);
      if (res.success && res.data) {
        const incoming = (
          res.data as { resetCount: number; templates: NotificationTemplateRecord[] }
        ).templates;
        setTemplates(incoming);
        syncedIdRef.current = null;
        toast.success(`Reset ${(res.data as any).resetCount} template(s)`);
      } else {
        toast.error(res.message || "Global reset failed");
      }
    } catch {
      toast.error("Global reset failed");
    }
  }, [clubId, user?.role]);

  const handleMobileSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("edit");
  }, []);

  const insertFromSidebar = useCallback(
    (placeholder: string) => {
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
    },
    [body]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!clubId || loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Loading templates…</p>
      </div>
    );
  }

  if (loadError && templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="font-medium">Failed to load templates</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check that the backend is running and try again.
          </p>
        </div>
        <Button variant="outline" onClick={loadTemplates}>
          Retry
        </Button>
      </div>
    );
  }

  const previewNode = selected ? (
    <NotificationTemplatePreview
      channel={selected.channel}
      subject={subject}
      body={body}
      deviceOs={deviceOs}
      onDeviceOsChange={setDeviceOs}
      darkPreview={darkPreview}
      onDarkPreviewChange={setDarkPreview}
    />
  ) : null;

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-4.5 w-4.5 h-[18px] w-[18px] text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Message Templates</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Customize email and push notification copy for your club.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {templates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
                {stats.total} templates
              </span>
              {stats.customized > 0 && (
                <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {stats.customized} customized
                </span>
              )}
              {stats.suppressed > 0 && (
                <span className="rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  {stats.suppressed} suppressed
                </span>
              )}
            </div>
          )}
          {user?.role === "system_owner" && (
            <Button variant="destructive" size="sm" onClick={handleGlobalReset}>
              Global reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="templates" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Edit Templates
          </TabsTrigger>
          <TabsTrigger value="trigger-map" className="gap-1.5">
            <Map className="h-3.5 w-3.5" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* ── Mapping Overview ─────────────────────────────────────────── */}
        <TabsContent value="trigger-map" className="mt-6">
          <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Customized
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              System default
            </span>
            <span className="flex items-center gap-1.5">
              <BellOff className="h-3.5 w-3.5 text-destructive" />
              Suppressed
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Time-delayed
            </span>
          </div>
          {triggerMapEntries.length > 0 ? (
            <TriggerMapOverview entries={triggerMapEntries} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Map className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No trigger mappings found.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <TabsContent value="preferences" className="mt-6">
          <AppSettingsTab key={clubId ?? "no-club"} />
        </TabsContent>

        {/* ── Edit Templates ─────────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr_296px]">

            {/* Left: Template browser — full screen on mobile browse, sidebar on lg+ */}
            <div
              className={`flex-col rounded-xl border bg-card p-3 h-[calc(100vh-13rem)] lg:h-[calc(100vh-18rem)] lg:sticky lg:top-20 ${
                mobileView === "edit" ? "hidden lg:flex" : "flex"
              }`}
            >
              <p className="mb-3 px-1 text-sm font-semibold">Templates</p>
              <TemplateBrowser
                templates={templates}
                selectedId={selectedId}
                onSelect={handleMobileSelect}
                channelFilter={channelFilter}
                onChannelFilter={setChannelFilter}
              />
            </div>

            {/* Center: Editor — hidden on mobile browse, full screen on mobile edit */}
            <div className={mobileView === "browse" ? "hidden lg:block" : "block"}>

              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => setMobileView("browse")}
                className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
                All templates
              </button>

            {selected ? (
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          selected.channel === "email"
                            ? "bg-blue-100 dark:bg-blue-950/40"
                            : "bg-purple-100 dark:bg-purple-950/40"
                        }`}
                      >
                        {selected.channel === "email" ? (
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {selected.triggerLabel}
                        </CardTitle>
                        <CardDescription className="mt-0.5 flex flex-wrap items-center gap-2">
                          {selected.channel === "email"
                            ? "Email template"
                            : "Push notification"}
                          {(selected.delayAfterEventEndHours ?? 0) > 0 && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="h-3 w-3" />
                                +{selected.delayAfterEventEndHours}h delay
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Preview sheet (hidden on xl) */}
                    <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="xl:hidden"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-full overflow-y-auto sm:max-w-sm"
                      >
                        <SheetHeader className="mb-6">
                          <SheetTitle>Live Preview</SheetTitle>
                        </SheetHeader>
                        {previewNode}
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-5">
                  {/* System-default info banner */}
                  {!selected.isCustomized && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Using{" "}
                        <strong>Wingman Pro Master Template</strong> (system
                        default). Edit and save to customize for your club.
                      </span>
                    </div>
                  )}

                  {/* Suppression toggle */}
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3.5 transition-colors ${
                      suppressionEnabled
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          suppressionEnabled ? "bg-destructive/10" : "bg-background"
                        }`}
                      >
                        <BellOff
                          className={`h-4 w-4 ${
                            suppressionEnabled
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="suppression-toggle"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Suppress this notification
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Disable without deleting the template.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="suppression-toggle"
                      checked={suppressionEnabled}
                      onCheckedChange={setSuppressionEnabled}
                    />
                  </div>

                  {suppressionEnabled && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Members will <strong>not</strong> receive this
                        notification until suppression is turned off.
                      </span>
                    </div>
                  )}

                  {/* Template editor */}
                  <NotificationTemplateEditor
                    channel={selected.channel}
                    subject={subject}
                    body={body}
                    onSubjectChange={setSubject}
                    onBodyChange={setBody}
                    onValidationChange={setEditorValid}
                  />

                  {/* System default reference (only when customized) */}
                  {selected.isCustomized && (
                    <details className="rounded-lg border">
                      <summary className="cursor-pointer select-none px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                        View system default (reference)
                      </summary>
                      <div className="border-t bg-muted/20 px-3.5 py-3 text-xs">
                        {selected.channel === "email" && (
                          <p className="mb-1.5 font-medium text-muted-foreground">
                            Subject: {selected.defaultSubject}
                          </p>
                        )}
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground">
                          {selected.defaultBody}
                        </pre>
                      </div>
                    </details>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRestoreOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Restore default
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!editorValid || saving}
                    onClick={handleSave}
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex items-center justify-center rounded-xl border bg-muted/10 lg:col-span-1">
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Select a template to edit
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Choose from the list on the left
                  </p>
                </div>
              </div>
            )}
            </div>{/* end editor column */}

            {/* Right: Live preview (xl+ only) */}
            <div className="hidden xl:block xl:sticky xl:top-20 xl:self-start">
              {previewNode}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Restore confirmation dialog */}
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore to default?</DialogTitle>
            <DialogDescription>
              This will delete your custom text and revert to the Wingman Pro
              Master Template. You can undo for 5 seconds after the restore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={handleRestore}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
