# WF-USR-view-user-details — View User Details

## Overview
Navigate to the full detail page for a single user, showing all profile fields, active login sessions, and attached documents.

## Prerequisites
- No permission guard is applied to the **View Details** button itself, but the user list page requires `users:read` (enforced at the sidebar navigation level).

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. The **Users** page loads with the paginated user list.
3. In the Actions column of the target user's row, click the icon-only button with tooltip **View Details** (icon: EyeOutlined, type: link).
4. Navigation moves to `/users/:id` and the **User Details** page loads (spinner shown until `useUser(id)` resolves).
5. The page displays:
   - A Descriptions card with: Name, Email, Phone, Status (StatusBadge: active / inactive), Timezone, Language, Role (as Tags), Last Login, Created.
   - An **Active Sessions** card with a table of sessions: columns Device, IP Address, Location, Last Activity, Actions.
   - A **Documents** card (from UserDocumentsSection).
6. From this page the user can:
   - Click **Back** (icon: ArrowLeftOutlined) to navigate to `/users`.
   - Click **Edit** (icon: EditOutlined, type: primary) to navigate to `/users/:id/edit` (see WF-USR-edit-user).
   - Terminate a session (see WF-USR-terminate-session).
   - Upload, verify, unverify, download, or delete a document (see WF-USR-documents).
