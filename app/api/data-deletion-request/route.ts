import { NextRequest, NextResponse } from "next/server"
import { dataDeletionRequestSchema } from "@/lib/data-deletion-request-schema"

const SUPPORT_EMAIL = "support@wingmanpro.tech"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function sendSendGrid(params: {
  subject: string
  html: string
  replyTo: { email: string; name: string }
}): Promise<{ ok: true } | { ok: false; reason: "not_configured" | "send_failed" }> {
  const apiKey = process.env.SEND_GRID_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, reason: "not_configured" }
  }

  const fromEmail =
    process.env.SEND_GRID_LOGIN_FROM_EMAIL?.trim() ||
    process.env.SEND_GRID_FROM_EMAIL?.trim() ||
    "noreply@wingmanpro.tech"
  const fromName =
    process.env.SEND_GRID_LOGIN_FROM_NAME?.trim() ||
    process.env.SEND_GRID_FROM_NAME?.trim() ||
    "Wingman Pro"

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: SUPPORT_EMAIL, name: "Wingman Pro Support" }],
        },
      ],
      from: { email: fromEmail, name: fromName },
      reply_to: { email: params.replyTo.email, name: params.replyTo.name },
      subject: params.subject,
      content: [{ type: "text/html", value: params.html }],
    }),
  })

  if (!res.ok) {
    return { ok: false, reason: "send_failed" }
  }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = dataDeletionRequestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { fullName, email, phone, requestType, reasonForDeletion } = parsed.data
    const reasonBlock =
      reasonForDeletion && reasonForDeletion.trim().length > 0
        ? `<p><strong>Reason / feedback:</strong><br/>${escapeHtml(reasonForDeletion.trim()).replace(/\n/g, "<br/>")}</p>`
        : "<p><em>No reason provided.</em></p>"

    const html = `
      <div style="font-family:sans-serif;max-width:560px;line-height:1.5;color:#111;">
        <h2 style="margin:0 0 16px;">Data deletion &amp; privacy request</h2>
        <p>A user submitted the public Wingman Pro data request form.</p>
        <p><strong>Full name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Type of request:</strong> ${escapeHtml(requestType)}</p>
        ${reasonBlock}
        <p style="margin-top:24px;font-size:12px;color:#666;">Submitted at ${escapeHtml(new Date().toISOString())}</p>
      </div>
    `

    const subject = `[Wingman Pro] Data request: ${requestType.slice(0, 60)}`

    const sent = await sendSendGrid({
      subject,
      html,
      replyTo: { email, name: fullName },
    })

    if (!sent.ok) {
      if (sent.reason === "not_configured") {
        return NextResponse.json(
          {
            error:
              "This form cannot send email right now. Please email support@wingmanpro.tech directly with the same details.",
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: "We could not deliver your request. Please try again or email support@wingmanpro.tech." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
