import { NextResponse } from 'next/server'

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const team = url.searchParams.get('team')
    const teamId = url.searchParams.get('teamId')
    const leagueId = url.searchParams.get('leagueId')

    if (!team && !teamId) {
      return NextResponse.json({ message: 'Provide `team` or `teamId` query parameter' }, { status: 400 })
    }

    const backendUrl = new URL(`${BACKEND_BASE}/sports/next-matches`)
    if (team) backendUrl.searchParams.set('team', team)
    if (teamId) backendUrl.searchParams.set('teamId', teamId)
    if (leagueId) backendUrl.searchParams.set('leagueId', leagueId)

    const resp = await fetch(backendUrl.toString(), { method: 'GET' })
    const text = await resp.text()
    // Proxy status and body
    return new NextResponse(text, { status: resp.status, headers: { 'content-type': resp.headers.get('content-type') || 'application/json' } })
  } catch (e: any) {
    return NextResponse.json({ message: 'Proxy error', error: String(e) }, { status: 500 })
  }
}
