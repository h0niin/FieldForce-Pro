import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import DashboardPage from './DashboardPage';


/**
 * Routes the authenticated user to the correct dashboard based on their role.
 * Each role sees the same layout and components; the sidebar navigation
 * and data shown are controlled by role-based filtering elsewhere.
 * Individual dashboard UIs will be provided in a follow-up implementation.
 */
export default function DashboardRouter() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  // Super Admin sits above all tenants — redirect to dedicated super admin dashboard
  if (user.is_super_admin) return <Navigate to="/admin/tenants" replace />;

  const primaryRole = user.primary_role ?? (Array.isArray(user.roles) ? user.roles[0] : null);
  const roleName = typeof primaryRole === 'string' ? primaryRole : (primaryRole as any)?.name;

  switch (roleName) {
    case 'Company Admin':
    case 'Admin':
      return <DashboardPage />;
    case 'Manager':
      return <DashboardPage />;
    case 'Dispatcher':
      return <DashboardPage />;
    case 'Technician':
      return <DashboardPage />;
    default:
      // Unknown role — show default dashboard; specific role dashboards come in follow-up
      return <DashboardPage />;
  }
}
