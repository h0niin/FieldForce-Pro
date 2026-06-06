# WF-ROLE-create-role — Create Role

## Overview
Create a new custom role and assign permissions to it via the permissions matrix.

## Prerequisites
- The authenticated user must hold the permission `roles:create`. The **Create Role** button is wrapped in `<PermissionGuard permission="roles:create">` and is invisible without that permission.
- The page is accessed under the Settings group in the sidebar, which requires `settings:read`. The Roles & Permissions sub-item additionally requires `roles:read`.

## Steps

1. In the sidebar, click **Settings** (section: "System & Analytics") to expand the Settings submenu.
2. Click **Roles & Permissions** in the expanded submenu.
3. The **Roles & Permissions** page loads. The **Roles** tab is active by default.
4. Click **Create Role** (icon: PlusOutlined, type: primary) in the Roles tab card header.
   - This button is visible only when the `roles:create` permission is present.
5. The **Create Role** modal opens (width: 780px).
6. Fill in the required fields:
   - **Role Name** (required — "Please enter role name"): e.g., "Admin, Manager, Field Technician".
   - **Description** (required — "Please enter description"): textarea, "Describe what this role can do".
7. In the **Permissions** section, use the Permissions Matrix to select permissions:
   - Use the **Search modules...** input to filter module rows.
   - Click **Select All** to check all permissions across all modules.
   - Click **Clear All** to uncheck all permissions.
   - Click the checkbox in the Module column of a row to toggle all actions for that module (checkbox becomes indeterminate if only some actions are selected).
   - Click individual action checkboxes (create, read, update, delete, manage) within a module row.
   - The selection count is shown as "N selected" in the matrix toolbar.
8. Click **OK** to submit.
   - The button shows a loading spinner (`confirmLoading={createRole.isPending || updateRole.isPending}`).
   - On success the modal closes and the Roles table refreshes.
9. To cancel without saving, click the **X** close button in the modal header — the modal closes and `roleForm.resetFields()` is called.

## Outcome
A new custom role is created with the selected permissions. It appears in the Roles table with a **Custom** tag (as opposed to **System** tag).
