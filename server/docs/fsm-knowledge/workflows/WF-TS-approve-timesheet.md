# WF-TS-approve-timesheet — Approve a Timesheet Entry

**Module:** Timesheets
**Source files:**
- `web/src/pages/timesheets/TimesheetListPage.tsx`
- `web/src/pages/timesheets/TimesheetDetailPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `timesheets:update` permission (enforced by `<PermissionGuard permission="timesheets:update">`). The **Approve** button will not render without this permission.
- The target timesheet entry must have `status === 'pending'`. The **Approve** button (both on the list and on the detail page) is conditionally rendered only when `record.status === 'pending'` / `timesheet.status === 'pending'`. It is not visible for `approved` or `rejected` entries.

---

## Path A — Approve from the Timesheet List

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the row for the target timesheet. The **Status** column must show **Pending**.
3. In the **Actions** column, click the icon button with tooltip **Approve** (check icon, `CheckOutlined`, green colour `#52c41a`).
4. A confirmation dialog appears with:
   - Title: **Approve Timesheet**
   - Body: **Are you sure you want to approve this timesheet?**
5. Click **OK** in the confirmation dialog.
6. The `useApproveTimesheet` mutation fires (`approveTimesheet.mutateAsync(timesheet.id)`).
7. While the mutation is in flight, the **Approve** button shows a loading spinner (`loading={approveTimesheet.isPending}`).
8. On success, the table refreshes (TanStack Query cache invalidation) and the row's **Status** tag updates.

---

## Path B — Approve from the Timesheet Detail Page

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. In the **Actions** column of the target row, click the icon button with tooltip **View** (eye icon) to navigate to `/timesheets/{id}`.
3. Confirm the **Status** field in the **Timesheet Information** card shows **Pending**.
4. In the page header actions area (top right), click the **Approve** button (check icon + label "Approve", green border `#52c41a`).
5. A confirmation dialog appears with:
   - Title: **Approve Timesheet**
   - Body: **Are you sure you want to approve this timesheet?**
6. Click **OK** in the confirmation dialog.
7. The `useApproveTimesheet` mutation fires (`approveTimesheet.mutateAsync(timesheet.id)`).
8. While the mutation is in flight, the **Approve** button shows a loading spinner (`loading={approveTimesheet.isPending}`).
9. On success, the detail page data refreshes and the **Status** tag updates to **Approved** (green).

---

## Notes

- The **Approve** button is absent for entries whose status is not `pending`.
- Clicking **Cancel** in the confirmation dialog dismisses it without any mutation.
