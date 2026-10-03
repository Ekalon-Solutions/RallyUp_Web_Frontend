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
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`.trim()

interface LocalLimitRecord {
  count: number
  resetTime: number
}

// Keep the fallback alive across Next.js hot reloads and warm edge invocations.
// It also keeps the site available when Redis is missing or temporarily down;
// Redis remains the distributed source of truth whenever it is configured.
const globalRateLimit = globalThis as typeof globalThis & {
  __rallyUpRateLimitStore?: Map<string, LocalLimitRecord>
}
const localStore = globalRateLimit.__rallyUpRateLimitStore ?? new Map<string, LocalLimitRecord>()
globalRateLimit.__rallyUpRateLimitStore = localStore
const MAX_LOCAL_KEYS = 10_000

function makeRoomInLocalStore(now: number): void {
  if (localStore.size < MAX_LOCAL_KEYS) return

  for (const [storedKey, record] of localStore) {
    if (record.resetTime <= now) localStore.delete(storedKey)
  }

  while (localStore.size >= MAX_LOCAL_KEYS) {
    const oldestKey = localStore.keys().next().value as string | undefined
    if (!oldestKey) break
    localStore.delete(oldestKey)
  }
}

function checkLocalRateLimit(
  key: string,
  windowMs: number,
  limit: number,
): DistributedLimitResult {
  const now = Date.now()
  const current = localStore.get(key)
  if (!current) makeRoomInLocalStore(now)
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
    return checkLocalRateLimit(key, windowMs, limit)
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
    return checkLocalRateLimit(key, windowMs, limit)
  }
}
