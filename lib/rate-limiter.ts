interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    setInterval(() => this.cleanup(), 60000)
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.store.get(identifier)

    if (record?.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockUntil,
      }
    }

    if (!record || now > record.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false,
      })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }

    record.count++

    if (record.count > this.config.maxRequests) {
      record.blocked = true
      record.blockUntil = now + 15 * 60 * 1000
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockUntil,
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime && (!record.blocked || (record.blockUntil && now > record.blockUntil))) {
        this.store.delete(key)
      }
    }
  }

  reset(identifier: string) {
    this.store.delete(identifier)
  }

  block(identifier: string, durationMs: number = 3600000) {
    const now = Date.now()
    this.store.set(identifier, {
      count: 0,
      resetTime: now + durationMs,
      blocked: true,
      blockUntil: now + durationMs,
    })
  }
}

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
})

export const strictRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
})
