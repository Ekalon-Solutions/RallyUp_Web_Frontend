# RallyUp Website Frontend

## Required production security configuration

- `CHALLENGE_COOKIE_SECRET`: long random HMAC key for the HttpOnly browser-verification cookie.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: shared Redis REST credentials used by edge rate limiting. Protected traffic fails closed when this store is unavailable.
