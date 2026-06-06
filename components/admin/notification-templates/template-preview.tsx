"use client";

import React, { useDeferredValue, useMemo } from "react";
import {
  CHANNEL_CHAR_LIMITS,
  QR_PREVIEW_SENTINEL,
  findSyntaxIssues,
  mapSampleVariables,
  type NotificationChannel,
} from "@/lib/notification-template-utils";
import { Mail, Sun, Moon, Wifi, Battery, Signal } from "lucide-react";

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

type TextTone = "normal" | "error" | "unknown" | "privacy";

function highlightInvalidTokens(text: string): { text: string; tone: TextTone }[] {
  const issues = findSyntaxIssues(text);
  if (!issues.length) return [{ text, tone: "normal" }];

  const parts: { text: string; tone: TextTone }[] = [];
  let cursor = 0;
  for (const issue of issues) {
    if (issue.start > cursor)
      parts.push({ text: text.slice(cursor, issue.start), tone: "normal" });
    parts.push({
      text: text.slice(issue.start, issue.end),
      tone: issue.kind === "privacy" ? "privacy" : issue.kind === "unknown" ? "unknown" : "error",
    });
    cursor = issue.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), tone: "normal" });
  return parts;
}

function HighlightedText({
  parts,
  overflow,
}: {
  parts: { text: string; tone: TextTone }[];
  overflow?: string;
}) {
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={
            p.tone === "error"
              ? "rounded-sm bg-red-500/30 ring-1 ring-inset ring-red-400/40"
              : p.tone === "unknown"
              ? "rounded-sm bg-yellow-400/40 ring-1 ring-inset ring-yellow-400/40"
              : p.tone === "privacy"
              ? "rounded-sm bg-orange-400/35 ring-1 ring-inset ring-orange-400/40"
              : undefined
          }
        >
          {p.text}
        </span>
      ))}
      {overflow && (
        <span className="rounded-sm bg-red-500/30 ring-1 ring-inset ring-red-400/40">
          {overflow}
        </span>
      )}
    </>
  );
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

  const subjectOverflow =
    mappedSubject.length > subjectLimit
      ? mappedSubject.slice(subjectLimit)
      : "";
  const bodyOverflow =
    mappedBody.length > bodyLimit ? mappedBody.slice(bodyLimit) : "";

  const hasOverflow =
    mappedBody.length > bodyLimit ||
    (!!limits.subject && mappedSubject.length > subjectLimit);

  const dark = darkPreview;

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Live Preview</p>
        {/* Light/Dark toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => onDarkPreviewChange(false)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              !dark
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="h-3 w-3" />
            Light
          </button>
          <button
            type="button"
            onClick={() => onDarkPreviewChange(true)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              dark
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="h-3 w-3" />
            Dark
          </button>
        </div>
      </div>

      {/* OS toggle */}
      <div className="flex gap-1.5">
        {(["ios", "android"] as const).map((os) => (
          <button
            key={os}
            type="button"
            onClick={() => onDeviceOsChange(os)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              deviceOs === os
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {os === "ios" ? "iOS" : "Android"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div
        className={`mx-auto w-full max-w-[264px] overflow-hidden rounded-[36px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] ${
          dark
            ? "border-[7px] border-zinc-700 bg-zinc-900"
            : "border-[7px] border-zinc-200 bg-zinc-50"
        }`}
      >
        {/* Status bar */}
        <div
          className={`flex items-center justify-between px-4 pb-1 pt-2 text-[10px] font-semibold ${
            dark ? "text-zinc-300" : "text-zinc-800"
          }`}
        >
          <span>9:41</span>
          {deviceOs === "ios" ? (
            <div
              className={`h-4 w-[52px] rounded-full ${dark ? "bg-zinc-800" : "bg-zinc-900"}`}
            />
          ) : (
            <div
              className={`h-2 w-2 rounded-full border ${dark ? "border-zinc-600 bg-zinc-800" : "border-zinc-400 bg-zinc-300"}`}
            />
          )}
          <div className={`flex items-center gap-0.5 ${dark ? "text-zinc-400" : "text-zinc-600"}`}>
            <Signal className="h-2.5 w-2.5" />
            <Wifi className="h-2.5 w-2.5" />
            <Battery className="h-3 w-3" />
          </div>
        </div>

        {/* Screen content */}
        <div className="px-2.5 pb-5 pt-1">
          {channel === "email" ? (
            /* ── Email: inbox-style ──────────────────────────────────────── */
            <div
              className={`overflow-hidden rounded-2xl border ${
                dark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white"
              }`}
            >
              {/* App bar */}
              <div
                className={`flex items-center gap-2 border-b px-3 py-2 ${
                  dark ? "border-zinc-700" : "border-zinc-100"
                }`}
              >
                <Mail className={`h-3.5 w-3.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`} />
                <span
                  className={`text-[10px] font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {deviceOs === "ios" ? "Apple Mail" : "Gmail"}
                </span>
              </div>

              <div className="p-3">
                {/* Sender */}
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    W
                  </div>
                  <span className={`text-[10px] font-medium ${dark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Wingman Pro
                  </span>
                  <span className={`ml-auto text-[9px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
                    now
                  </span>
                </div>
                {/* Subject */}
                <p
                  className={`mb-2 text-xs font-semibold leading-snug ${
                    dark ? "text-zinc-100" : "text-zinc-900"
                  }`}
                >
                  <HighlightedText
                    parts={subjectParts}
                    overflow={subjectOverflow}
                  />
                </p>
                {/* Body — split on QR sentinel to render inline QR image */}
                <div className={`text-[11px] leading-relaxed ${dark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {mappedBody.split(QR_PREVIEW_SENTINEL).map((seg, idx, arr) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <div className="my-2 flex flex-col items-center gap-0.5">
                          <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=TKT-48291"
                            alt="QR Code"
                            width={64}
                            height={64}
                            className="rounded"
                          />
                          <span className={`text-[8px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
                            Scan at venue entrance
                          </span>
                        </div>
                      )}
                      {seg && (
                        <p className="whitespace-pre-wrap m-0">
                          <HighlightedText
                            parts={highlightInvalidTokens(seg)}
                            overflow={idx === arr.length - 1 ? bodyOverflow : ""}
                          />
                        </p>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Email footer — mirrors getLayout() in emailService.ts */}
              <div
                className={`border-t px-3 py-2.5 text-center ${
                  dark ? "border-zinc-700" : "border-zinc-100"
                }`}
              >
                <p className={`text-[8.5px] leading-relaxed ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
                  You received this because you&apos;re a member of the squad.{" "}
                  <span className={`underline ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
                    Manage preferences
                  </span>
                </p>
                <p className={`mt-1 text-[8px] ${dark ? "text-zinc-700" : "text-zinc-300"}`}>
                  Powered by{" "}
                  <span className={`font-semibold ${dark ? "text-sky-600" : "text-sky-400"}`}>
                    Wingman Pro
                  </span>
                  {" · "}© {new Date().getFullYear()} RallyUp Solutions Pvt. Ltd.
                </p>
              </div>
            </div>
          ) : (
            /* ── Push: notification banner ───────────────────────────────── */
            <div
              className={`overflow-hidden rounded-2xl border ${
                dark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white"
              }`}
            >
              {/* App identifier */}
              <div
                className={`flex items-center gap-2 border-b px-3 py-2 ${
                  dark ? "border-zinc-700" : "border-zinc-100"
                }`}
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary text-[8px] font-bold text-primary-foreground">
                  W
                </div>
                <span
                  className={`flex-1 text-[10px] font-semibold ${
                    dark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Wingman Pro
                </span>
                <span className={`text-[9px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
                  now
                </span>
              </div>
              {/* Content */}
              <div className="px-3 py-2.5">
                <p
                  className={`text-xs font-semibold leading-snug ${
                    dark ? "text-zinc-100" : "text-zinc-900"
                  }`}
                >
                  <HighlightedText parts={subjectParts} />
                </p>
                <p
                  className={`mt-1 whitespace-pre-wrap text-[11px] leading-snug ${
                    dark ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  <HighlightedText parts={bodyParts} overflow={bodyOverflow} />
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footnote */}
      <div className="space-y-1 text-center">
        {hasOverflow && (
          <p className="text-[10px] text-destructive">
            Content exceeds limit — red highlights = overflow
          </p>
        )}
      </div>
    </div>
  );
}
