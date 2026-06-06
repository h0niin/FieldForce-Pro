# WF-USR-send-magic-link — Send Magic Link (User Access)

## Overview
Generate and share a single-use login link for an active, non-admin user. This allows the user to log in without a password for one session.

## Prerequisites
- The currently authenticated user must be a **Company Admin**: `is_super_admin` is false AND one of the user's roles has the name `admin` (case-insensitive). This condition is checked in `isCompanyAdmin`.
- The target user's `is_active` must be `true` (status tag shows **Active**): `{isCompanyAdmin && record.is_active && !isTargetAdmin(record) && (...)}`.
- The target user must NOT hold an `admin` role themselves. `isTargetAdmin` checks `record.roles` for a role named `admin` (case-insensitive). If the target is an admin, the button is hidden.
- Super admins do not see this button.

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads. Active non-admin users have status **Active**.
3. Locate the target user row.
4. In the Actions column, click the icon-only button with tooltip **Send Magic Link** (icon: LinkOutlined, type: link).
   - The button shows a loading spinner (`loading={generateLink.isPending}`) while the API call is in progress.
5. On success, the **Magic Link Generated** modal opens automatically (see WF-USR-copy-magic-link).
   - The modal's Purpose label shows **User Access** (mapped from `user_access`).
6. Copy the link and share it securely with the target user, then click **Done**.

## Outcome
A single-use magic link with purpose `user_access` is generated. The link expires after one click.

## Notes
- The modal warning reads: "Single-use link — expires after one click. This link can only be used once. Share it securely — anyone with this link can log in as the target user."
