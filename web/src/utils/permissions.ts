import type { Role } from '@/types/models.types';

export function hasPermission(
  roles: Role[] | string[] | undefined,
  permission: string,
): boolean {
  if (!roles) return false;

  // If roles is an array of strings, we can't check permissions from it
  // This happens when roles come from JWT as just role names without full objects
  if (roles.length > 0 && typeof roles[0] === 'string') {
    return false;
  }

  return (roles as Role[]).some(
    (role) => role.permissions?.some((p) => p.name === permission) ?? false,
  );
}

export function hasAnyPermission(
  roles: Role[] | string[] | undefined,
  permissions: string[],
): boolean {
  return permissions.some((p) => hasPermission(roles, p));
}

export function hasAllPermissions(
  roles: Role[] | string[] | undefined,
  permissions: string[],
): boolean {
  return permissions.every((p) => hasPermission(roles, p));
}
