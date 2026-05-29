"use client";

import { useDeferredValue, useMemo } from "react";
import {
  CHANNEL_CHAR_LIMITS,
  findSyntaxIssues,
  mapSampleVariables,
  type NotificationChannel,
} from "@/lib/notification-template-utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Smartphone, Mail, Sun, Moon } from "lucide-react";

type DeviceOs = "ios" | "android";

type Props = {
  channel: NotificationChannel;
  subject: string;
  body: string;
  deviceOs: DeviceOs;
  onDeviceOsChange: (os: DeviceOs) => void;
  darkPreview: boolean;
  onDarkPreviewChange: (dark: boolean) => void;
};

function highlightInvalidTokens(text: string) {
  const issues = findSyntaxIssues(text);
  if (!issues.length) return [{ text, tone: "normal" as const }];

  const parts: { text: string; tone: "normal" | "error" | "unknown" }[] = [];
  let cursor = 0;
  for (const issue of issues) {
    if (issue.start > cursor) parts.push({ text: text.slice(cursor, issue.start), tone: "normal" });
    parts.push({ text: text.slice(issue.start, issue.end), tone: issue.kind === "unknown" ? "unknown" : "error" });
    cursor = issue.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), tone: "normal" });
  return parts;
}

function renderOverflow(text: string, limit: number) {
  if (text.length <= limit) return { visible: text, overflow: "" };
  return { visible: text.slice(0, limit), overflow: text.slice(limit) };
}

export function NotificationTemplatePreview({
  channel,
  subject,
  body,
  deviceOs,
  onDeviceOsChange,
  darkPreview,
  onDarkPreviewChange,
}: Props) {
  const deferredSubject = useDeferredValue(subject);
  const deferredBody = useDeferredValue(body);

  const mappedSubject = useMemo(() => mapSampleVariables(deferredSubject), [deferredSubject]);
  const mappedBody = useMemo(() => mapSampleVariables(deferredBody), [deferredBody]);

  const limits = CHANNEL_CHAR_LIMITS[channel];
  const subjectLimit = limits.subject ?? 65;
  const bodyLimit = limits.body;

  const subjectParts = highlightInvalidTokens(mappedSubject);
  const bodyParts = highlightInvalidTokens(mappedBody);

  const subjectOverflow = renderOverflow(mappedSubject, subjectLimit);
  const bodyOverflow = renderOverflow(mappedBody, bodyLimit);

  const frameClass = darkPreview ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900";
  const cardClass = darkPreview ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200";

  return (
    <div className="sticky top-20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Live Preview</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={deviceOs === "ios" ? "default" : "outline"}
            onClick={() => onDeviceOsChange("ios")}
          >
            iOS
          </Button>
          <Button
            type="button"
            size="sm"
            variant={deviceOs === "android" ? "default" : "outline"}
            onClick={() => onDeviceOsChange("android")}
          >
            Android
          </Button>
          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            <Sun className="h-3.5 w-3.5" />
            <Switch checked={darkPreview} onCheckedChange={onDarkPreviewChange} aria-label="Dark mode preview" />
            <Moon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className={`mx-auto w-full max-w-sm rounded-[2rem] border p-3 shadow-xl ${frameClass}`}>
        <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-black/20" />
        <div className={`rounded-2xl border p-4 ${cardClass}`}>
          {channel === "email" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-4 w-4" />
                Mailbox · {deviceOs === "ios" ? "Apple Mail" : "Gmail"}
              </div>
              <p className="text-sm font-semibold">
                {subjectParts.map((p, i) => (
                  <span
                    key={i}
                    className={
                      p.tone === "error"
                        ? "bg-red-500/30"
                        : p.tone === "unknown"
                          ? "bg-yellow-400/40"
                          : undefined
                    }
                  >
                    {p.text}
                  </span>
                ))}
                {subjectOverflow.overflow && (
                  <span className="bg-red-500/30">{subjectOverflow.overflow}</span>
                )}
              </p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {bodyParts.map((p, i) => (
                  <span
                    key={i}
                    className={
                      p.tone === "error"
                        ? "bg-red-500/30"
                        : p.tone === "unknown"
                          ? "bg-yellow-400/40"
                          : undefined
                    }
                  >
                    {p.text}
                  </span>
                ))}
                {bodyOverflow.overflow && (
                  <span className="bg-red-500/30">{bodyOverflow.overflow}</span>
                )}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Smartphone className="h-4 w-4" />
                Lock screen · {deviceOs === "ios" ? "iOS" : "Android"}
              </div>
              <div className="rounded-xl bg-black/5 p-3 dark:bg-white/10">
                <p className="text-xs font-medium opacity-70">Wingman Pro</p>
                <p className="text-sm font-semibold">
                  {subjectParts.map((p, i) => (
                    <span
                      key={i}
                      className={
                        p.tone === "error"
                          ? "bg-red-500/30"
                          : p.tone === "unknown"
                            ? "bg-yellow-400/40"
                            : undefined
                      }
                    >
                      {p.text}
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-sm leading-snug">
                  {bodyParts.map((p, i) => (
                    <span
                      key={i}
                      className={
                        p.tone === "error"
                          ? "bg-red-500/30"
                          : p.tone === "unknown"
                            ? "bg-yellow-400/40"
                            : undefined
                      }
                    >
                      {p.text}
                    </span>
                  ))}
                  {bodyOverflow.overflow && (
                    <span className="bg-red-500/30">{bodyOverflow.overflow}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Preview uses sample data and updates within ~300ms as you type.
      </p>
    </div>
  );
}
