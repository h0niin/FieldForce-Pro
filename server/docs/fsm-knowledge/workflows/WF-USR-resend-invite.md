# WF-USR-resend-invite — Resend Invite (Magic Link)

## Overview
Regenerate and share a new onboarding magic link for a user who has not yet accepted their original invitation (status: Pending).

## Prerequisites
- The currently authenticated user must be a **Company Admin**: `is_super_admin` is false AND one of the user's roles has the name `admin` (case-insensitive). This condition is checked in `isCompanyAdmin`.
- The target user's `is_active` must be `false` (status tag shows **Pending**). The **Resend Invite** button is conditionally rendered: `{isCompanyAdmin && !record.is_active && (...)}`.
- Both conditions must be true simultaneously. Super admins do not see this button.

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads. Users with status **Pending** have `is_active = false`.
3. Locate the target user row (Status column shows the **Pending** tag).
4. In the Actions column, click the icon-only button with tooltip **Resend Invite** (icon: ReloadOutlined, type: link).
   - The button shows a loading spinner (`loading={generateLink.isPending}`) while the API call is in progress.
5. On success, the **Magic Link Generated** modal opens automatically (see WF-USR-copy-magic-link).
   - The modal's Purpose label shows **User Invitation** (mapped from `user_onboarding`).
6. Copy the magic link and share it with the user, then click **Done**.

## Outcome
A new single-use magic link with purpose `user_onboarding` is generated for the pending user. The previous link (if any) is superseded.
