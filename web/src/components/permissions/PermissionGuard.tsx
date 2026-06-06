import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/utils/permissions';

interface PermissionGuardProps {
  /**
   * Single permission required to render children
   */
  permission?: string;

  /**
   * Array of permissions - at least one must be present (OR logic)
   */
  anyPermissions?: string[];

  /**
   * Array of permissions - all must be present (AND logic)
   */
  allPermissions?: string[];

  /**
   * Content to render when user has required permissions
   */
  children: ReactNode;

  /**
   * Optional fallback content to render when user lacks permissions
   */
  fallback?: ReactNode;
}

/**
 * PermissionGuard component for conditional rendering based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGuard permission="users:create">
 *   <Button>{t('permissionGuard.createUser')}</Button>
 * </PermissionGuard>
 *
 * @example
 * // Any of multiple permissions (OR logic)
 * <PermissionGuard anyPermissions={["users:create", "users:update"]}>
 *   <Button>{t('permissionGuard.modifyUser')}</Button>
 * </PermissionGuard>
 *
 * @example
 * // All permissions required (AND logic)
 * <PermissionGuard allPermissions={["users:read", "roles:read"]}>
 *   <UserRoleManager />
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard
 *   permission="admin:access"
 *   fallback={<Text>{t('permissionGuard.accessDenied')}</Text>}
 * >
 *   <AdminPanel />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  // Use permissions array from JWT if available, otherwise fall back to roles-based check
  const userPermissions = user?.permissions;
  const roles = user?.roles;

  // Admin role bypass — Admin users have full access
  const isAdmin = roles?.some((role) =>
    typeof role === 'string' ? role === t('permissionGuard.adminRole') : role.name === t('permissionGuard.adminRole'),
  );
  if (isAdmin) return <>{children}</>;

  let hasRequiredPermission = false;

  if (permission) {
    // Check permissions array first (from JWT), then fall back to roles
    if (userPermissions) {
      hasRequiredPermission = userPermissions.includes(permission);
    } else {
      hasRequiredPermission = hasPermission(roles, permission);
    }
  } else if (anyPermissions) {
    // Check if user has any of the required permissions
    if (userPermissions) {
      hasRequiredPermission = anyPermissions.some((p) => userPermissions.includes(p));
    } else {
      hasRequiredPermission = hasAnyPermission(roles, anyPermissions);
    }
  } else if (allPermissions) {
    // Check if user has all required permissions
    if (userPermissions) {
      hasRequiredPermission = allPermissions.every((p) => userPermissions.includes(p));
    } else {
      hasRequiredPermission = hasAllPermissions(roles, allPermissions);
    }
  } else {
    // If no permission checks specified, render children
    hasRequiredPermission = true;
  }

  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
}