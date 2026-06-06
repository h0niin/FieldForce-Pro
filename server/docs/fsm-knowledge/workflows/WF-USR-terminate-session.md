# WF-USR-terminate-session — Terminate User Session

## Overview
Force-end an active login session for a user from the User Details page.

## Prerequisites
- No explicit permission guard is applied to the **Terminate** button in the code. Any user who can navigate to the User Details page (`/users/:id`) can perform this action.
- Sessions must be loaded by `useSessions()`. If the Active Sessions table is empty, there are no sessions to terminate.

## Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. Click the icon-only **View Details** button (tooltip: "View Details", icon: EyeOutlined) for the target user.
3. The **User Details** page loads.
4. Scroll to the **Active Sessions** card.
5. In the Actions column of the target session row, click **Terminate** (danger button, size: small).
6. A confirmation dialog appears with:
   - Title: "Terminate Session"
   - Content: "Are you sure you want to terminate this session?"
   - A destructive (danger) confirmation button.
7. Confirm by clicking the confirm button in the dialog.
   - On success, `terminateSession.mutateAsync(record.id)` is called and the session is removed.
8. To cancel without terminating, click the cancel button in the dialog.

## Outcome
The selected session is invalidated. The device using that session will be logged out on its next request.
