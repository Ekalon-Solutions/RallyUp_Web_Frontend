export const VERIFIED_COOKIE = 'verified'

const encoder = new TextEncoder()

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function signValue(payload: string, secret: string): Promise<string> {
  return `${payload}.${await hmac(payload, secret)}`
}

export async function verifyValue(value: string | undefined, secret: string): Promise<string | null> {
  if (!value) return null
  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null
  const payload = value.slice(0, separator)
  const supplied = value.slice(separator + 1)
  return safeEqual(await hmac(payload, secret), supplied) ? payload : null
}

export async function verifyBrowserCookie(value: string | undefined, secret: string): Promise<boolean> {
  const payload = await verifyValue(value, secret)
  if (!payload) return false
  const [version, expiresAt] = payload.split(':')
  return version === 'v1' && Number(expiresAt) > Date.now()
}
