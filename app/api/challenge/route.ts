import { NextRequest, NextResponse } from 'next/server'
import { randomInt, randomUUID } from 'crypto'
import { signValue, verifyValue, VERIFIED_COOKIE } from '@/lib/verified-cookie'

function secret(): string {
  const value = process.env.CHALLENGE_COOKIE_SECRET?.trim()
  if (!value) throw new Error('CHALLENGE_COOKIE_SECRET is not configured')
  return value
}

export async function GET() {
  try {
    const left = randomInt(1, 11)
    const right = randomInt(1, 11)
    const expiresAt = Date.now() + 5 * 60 * 1000
    const payload = `v1:${expiresAt}:${left}:${right}:${randomUUID()}`
    return NextResponse.json({ challenge: `${left} + ${right}`, token: await signValue(payload, secret()) })
  } catch {
    return NextResponse.json({ message: 'Challenge service is not configured' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, answer } = await request.json() as { token?: string; answer?: unknown }
    const payload = await verifyValue(token, secret())
    if (!payload) return NextResponse.json({ message: 'Invalid challenge' }, { status: 400 })
    const [version, expiresAt, left, right] = payload.split(':')
    if (version !== 'v1' || Number(expiresAt) <= Date.now() || Number(answer) !== Number(left) + Number(right)) {
      return NextResponse.json({ message: 'Incorrect or expired challenge' }, { status: 400 })
    }

    const cookieExpiresAt = Date.now() + 60 * 60 * 1000
    const cookieValue = await signValue(`v1:${cookieExpiresAt}:${randomUUID()}`, secret())
    const response = NextResponse.json({ success: true })
    response.cookies.set(VERIFIED_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60,
    })
    return response
  } catch {
    return NextResponse.json({ message: 'Challenge verification failed' }, { status: 400 })
  }
}
