# WF-USR-invite-user — Invite User

## Overview
Send an invitation link to a new user who does not yet have an account. The system generates a magic link with purpose `user_onboarding` and presents it for sharing.

## Prerequisites
- The authenticated user must hold the permission `users:create`. The "Invite User" button is wrapped in `<PermissionGuard permission="users:create">` and is invisible without that permission.
- There must be at least one role already created in the system; the Role dropdown is populated from `useAllRoles()`. If no roles exist the dropdown is empty and the form cannot pass validation.
- The plan's user seat limit must not be exceeded (displayed in the usage progress bar on the Users list page).

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads, displaying the user list and the plan usage progress bar (Plan name, Users current / limit).
3. Click the **Invite User** button (icon: UserAddOutlined) in the page header toolbar. Button is visible only when the `users:create` permission is present.
4. The **Invite User** modal opens.
   - An info alert reads: "An invitation link will be generated. Share it with the user to complete their account setup."
5. Fill in the required fields:
   - **First Name** (required — "First name is required")
   - **Last Name** (required — "Last name is required")
   - **Email** (required, must be a valid email — "Enter a valid email address")
   - **Role** — select from the dropdown ("Select a role"); required — "Please select a role"
6. Click **Send Invite**.
   - If validation fails, error messages appear beneath the respective fields; the modal stays open.
   - On success the **Invite User** modal closes and the **Magic Link Generated** modal opens automatically (see WF-USR-copy-magic-link).
7. In the **Magic Link Generated** modal, copy and share the link, then click **Done** to dismiss.

## Outcome
A new user record is created with `is_active = false` (status shows as **Pending** in the user list). The magic link can be used once by the recipient to complete account setup.
