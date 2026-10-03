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

interface LocalLimitRecord {
  count: number
  resetTime: number
}

// Keep the development fallback alive across Next.js hot reloads. Production
// must use Redis because an in-memory counter is not shared across instances.
const globalRateLimit = globalThis as typeof globalThis & {
  __rallyUpRateLimitStore?: Map<string, LocalLimitRecord>
}
const localStore = globalRateLimit.__rallyUpRateLimitStore ?? new Map<string, LocalLimitRecord>()
globalRateLimit.__rallyUpRateLimitStore = localStore

function checkLocalRateLimit(
  key: string,
  windowMs: number,
  limit: number,
): DistributedLimitResult {
  const now = Date.now()
  const current = localStore.get(key)
  const record = !current || current.resetTime <= now
    ? { count: 0, resetTime: now + windowMs }
    : current

  record.count += 1
  localStore.set(key, record)

  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    retryAfterMs: Math.max(0, record.resetTime - now),
    configured: false,
  }
}

export async function checkDistributedRateLimit(
  key: string,
  windowMs: number,
  limit: number,
): Promise<DistributedLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (process.env.NODE_ENV !== 'production') {
      return checkLocalRateLimit(key, windowMs, limit)
    }
    return { allowed: false, remaining: 0, retryAfterMs: windowMs, configured: false }
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
    if (process.env.NODE_ENV !== 'production') {
      return checkLocalRateLimit(key, windowMs, limit)
    }
    return { allowed: false, remaining: 0, retryAfterMs: windowMs, configured: true }
  }
}
