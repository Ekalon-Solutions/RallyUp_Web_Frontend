"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHANNEL_CHAR_LIMITS,
  COMMON_EMOJIS,
  sanitizePlainText,
  validateTemplateText,
  insertAtCursor,
  buildHighlightedSegments,
  type NotificationChannel,
} from "@/lib/notification-template-utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, AlertCircle, Smile } from "lucide-react";
import { VariableChipInlineBar } from "./variable-chip-sidebar";

type Props = {
  channel: NotificationChannel;
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onValidationChange?: (valid: boolean) => void;
};

export function NotificationTemplateEditor({
  channel,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onValidationChange,
}: Props) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  const limits = CHANNEL_CHAR_LIMITS[channel];
  const sanitizedBody = sanitizePlainText(body);
  const sanitizedSubject = sanitizePlainText(subject);

  const validation = useMemo(
    () =>
      validateTemplateText({
        channel,
        subject: channel === "email" ? sanitizedSubject : undefined,
        body: sanitizedBody,
      }),
    [channel, sanitizedBody, sanitizedSubject]
  );

  useEffect(() => {
    onValidationChange?.(validation.valid);
  }, [validation.valid, onValidationChange]);

  const bodyRemaining = limits.body - sanitizedBody.length;
  const subjectRemaining = limits.subject ? limits.subject - sanitizedSubject.length : null;

  const bodySegments = useMemo(
    () => buildHighlightedSegments(sanitizedBody, validation.syntaxIssues.filter((i) => i.start < sanitizedBody.length)),
    [sanitizedBody, validation.syntaxIssues]
  );

  const insertVariable = useCallback(
    (placeholder: string) => {
      if (activeField === "subject" && channel === "email" && subjectRef.current) {
        const el = subjectRef.current;
        const { next, cursor } = insertAtCursor(subject, placeholder, el.selectionStart ?? subject.length, el.selectionEnd ?? subject.length);
        onSubjectChange(sanitizePlainText(next));
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(cursor, cursor);
        });
        return;
      }

      const el = bodyRef.current;
      const start = el?.selectionStart ?? body.length;
      const end = el?.selectionEnd ?? body.length;
      const { next, cursor } = insertAtCursor(body, placeholder, start, end);
      onBodyChange(sanitizePlainText(next));
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(cursor, cursor);
      });
    },
    [activeField, body, channel, onBodyChange, onSubjectChange, subject]
  );

  const insertEmoji = (emoji: string) => {
    if (activeField === "subject" && channel === "email") {
      onSubjectChange(sanitizePlainText(subject + emoji));
      return;
    }
    onBodyChange(sanitizePlainText(body + emoji));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const placeholder = e.dataTransfer.getData("text/plain");
    if (placeholder.startsWith("{{")) insertVariable(placeholder);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          {validation.compliant ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Compliant
            </span>
          ) : validation.valid ? (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" /> Valid with warnings
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" /> Fix errors to save
            </span>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Smile className="mr-2 h-4 w-4" />
              Emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded p-1 text-lg hover:bg-muted"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {channel === "email" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-subject">Subject</Label>
            <span className={`text-xs ${subjectRemaining !== null && subjectRemaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {subjectRemaining !== null ? `${subjectRemaining} remaining` : null}
            </span>
          </div>
          <Input
            id="template-subject"
            ref={subjectRef}
            value={subject}
            onFocus={() => setActiveField("subject")}
            onChange={(e) => onSubjectChange(sanitizePlainText(e.target.value))}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="template-body">Message</Label>
          <span className={`text-xs ${bodyRemaining < 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {bodyRemaining} characters remaining
          </span>
        </div>

        <div className="relative">
          <div
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 font-mono text-sm leading-5 z-0"
          >
            {bodySegments.map((seg, idx) => (
              <span key={idx} className={seg.className}>
                {seg.text}
              </span>
            ))}
          </div>
          <Textarea
            id="template-body"
            ref={bodyRef}
            value={body}
            rows={12}
            className="relative z-10 max-h-[280px] resize-none overflow-y-auto bg-transparent font-mono text-sm leading-5 text-transparent caret-foreground"
            onFocus={() => setActiveField("body")}
            onChange={(e) => onBodyChange(sanitizePlainText(e.target.value))}
            onScroll={() => {
              if (highlightRef.current && bodyRef.current) {
                highlightRef.current.scrollTop = bodyRef.current.scrollTop;
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          />
        </div>
      </div>

      <VariableChipInlineBar onInsert={insertVariable} />

      {validation.errors.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {validation.errors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { type Props as NotificationTemplateEditorProps };
