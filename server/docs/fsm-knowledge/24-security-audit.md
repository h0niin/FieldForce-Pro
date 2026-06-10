# Security Settings and Audit Logs

---

## Security Settings

### Accessing Security Settings
Go to **Settings → Security** in the sidebar.

### What Security Settings Are Available

| Setting | Description |
|---------|-------------|
| **Two-Factor Authentication (2FA)** | Require users to verify login via email code or authenticator app |
| **Session Timeout** | Automatically log users out after a period of inactivity (e.g., 30 minutes) |
| **Password Policy** | Minimum password length, complexity requirements (uppercase, numbers, special characters) |
| **IP Allowlist** | Restrict access to FieldForce Pro to specific IP addresses only |
| **Single Sign-On (SSO)** | Connect to your company's SSO provider (Google Workspace, Microsoft Azure AD) |
| **API Key Management** | Create and revoke API keys for integrations |

### Enabling Two-Factor Authentication
1. Go to **Settings → Security**.
2. Under **Two-Factor Authentication**, click **Enable 2FA for Organisation**.
3. Choose enforcement level:
   - **Optional** — users can choose to enable 2FA themselves
   - **Required for Admins** — only admin users must use 2FA
   - **Required for All Users** — every user must set up 2FA before they can log in
4. Click **Save**.

### What Happens When 2FA Is Required?
When a user logs in, after entering their email and password, they are asked to enter a verification code:
- If using **Email 2FA**: a code is sent to their email address
- If using an **Authenticator App** (Google Authenticator, Authy): they enter the code shown in the app

### Resetting 2FA for a User (Admin)
If a user loses access to their 2FA device:
1. Go to **Settings → Users**.
2. Open the user's profile.
3. Click **Reset 2FA**.
4. The user's 2FA is removed and they can set it up again on next login.

---

## Audit Logs

### What are Audit Logs?
Audit logs are a complete record of every action taken in FieldForce Pro — who did what, when, and what changed. Audit logs cannot be edited or deleted; they are permanent records for compliance and security purposes.

### Accessing Audit Logs
Go to **Security → Audit Logs** in the sidebar (or **Settings → Audit Logs**).

### What Audit Logs Record

| Field | Description |
|-------|-------------|
| **User** | Who performed the action |
| **Action** | What was done (Create, Update, Delete, Login, Status Change, etc.) |
| **Module** | Which part of the system (Work Orders, Invoices, Users, Settings, etc.) |
| **Record ID** | The specific record that was affected |
| **Old Values** | What the data looked like before the change |
| **New Values** | What the data looks like after the change |
| **IP Address** | The IP address the action was taken from |
| **Timestamp** | The exact date and time of the action |

### Common Actions Logged
- User login and logout
- Work order created, updated, deleted, status changed
- Invoice created, sent, payment recorded
- User account created, modified, deactivated
- Settings changed (SLA policies, roles, permissions, integrations)
- Estimate approved or rejected
- Timesheet approved or rejected
- Role permissions modified
- API key created or revoked

### Filtering Audit Logs
1. Go to **Security → Audit Logs**.
2. Use filters to narrow results:
   - **User** — see all actions by a specific person
   - **Module** — see all changes to a specific area (e.g., all invoice changes)
   - **Action** — filter by action type (e.g., only Deletes)
   - **Date Range** — show logs from a specific period
3. Click on any log entry to see the full details including old and new values.

### Who Can View Audit Logs?
Only users with the `audit_logs:read` permission (typically Admins) can view audit logs.

### Exporting Audit Logs
1. Go to **Security → Audit Logs**.
2. Apply any desired filters.
3. Click **Export CSV** or **Export PDF**.
4. The file downloads with all matching log entries.

---

## Mobile Usage Logs (Admin)

### What are Mobile Usage Logs?
Mobile Usage Logs record activity from the mobile app specifically — when technicians used the app, which features they accessed, and app performance data.

### Accessing Mobile Usage Logs
Go to **Admin → Mobile Usage Logs**.

This page is available to system administrators only and shows:
- Device type and OS version
- App version used
- Features accessed per session
- Error events from the mobile app
- Offline sync events (when data was synced after being offline)
