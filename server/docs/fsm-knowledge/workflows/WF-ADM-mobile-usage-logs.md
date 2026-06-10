# WF-ADM-mobile-usage-logs — View Mobile Usage Logs (Audit Trail)

## Module
Administration — `MobileUsageLogs` (`/admin/mobile-logs`)

## Prerequisites
- User must be authenticated.
- The sidebar entry requires the `audit_logs:read` permission.

---

## Steps — Open the Mobile Usage Logs Page

1. In the left sidebar, click **Mobile Usage Logs** (mobile icon).
2. The browser navigates to `/admin/mobile-logs`.
3. The page header reads **"Mobile Usage Logs"** with the subtitle "Audit trail of technician and field worker activity from the mobile app".
4. A **Refresh** button (ReloadOutlined) sits in the top-right of the header; clicking it re-fetches the current results via `refetch()`.
5. The events table loads via the `useAuditLogs` hook (API `GET /audit-logs`). Columns:

   | Column | Source field | Notes |
   |---|---|---|
   | **Date / Time** | `created_at` | Formatted `YYYY-MM-DD HH:mm:ss`; sortable. |
   | **User ID** | `user_id` | First 8 chars shown, full value copyable on hover. |
   | **Action** | `action` | Colored tag with a human-readable label. |
   | **Module** | `module` | Tag with the `mobile_` prefix stripped. |
   | **Record ID** | `record_id` | First 8 chars shown, full value on hover; "—" if empty. |
   | **Details** | `new_values` | JSON preview (internal `_user_agent` key hidden). |
   | **Device** | `new_values._user_agent` / `user_agent` | Mobile icon plus device string. |
   | (view) | — | Eye icon button (EyeOutlined) to open full details. |

---

## Steps — Filter the Audit Events

1. **Filter by User ID:** type into the **"Filter by User ID"** input. Input is debounced 500ms, then applied as the `user_id` filter and the page resets to 1. Use the clear control to remove it.
2. **Filter by Action:** use the **"Filter by Action"** select. Options: Login, Biometric Login, Logout, WO Status Changed, WO Note Added, WO Photo Uploaded, Clock In, Clock Out, SR Accepted, SR Rejected, Estimate Sent, Estimate Signed. Selecting resets the page to 1.
3. **Filter by Module:** use the **"Filter by Module"** select. Options: Authentication, Work Orders, Timesheets, Service Requests, Estimates, Appointments. Selecting resets the page to 1.
4. **Filter by date range:** use the **RangePicker** to set start and end dates (sent as `start_date`/`end_date` ISO strings). Changing it resets the page to 1.
5. Each filter change re-runs `useAuditLogs` with the updated query parameters.

---

## Steps — Page Through Results

1. Pagination is shown below the table; the footer reads "{total} events".
2. Use **Show size changer** to switch page size between **20** (default), **50**, or **100**.
3. Use the page controls to move between pages. Changing page size resets to page 1.
4. Total count comes from the response `meta.itemCount`.

---

## Steps — View Full Event Details

1. In any row, click the eye icon (**"View full details"**) in the last column.
2. A modal titled **"Audit Event Details"** opens showing the selected record:
   - **ID**, **User ID**, **Action** (colored tag), **Module** (tag), **Record ID**, **Timestamp** (`YYYY-MM-DD HH:mm:ss`), **IP Address**.
   - **Previous Values** — pretty-printed `old_values` JSON (shown only if present).
   - **New Values / Metadata** — pretty-printed `new_values` JSON (shown only if present).
3. Close the modal with the **X** (cancel) control.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open page | Sidebar **Mobile Usage Logs** | `audit_logs:read` | `useAuditLogs` → `GET /audit-logs` |
| Refresh list | **Refresh** button (ReloadOutlined) | `audit_logs:read` | `refetch()` |
| Filter by user | **Filter by User ID** input (debounced) | `audit_logs:read` | `useAuditLogs` (`user_id`) |
| Filter by action | **Filter by Action** select | `audit_logs:read` | `useAuditLogs` (`action`) |
| Filter by module | **Filter by Module** select | `audit_logs:read` | `useAuditLogs` (`module`) |
| Filter by date range | **RangePicker** | `audit_logs:read` | `useAuditLogs` (`start_date`/`end_date`) |
| Change page / size | Table pagination | `audit_logs:read` | `useAuditLogs` (`page`/`take`) |
| View full details | Row eye icon (EyeOutlined) | `audit_logs:read` | Client-side modal (uses loaded row) |
