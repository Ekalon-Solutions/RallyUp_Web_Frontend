'use client';

import { useAuth } from '@/contexts/auth-context';
import type { AdminClubContext } from '@/lib/api';

export type ModuleAccess = {
  canView: boolean;
  canEdit: boolean;
};

function resolveMatrix(ctx: AdminClubContext): Record<string, { view: boolean; edit: boolean }> {
  if (ctx.permissionsMatrix) return ctx.permissionsMatrix;
  if (ctx.permissions?._matrix) return ctx.permissions._matrix;
  return {};
}

/**
 * Returns view/edit access for a given permission module ID based on the
 * current admin's clubAdminContexts for the active club.
 *
 * super_admin and system_owner always get full access.
 * Legacy admins with no clubAdminContexts get full access (backward compat).
 */
export function useAdminModulePermission(moduleId: string): ModuleAccess {
  const { user, activeClubId } = useAuth();

  if (!user) return { canView: false, canEdit: false };

  if (user.role === 'super_admin' || user.role === 'system_owner') {
    return { canView: true, canEdit: true };
  }

  if (user.role !== 'admin') {
    return { canView: false, canEdit: false };
  }

  const contexts = (user as any).clubAdminContexts as AdminClubContext[] | undefined;

  if (!contexts || contexts.length === 0) {
    return { canView: true, canEdit: true };
  }

  const ctx = contexts.find(
    (c) => c?.clubId && String(c.clubId) === String(activeClubId)
  );

  if (!ctx) return { canView: false, canEdit: false };

  const matrix = resolveMatrix(ctx);
  const cell = matrix[moduleId] ?? { view: false, edit: false };

  return {
    canView: Boolean(cell.view),
    canEdit: Boolean(cell.edit),
  };
}
