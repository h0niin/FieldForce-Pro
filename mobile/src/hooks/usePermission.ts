import { useAuthStore } from '@/store/auth.store';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/utils/permissions';

/**
 * Custom hook for checking user permissions.
 * Mirrors the web's usePermission hook pattern.
 *
 * @example
 * const { can, canAny, canAll, isAdmin } = usePermission();
 *
 * if (can('users:create')) {
 *   // Show create button
 * }
 */
export function usePermission() {
    const user = useAuthStore((state) => state.user);
    const userPermissions = user?.permissions;
    const roles = user?.roles;

    // Check if user has an Admin role (system admin gets full access)
    const isAdmin = (() => {
        if (!roles) return false;
        return roles.some((role) => {
            if (typeof role === 'string') return role === 'Admin';
            return role.name === 'Admin';
        });
    })();

    // Check if user has a Technician role
    const isTechnician = (() => {
        if (!roles) return false;
        return roles.some((role) => {
            if (typeof role === 'string') return role === 'Technician';
            return role.name === 'Technician';
        });
    })();

    return {
        /** Whether the user has the Admin role */
        isAdmin,

        /** Whether the user has the Technician role */
        isTechnician,

        /** Check if user has a specific permission */
        can: (permission: string): boolean => {
            if (isAdmin) return true;
            // Check permissions array first (from JWT), then fall back to roles
            if (userPermissions) {
                return userPermissions.includes(permission);
            }
            return hasPermission(roles, permission);
        },

        /** Check if user has any of the specified permissions (OR logic) */
        canAny: (permissions: string[]): boolean => {
            if (isAdmin) return true;
            if (userPermissions) {
                return permissions.some((p) => userPermissions.includes(p));
            }
            return hasAnyPermission(roles, permissions);
        },

        /** Check if user has all of the specified permissions (AND logic) */
        canAll: (permissions: string[]): boolean => {
            if (isAdmin) return true;
            if (userPermissions) {
                return permissions.every((p) => userPermissions.includes(p));
            }
            return hasAllPermissions(roles, permissions);
        },

        /** Get all user permissions as flat array */
        getPermissions: (): string[] => {
            if (userPermissions) return userPermissions;
            if (!roles) return [];
            return roles.flatMap((role) => {
                if (typeof role === 'string') return [];
                return role.permissions?.map((p) => p.name) || [];
            });
        },

        /** Get all user roles */
        getRoles: () => roles || [],
    };
}
