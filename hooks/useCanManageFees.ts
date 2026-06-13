'use client';

import { useAdminModulePermission } from '@/hooks/useAdminModulePermission';

/**
 * Whether the current admin may set/modify an event's fee-absorption setting.
 *
 * Mirrors the backend `adminHasFinancialAccess` gate: Primary Owners
 * (super_admin / system_owner) always qualify, as do Financial Admins — admins
 * with access to a Finance-category module (Refunds or Reporting). Sub-admins
 * and vendor/venue roles without finance access do not qualify.
 *
 * `useAdminModulePermission` already grants full access to super_admin /
 * system_owner and to legacy admins with no club contexts, so combining the
 * two finance modules is sufficient.
 */
export function useCanManageFees(): boolean {
  const refunds = useAdminModulePermission('refunds');
  const reporting = useAdminModulePermission('reporting');

  return (
    refunds.canView ||
    refunds.canEdit ||
    reporting.canView ||
    reporting.canEdit
  );
}
