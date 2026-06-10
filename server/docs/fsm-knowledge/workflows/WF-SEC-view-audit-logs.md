# WF-SEC-view-audit-logs — View Audit Logs

## Prerequisites
- User must have the `audit_logs:read` permission (typically Admin only).

## Steps

1. Click **Security** in the left sidebar, then click **Audit Logs**.
   Alternatively, go to **Settings → Audit Logs**.
2. The audit log list shows all recorded system actions with: User, Action, Module, Timestamp, IP Address.
3. To filter audit logs:
   - **User filter** — select a specific user to see only their actions
   - **Module filter** — select a module (e.g., Work Orders, Invoices, Users) to see changes in that area
   - **Action filter** — select action type (Create, Update, Delete, Login, Status Change)
   - **Date Range** — select start and end dates to narrow the time period
4. Click **Apply Filters** to update the results.
5. Click any audit log row to see full details:
   - The exact record that was changed (with a link to it)
   - **Old Values** — what the data looked like before the change
   - **New Values** — what the data looks like after the change
   - IP address and device information
6. To export for compliance purposes:
   - Apply your desired filters
   - Click **Export CSV** or **Export PDF**
   - The file downloads with all matching log entries

## Result
A detailed, filterable view of all actions taken in the system for compliance auditing, security monitoring, and dispute resolution.
