export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenant_id: string | null; // null for Super Admin users
  session_id: string;
  is_super_admin: boolean;
  primary_role: string | null; // first role name, or null if user has no roles
  // Roles and permissions removed to keep JWT under 4KB cookie limit
  // They are available via /auth/me endpoint instead
  iat?: number;
  exp?: number;
}
