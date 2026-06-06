# WF-USR-copy-magic-link — Copy Magic Link (Magic Link Generated Modal)

## Overview
The **Magic Link Generated** modal appears automatically after a successful invite, resend invite, or send magic link action. It presents the generated link for copying and sharing.

## Prerequisites
- This modal is triggered automatically by other workflows; it is not opened by a direct user action. It is shown when `magicLinkModal` state is non-null in `UserListPage`.

## Modal Contents

- **Title**: "Magic Link Generated" (with LinkOutlined icon)
- **Warning alert**: "Single-use link — expires after one click" / "This link can only be used once. Share it securely — anyone with this link can log in as the target user."
- **Purpose** label: one of:
  - "User Invitation" (when `purpose = 'user_onboarding'`)
  - "User Access" (when `purpose = 'user_access'`)
  - "Company Admin Onboarding" (when `purpose = 'admin_onboarding'`)
  - "Super Admin Access" (when `purpose = 'super_admin_access'`)
- **Expires** label: formatted expiry date/time
- **Magic Link** text block: the URL, displayed in a styled box with ellipsis (expandable)

## Steps

1. The **Magic Link Generated** modal opens automatically.
2. Review the Purpose and Expires fields.
3. To copy the link, click the icon-only button with tooltip **Copy link** (icon: CopyOutlined) inside the Magic Link box.
   - After clicking, the icon changes to CheckOutlined and the tooltip briefly shows **Copied!** for 2 seconds.
4. Share the copied link securely with the intended user.
5. Click **Done** (primary button in the modal footer) to close the modal.

## Outcome
The modal is dismissed. The magic link has been copied to the clipboard for sharing.
