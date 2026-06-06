# WF-USR-create-user — Create User

## Overview
Directly create a new user account with a password (as opposed to the invite flow). The user is created immediately in an active state.

## Prerequisites
- The authenticated user must hold the permission `users:create`. The **Create User** button is wrapped in `<PermissionGuard permission="users:create">` and is invisible without that permission.

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads.
3. Click the **Create User** button (icon: PlusOutlined, type: primary) in the page header toolbar.
4. Navigation moves to `/users/create` and the **Create User** form page loads.
5. Fill in the required and optional fields:
   - **First Name** (required — "First name is required", max 100 characters)
   - **Last Name** (required — "Last name is required", max 100 characters)
   - **Email** (required — "Invalid email")
   - **Password** (required on create only — "Min 8 characters"; must also satisfy pattern: at least one lowercase, one uppercase, one digit, one special character from `@$!%*?&` — "Weak password")
   - **Phone** (optional, max 20 characters)
   - **Timezone** — select from: UTC, Eastern Time, Central Time, Mountain Time, Pacific Time, India Standard Time, GMT (defaults to UTC)
6. Click **Create** (submit button, type: primary).
   - If validation fails, error messages appear beneath the respective fields and the form stays on the page.
   - On success, navigation returns to `/users`.
7. To discard the form, click **Cancel** — navigation returns to `/users` without saving.

## Outcome
A new user record is created. The user appears in the Users list.

## Notes
- The Password field is only rendered when creating a new user. It is omitted entirely from the edit form (conditional rendering: `{!isEdit && (...)}` ).
- The Language field visible in the edit form is not rendered in the create form's JSX at the UI level (the schema defines it with default `'en'`).
