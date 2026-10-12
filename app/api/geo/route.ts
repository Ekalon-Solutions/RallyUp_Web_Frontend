import { NextRequest, NextResponse } from "next/server"

// The backend is called straight from the browser, so it never sees Vercel's
// geo header. Expose it here so the currency session can forward it.
export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country")
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } })
}
