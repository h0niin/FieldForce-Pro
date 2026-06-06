# User Management, Roles & Permissions

## Accessing User Management

Go to **Settings → Users** or **Settings → Roles & Permissions** in the sidebar.

## Inviting a New User

1. Go to **Settings → Users**.
2. Click **+ Invite User**.
3. Enter the user's:
   - First name and last name
   - Email address
   - Role (select from the dropdown)
4. Click **Send Invite**.
5. The user receives an email with a magic link to complete setup and set their password.
6. Their account is inactive until they accept the invite.

## Creating a User Directly (with password)

1. Go to **Settings → Users**.
2. Click **+ New User**.
3. Fill in name, email, and password.
4. Select a role.
5. Click **Save**. The account is active immediately.

## Deactivating a User

1. Go to **Settings → Users**.
2. Find the user in the list.
3. Click the **Actions** menu (⋮) and select **Deactivate**.
4. The user can no longer log in but their data is preserved.

## Reactivating a User

1. In the Users list, filter by **Inactive** users.
2. Find the user.
3. Click **Reactivate** in their Actions menu.

## Understanding Roles

Roles are named permission sets. Default roles:

| Role | Access Level |
|------|-------------|
| **Admin** | Full access to all modules and settings |
| **Dispatcher** | Work orders, service requests, scheduling, contacts |
| **Technician** | Own assigned work orders, timesheets |
| **Manager** | Read-only + approvals, reports |

## Creating a Custom Role

1. Go to **Settings → Roles & Permissions**.
2. Click **+ New Role**.
3. Enter a role name and description.
4. Toggle individual permissions ON or OFF. Permissions are grouped by module (Work Orders, Invoices, etc.) and action (Create, Read, Update, Delete).
5. Click **Save Role**.
6. Assign this role to users from the Users page.

## Editing an Existing Role

1. Go to **Settings → Roles & Permissions**.
2. Click on the role name to open it.
3. Toggle permissions as needed.
4. Click **Save**. Changes apply immediately to all users with that role.

## Assigning a Role to a User

1. Go to **Settings → Users**.
2. Click on the user's name.
3. In the **Role** field, select the new role from the dropdown.
4. Click **Save**.

## Permission Categories

Permissions follow the pattern `module:action`. Examples:

| Permission | Access Granted |
|-----------|---------------|
| `work_orders:create` | Create new work orders |
| `work_orders:read` | View work orders |
| `work_orders:update` | Edit work orders |
| `work_orders:delete` | Delete work orders |
| `invoices:read` | View invoices |
| `invoices:create` | Create invoices |
| `audit_logs:read` | View the Mobile Usage Logs |
| `chatbot:use` | Use the in-app AI chatbot |
| `settings:manage` | Access all settings |

## Password Reset

Users can reset their own password via the **Forgot Password** link on the login page.

Admins can trigger a reset for another user:
1. Go to **Settings → Users**.
2. Open the user's profile.
3. Click **Send Password Reset Email**.
