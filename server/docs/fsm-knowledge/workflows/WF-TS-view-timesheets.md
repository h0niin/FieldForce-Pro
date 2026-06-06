# WF-TS-view-timesheets — View Timesheet List

**Module:** Timesheets
**Source file:** `web/src/pages/timesheets/TimesheetListPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `timesheets:read` permission (enforced by `PermissionGuard`). The "View" icon button per row is wrapped in `<PermissionGuard permission="timesheets:read">` and will not render without this permission.

---

## Steps

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. The page loads with the heading **Timesheets** and subtitle **Manage timesheet entries**.
3. The table renders with the following columns:
   - **User** — full name (first + last) or user_id fallback
   - **Clock In** — formatted date/time
   - **Clock Out** — formatted date/time
   - **Travel (min)**
   - **Work (min)**
   - **Break (min)**
   - **Billable** — tag: `Yes` (green) or `No` (default)
   - **Status** — tag: `Pending` (blue), `Approved` (green), `Rejected` (red)
   - **Actions** — icon buttons (fixed right column, width 200)
4. The table footer shows **Total {n} timesheets** and a page-size changer.
5. Rows are paginated; the default page size is **10**. The pagination control shows the current page, total count, and a size changer.

---

## Column Sorting

- The **Clock In** column has a built-in sorter. Click the **Clock In** column header to sort ascending/descending by clock-in time.

---

## Notes

- Data is fetched via `useTimesheets({ page, take: pageSize, search })`.
- The table scrolls horizontally (`scroll={{ x: 1400 }}`).
- Status displayed as `Pending`, `Approved`, or `Rejected` (capitalised, underscores replaced with spaces).
