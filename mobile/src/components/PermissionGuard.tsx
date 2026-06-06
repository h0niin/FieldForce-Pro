import React, { type ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
    /** Single permission required to render children */
    permission?: string;
    /** Array of permissions — at least one must be present (OR logic) */
    anyPermissions?: string[];
    /** Array of permissions — all must be present (AND logic) */
    allPermissions?: string[];
    /** Content to render when user has required permissions */
    children: ReactNode;
    /** Optional fallback content to render when user lacks permissions */
    fallback?: ReactNode;
}

/**
 * PermissionGuard component for conditional rendering based on user permissions.
 * Mirrors the web's PermissionGuard pattern.
 *
 * @example
 * <PermissionGuard permission="users:create">
 *   <Button title="Create User" onPress={handleCreate} />
 * </PermissionGuard>
 */
export default function PermissionGuard({
    permission,
    anyPermissions,
    allPermissions,
    children,
    fallback = null,
}: PermissionGuardProps) {
    const { can, canAny, canAll, isAdmin } = usePermission();

    // Admin role bypass
    if (isAdmin) return <>{children}</>;

    let hasRequiredPermission = false;

    if (permission) {
        hasRequiredPermission = can(permission);
    } else if (anyPermissions) {
        hasRequiredPermission = canAny(anyPermissions);
    } else if (allPermissions) {
        hasRequiredPermission = canAll(allPermissions);
    } else {
        // If no permission checks specified, render children
        hasRequiredPermission = true;
    }

    return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
}
