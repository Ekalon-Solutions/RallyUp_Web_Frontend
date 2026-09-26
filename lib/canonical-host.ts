/**
 * The single host search engines are allowed to index. Every other host the app
 * answers on (Vercel deployment URLs, preview builds, staging, raw IPs) serves
 * the same pages, so without this they get crawled and ranked as a duplicate
 * site.
 */
export const CANONICAL_HOST = 'wingman-pro.com'

export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`

/** Hosts that are the real site — everything else is a deploy/preview URL. */
const CANONICAL_HOSTS = new Set([CANONICAL_HOST, `www.${CANONICAL_HOST}`])

/** Strip the port and normalise, e.g. "Wingman-Pro.com:3000" → "wingman-pro.com". */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').split(':')[0]?.trim().toLowerCase() ?? ''
}

export function isCanonicalHost(host: string | null | undefined): boolean {
  return CANONICAL_HOSTS.has(normalizeHost(host))
}
