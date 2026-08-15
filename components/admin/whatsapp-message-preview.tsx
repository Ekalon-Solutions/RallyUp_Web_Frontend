"use client"

import { ExternalLink, Phone, Reply } from "lucide-react"
import type { WhatsAppTemplateButton } from "@/lib/api"
import { resolveUrlButtonHref } from "@/lib/whatsapp-template-mapping"

const CTA_SUFFIX = /\s*\|\s*\[([^,\]]+),\s*(https?:\/\/[^\]]+)\]\s*$/

function splitCta(text: string): { body: string; buttonLabel?: string; buttonUrl?: string } {
  const match = text.match(CTA_SUFFIX)
  if (!match) return { body: text.trim() }
  return {
    body: text.slice(0, match.index).trim(),
    buttonLabel: match[1].trim(),
    buttonUrl: match[2].trim(),
  }
}

function renderHighlighted(text: string) {
  const parts = text.split(/(\{\{\s*\d+\s*\}\})/g)
  return parts.map((part, index) => {
    if (/^\{\{\s*\d+\s*\}\}$/.test(part)) {
      return (
        <span
          key={`${part}-${index}`}
          className="rounded bg-amber-100 px-0.5 font-medium text-amber-800"
        >
          {part}
        </span>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function buttonIcon(type: string) {
  if (type === "URL") return <ExternalLink className="h-3.5 w-3.5" />
  if (type === "PHONE_NUMBER") return <Phone className="h-3.5 w-3.5" />
  return <Reply className="h-3.5 w-3.5" />
}

interface Props {
  body?: string
  headerImageUrl?: string
  clubName?: string
  footer?: string
  buttons?: WhatsAppTemplateButton[]
  buttonUrls?: Record<string, string>
}

export function WhatsAppMessagePreview({
  body,
  headerImageUrl,
  clubName,
  footer,
  buttons,
  buttonUrls,
}: Props) {
  const parsed = splitCta(body?.trim() || "Select a template to preview the WhatsApp message.")
  const message = parsed.body
  const previewButtons: WhatsAppTemplateButton[] =
    buttons && buttons.length > 0
      ? buttons
      : parsed.buttonLabel
        ? [{ type: "URL", text: parsed.buttonLabel, url: parsed.buttonUrl, index: 0, urlIndex: 0 }]
        : []
  const time = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })

  return (
    <div className="overflow-hidden rounded-xl border border-[#d1d7db] shadow-sm">
      <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
          {(clubName || "WA").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{clubName || "Club WhatsApp"}</div>
          <div className="text-[10px] text-white/70">Business account</div>
        </div>
      </div>
      <div
        className="min-h-[240px] space-y-2 p-3"
        style={{
          backgroundColor: "#ece5dd",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      >
        <div className="ml-0 max-w-[88%] overflow-hidden rounded-lg rounded-tl-none bg-white text-[13px] leading-snug text-[#111b21] shadow-sm">
          {headerImageUrl ? (
            <img
              src={headerImageUrl}
              alt="Template header"
              className="h-32 w-full object-cover"
            />
          ) : null}
          <div className="px-2.5 py-2">
            <p className="whitespace-pre-wrap">{renderHighlighted(message)}</p>
            {footer ? (
              <p className="mt-2 text-[11px] text-[#667781]">{footer}</p>
            ) : null}
            <div className="mt-1 text-right text-[10px] text-[#667781]">{time}</div>
          </div>
          {previewButtons.length > 0 ? (
            <div className="border-t border-[#e9edef]">
              {previewButtons.map((button) => {
                const href =
                  button.type === "URL"
                    ? resolveUrlButtonHref(
                        button.url,
                        button.urlIndex != null
                          ? buttonUrls?.[String(button.urlIndex)]
                          : buttonUrls?.[String(button.index)]
                      )
                    : undefined
                return (
                  <div
                    key={`${button.index}-${button.text}`}
                    className="flex items-center justify-center gap-1.5 border-t border-[#e9edef] px-2 py-2 text-center text-[13px] font-medium text-[#00a884] first:border-t-0"
                    title={href || button.phoneNumber || button.text}
                  >
                    {buttonIcon(button.type)}
                    <span className="truncate">{button.text}</span>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
