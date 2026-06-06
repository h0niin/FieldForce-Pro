# WF-USR-assign-role — Assign Role to User

## Overview
Add or remove roles for an existing user via a Transfer (dual-list) widget. All role assignments are replaced atomically on save.

## Prerequisites
- The authenticated user must hold the permission `users:update`. The **Assign Roles** button (icon: TeamOutlined) in the user list Actions column is wrapped in `<PermissionGuard permission="users:update">` and is invisible without that permission.
- At least one role must exist in the system. If no roles exist, the Transfer component shows an alert: "No roles available. Please create roles before assigning them to users."

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads with the user list.
3. In the Actions column of the target user's row, click the icon-only button with tooltip **Assign Roles** (icon: TeamOutlined, type: link).
4. The **Assign Roles - [First Name] [Last Name]** modal opens (title is dynamically set to the user's name).
   - The left panel is labelled **Available Roles** and shows roles not yet assigned to the user.
   - The right panel is labelled **Assigned Roles** and shows roles currently assigned to the user.
   - Both panels include a search input (showSearch is enabled).
   - A loading spinner is shown while `useAllRoles()` or `useUser()` is fetching.
5. To assign a role:
   a. Click the role name in the **Available Roles** panel to select it (checkbox appears).
   b. Click the right-arrow transfer button to move it to **Assigned Roles**.
   - Alternatively, double-click a role to move it immediately.
6. To remove a role:
   a. Click the role name in the **Assigned Roles** panel to select it.
   b. Click the left-arrow transfer button to move it back to **Available Roles**.
7. Click **Save** to persist the role assignment.
   - The button shows a loading spinner (`confirmLoading={assignRolesMutation.isPending}`).
   - On success the modal closes.
8. To discard changes, click **Cancel** — the modal closes and the Transfer state resets to the user's original roles.

## Outcome
The user's roles are replaced with the contents of the **Assigned Roles** panel. The user list refreshes via TanStack Query cache invalidation.
