export type PageSection =
  | "public"
  | "group-website"
  | "dashboard"
  | "auth"
  | "purchase"
  | "other"

export const EKALON_URL = "https://ekalonsolutions.com/"

export const PAGE_SECTION_LABELS: Record<PageSection, string> = {
  public: "Public pages",
  "group-website": "Group websites",
  dashboard: "Logged-in app",
  auth: "Authentication",
  purchase: "Purchase flow",
  other: "Other",
}

const PUBLIC_EXACT = new Set([
  "/",
  "/about",
  "/affiliations",
  "/faqs",
  "/contact",
  "/privacy",
  "/child-safety",
  "/delete-account",
  "/terms",
  "/refund",
  "/ppsa",
  "/membership-plans",
  "/events",
  "/merchandise",
  "/challenge",
  "/clubs",
])

const PUBLIC_PREFIXES = ["/notifications/"]

export function getPageSection(pathname: string): PageSection {
  if (pathname.startsWith("/dashboard")) return "dashboard"
  if (pathname.startsWith("/clubs/") && pathname !== "/clubs") return "group-website"
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/system-owner-login"
  ) {
    return "auth"
  }
  if (pathname.startsWith("/purchase/")) return "purchase"
  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return "public"
  }
  return "other"
}

export function pageHasDedicatedFooter(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) return true
  if (/^\/clubs\/[^/]+$/.test(pathname)) return true
  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true
  }
  if (pathname === "/login" || pathname.startsWith("/login?")) return true
  if (pathname === "/system-owner-login") return true
  return false
}
