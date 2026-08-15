export type PermissionAccessType = 'view' | 'edit';

export type ModulePermission = {
  view: boolean;
  edit: boolean;
};

export type PermissionMatrixMap = Record<string, ModulePermission>;

export const FINANCE_REQUIRES_REPORTING_CODE = 'FINANCE_REQUIRES_REPORTING';

export const PERMISSION_MATRIX_CATEGORIES = [
  'General',
  'Members',
  'Events',
  'Marketing',
  'Store',
  'Finance',
  'Administration',
] as const;

export type MatrixModuleDef = {
  id: string;
  label: string;
  category: string;
  navHref?: string;
};

/** Maps every admin nav href to its permission module ID. Hrefs not in this map have no permission gate (always visible). */
export const NAV_HREF_TO_PERMISSION_MODULE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/members': 'members',
  '/dashboard/events': 'events',
  '/dashboard/gallery': 'gallery',
  '/dashboard/content': 'news',
  '/dashboard/merchandise': 'merchandise',
  '/dashboard/external-ticketing': 'externalTicketing',
  '/dashboard/chants': 'chants',
  '/dashboard/polls': 'polls',
  '/dashboard/orders': 'orders',
  '/dashboard/logistics': 'orders',
  '/dashboard/leaderboard': 'leaderboard',
  '/dashboard/coupons': 'coupons',
  '/dashboard/website': 'website',
  '/dashboard/admin/refunds': 'refunds',
  '/dashboard/volunteer-management': 'volunteerManagement',
  '/dashboard/membership-plans': 'membershipPlans',
  '/dashboard/membership-cards': 'membershipCards',
  '/dashboard/admin-settings': 'adminSettings',
  '/dashboard/events/scanner': 'eventScanner',
  '/dashboard/quick-scanner': 'eventScanner',
  '/dashboard/reports': 'reporting',
  '/dashboard/vendor-reports': 'vendorReports',
};

/** Longest matching nav href for nested admin routes (e.g. /dashboard/events/123). */
export function permissionModuleForPath(pathname: string | null | undefined): string | undefined {
  if (!pathname) return undefined
  const exact = NAV_HREF_TO_PERMISSION_MODULE[pathname]
  if (exact) return exact
  const match = Object.keys(NAV_HREF_TO_PERMISSION_MODULE)
    .filter((href) => href !== '/dashboard' && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]
  return match ? NAV_HREF_TO_PERMISSION_MODULE[match] : undefined
}

/**
 * Maps each permission module ID to the club feature key that must be enabled
 * for that module to appear in the permission matrix editor.
 * null = always present (core module, no billing gate).
 */
export const PERMISSION_MODULE_TO_FEATURE_KEY: Record<string, string | null> = {
  dashboard: null,
  members: null,
  events: 'events',
  gallery: 'gallery',
  externalTicketing: 'external_ticketing',
  news: 'news',
  polls: 'polls',
  chants: 'chants',
  website: 'website',
  merchandise: 'merchandise',
  orders: 'merchandise',
  storeFulfillment: 'merchandise',
  coupons: 'coupons',
  refunds: 'refunds',
  reporting: 'reporting',
  leaderboard: 'leaderboard',
  membershipPlans: 'membership',
  membershipCards: 'membership',
  volunteerManagement: 'volunteer',
  adminSettings: null,
  elevateAdmins: null,
  eventScanner: 'events',
  vendorReports: 'events',
};
