# RallyUp Website Frontend

## Required production security configuration

- `CHALLENGE_COOKIE_SECRET`: long random HMAC key for the HttpOnly browser-verification cookie.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: recommended shared Redis REST credentials for edge rate limiting. When unavailable, the app uses a per-instance in-memory fallback so valid traffic is not locked out.
