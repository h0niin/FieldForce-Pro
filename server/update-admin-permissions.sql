-- First, let's see current permissions for Admin role
SELECT rp.role_id, r.name as role_name, p.name as permission_name
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'Admin'
ORDER BY p.name;

-- Get Admin role ID
-- Replace this with the actual ID: a60b3a16-9995-4615-8d33-d43e9243f584

-- Delete existing role_permission entries for Admin (we'll recreate them all)
DELETE FROM role_permissions
WHERE role_id = 'a60b3a16-9995-4615-8d33-d43e9243f584';

-- Insert ALL permissions for Admin role
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'a60b3a16-9995-4615-8d33-d43e9243f584',
    p.id,
    NOW(),
    NOW()
FROM permissions p
WHERE p.name IN (
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage',
    'roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:manage',
    'permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete', 'permissions:manage',
    'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete', 'tenants:manage'
);

-- Verify the update
SELECT COUNT(*) as total_permissions
FROM role_permissions
WHERE role_id = 'a60b3a16-9995-4615-8d33-d43e9243f584';

-- Show all permissions now assigned to Admin
SELECT p.name as permission_name
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = 'a60b3a16-9995-4615-8d33-d43e9243f584'
ORDER BY p.name;
