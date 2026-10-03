export interface DistributedLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
  configured: boolean
}

const SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return {count, ttl}
`.trim()

export async function checkDistributedRateLimit(
  key: string,
  windowMs: number,
  limit: number,
): Promise<DistributedLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return { allowed: process.env.NODE_ENV !== 'production', remaining: limit, retryAfterMs: windowMs, configured: false }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', SCRIPT, '1', key, String(windowMs)]),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Redis returned ${response.status}`)
    const body = await response.json() as { result?: [number, number] }
    const count = Number(body.result?.[0] ?? limit + 1)
    const ttl = Math.max(0, Number(body.result?.[1] ?? windowMs))
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterMs: ttl,
      configured: true,
    }
  } catch (error) {
    console.error('[rate-limit] Distributed store unavailable:', error)
    return { allowed: false, remaining: 0, retryAfterMs: windowMs, configured: true }
  }
}
