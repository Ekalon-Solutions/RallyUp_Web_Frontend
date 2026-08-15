"use client"

const CTA_SUFFIX = /\s*\|\s*\[([^,\]]+),\s*(https?:\/\/[^\]]+)\]\s*$/

function splitCta(text: string): { body: string; buttonLabel?: string } {
  const match = text.match(CTA_SUFFIX)
  if (!match) return { body: text.trim() }
  return { body: text.slice(0, match.index).trim(), buttonLabel: match[1].trim() }
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

interface Props {
  body?: string
  headerImageUrl?: string
  clubName?: string
  optOut?: string
}

export function WhatsAppMessagePreview({
  body,
  headerImageUrl,
  clubName,
  optOut,
}: Props) {
  const raw = [body?.trim() || "", optOut?.trim() || ""].filter(Boolean).join("\n")
  const { body: message, buttonLabel } = splitCta(raw || "Select a template to preview the WhatsApp message.")
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
        <div className="ml-0 max-w-[88%] rounded-lg rounded-tl-none bg-white px-2.5 py-2 text-[13px] leading-snug text-[#111b21] shadow-sm">
          {headerImageUrl ? (
            <img
              src={headerImageUrl}
              alt="Template header"
              className="mb-2 h-32 w-full rounded-md object-cover"
            />
          ) : null}
          <p className="whitespace-pre-wrap">{renderHighlighted(message)}</p>
          {buttonLabel ? (
            <div className="mt-2 border-t border-[#e9edef] pt-1.5 text-center text-[13px] font-medium text-[#00a884]">
              {buttonLabel}
            </div>
          ) : null}
          <div className="mt-1 text-right text-[10px] text-[#667781]">{time}</div>
        </div>
      </div>
    </div>
  )
}
