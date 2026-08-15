'use client';

import { useAuth } from '@/contexts/auth-context';
import { getModuleAccess, type ModuleAccess } from '@/lib/adminPermissions';

export type { ModuleAccess };

/**
 * Returns view/edit access for a given permission module ID based on the
 * current admin's clubAdminContexts for the active club.
 *
 * super_admin and system_owner always get full access.
 * Legacy admins with no clubAdminContexts get full access (backward compat).
 */
export function useAdminModulePermission(moduleId: string): ModuleAccess {
  const { user, activeClubId } = useAuth();
  return getModuleAccess(user, activeClubId, moduleId);
}
