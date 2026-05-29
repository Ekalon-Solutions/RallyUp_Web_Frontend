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
