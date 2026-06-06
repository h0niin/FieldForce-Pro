import type { Role } from '@/types/models';

export function hasPermission(roles: Role[] | undefined, permission: string): boolean {
  if (!roles) return false;
  return roles.some((role) => role.permissions?.some((p) => p.name === permission) ?? false);
}

export function hasAnyPermission(roles: Role[] | undefined, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(roles, p));
}

export function hasAllPermissions(roles: Role[] | undefined, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(roles, p));
}
