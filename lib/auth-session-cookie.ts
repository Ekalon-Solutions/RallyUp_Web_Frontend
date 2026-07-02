export const AUTH_SESSION_COOKIE = 'auth_session'

const AUTH_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function setAuthSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${AUTH_SESSION_MAX_AGE_SEC}; SameSite=Lax`
}

export function clearAuthSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function syncAuthSessionCookieFromStorage(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('token')) {
    setAuthSessionCookie()
  } else {
    clearAuthSessionCookie()
  }
}
