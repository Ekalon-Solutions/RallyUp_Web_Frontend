import { checkDistributedRateLimit } from './distributed-rate-limit'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  prefix: string
}

class RateLimiter {
  constructor(private readonly config: RateLimitConfig) {}

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const result = await checkDistributedRateLimit(
      `${this.config.prefix}:${identifier}`,
      this.config.windowMs,
      this.config.maxRequests,
    )
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: Date.now() + result.retryAfterMs,
    }
  }
}

export const apiRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 60, prefix: 'web:api' })
export const strictRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 10, prefix: 'web:strict' })
export const authRateLimiter = new RateLimiter({ windowMs: 15 * 60_000, maxRequests: 5, prefix: 'web:auth' })
