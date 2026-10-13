import { NextRequest, NextResponse } from "next/server"

// The backend is called straight from the browser, so it never sees Vercel's
// geo header. Expose it here so the currency session can forward it.
export async function GET(req: NextRequest) {
  let country = req.headers.get("x-vercel-ip-country")

  // Local dev has no Vercel header; the dev server shares the browser's public
  // IP (VPN included), so ask an IP lookup for it. Never in production: there
  // the server's IP is Vercel's datacenter, not the visitor's.
  if (!country && process.env.NODE_ENV !== "production") {
    country = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(3000), cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.country || null)
      .catch(() => null)
  }

  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } })
}
