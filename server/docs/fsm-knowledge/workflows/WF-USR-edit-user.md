# WF-USR-edit-user — Edit User

## Overview
Update an existing user's profile fields. Password can optionally be changed; if left blank it is not updated.

## Prerequisites
- There are no explicit permission guards on the Edit button in `UserDetailPage.tsx`; the button is always rendered for any authenticated user who can navigate to the detail page.
- The user record must exist and be loadable via `useUser(id)`.

## Steps

### Path A — from the User List

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads.
3. In the Actions column of the target user's row, click the icon-only button with tooltip **View Details** (icon: EyeOutlined, type: link).
4. Navigation moves to `/users/:id` and the **User Details** page loads.
5. Click the **Edit** button (icon: EditOutlined, type: primary) in the page header toolbar.
6. Navigation moves to `/users/:id/edit` and the **Edit User** form page loads with the user's current values pre-populated.

### Path B — direct navigation to `/users/:id/edit`

1. Navigate directly to `/users/:id/edit` (e.g., via browser address bar or internal link).
2. The **Edit User** form page loads with a loading spinner until `useUser(id)` resolves.

### Filling in the Edit Form

3. Modify any of the following fields:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email** (required, must be valid email)
   - **Phone** (optional)
   - **Timezone** — select from: UTC, Eastern Time, Central Time, Mountain Time, Pacific Time, India Standard Time, GMT
   - **Password** is NOT shown in edit mode (the field is conditionally rendered only when `!isEdit`).
4. Click **Save** (submit button, type: primary).
   - If validation fails, error messages appear beneath the respective fields.
   - On success, navigation returns to `/users`.
5. To discard changes, click **Cancel** — navigation returns to `/users` without saving.

### Returning to the List from Detail Page

- On the **User Details** page, click the **Back** button (icon: ArrowLeftOutlined) to navigate back to `/users` without editing.

## Outcome
The user record is updated. The Users list reflects the new values after TanStack Query cache invalidation.
