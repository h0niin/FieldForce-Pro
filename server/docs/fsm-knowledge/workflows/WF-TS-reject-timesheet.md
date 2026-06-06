# WF-TS-reject-timesheet — Reject a Timesheet Entry

**Module:** Timesheets
**Source files:**
- `web/src/pages/timesheets/TimesheetListPage.tsx`
- `web/src/pages/timesheets/TimesheetDetailPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `timesheets:update` permission (enforced by `<PermissionGuard permission="timesheets:update">`). The **Reject** button will not render without this permission.
- The target timesheet entry must have `status === 'pending'`. The **Reject** button (both on the list and on the detail page) is conditionally rendered only when `record.status === 'pending'` / `timesheet.status === 'pending'`. It is not visible for `approved` or `rejected` entries.

---

## Path A — Reject from the Timesheet List

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the row for the target timesheet. The **Status** column must show **Pending**.
3. In the **Actions** column, click the icon button with tooltip **Reject** (close icon, `CloseOutlined`, danger/red style).
4. A confirmation dialog appears with:
   - Title: **Reject Timesheet**
   - Body: **Are you sure you want to reject this timesheet?**
   - The dialog is styled as `danger: true`.
5. Click **OK** in the confirmation dialog.
6. The `useRejectTimesheet` mutation fires (`rejectTimesheet.mutateAsync(timesheet.id)`).
7. While the mutation is in flight, the **Reject** button shows a loading spinner (`loading={rejectTimesheet.isPending}`).
8. On success, the table refreshes (TanStack Query cache invalidation) and the row's **Status** tag updates.

---

## Path B — Reject from the Timesheet Detail Page

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. In the **Actions** column of the target row, click the icon button with tooltip **View** (eye icon) to navigate to `/timesheets/{id}`.
3. Confirm the **Status** field in the **Timesheet Information** card shows **Pending**.
4. In the page header actions area (top right), click the **Reject** button (close icon + label "Reject", danger/red style).
5. A confirmation dialog appears with:
   - Title: **Reject Timesheet**
   - Body: **Are you sure you want to reject this timesheet?**
   - The dialog is styled as `danger: true`.
6. Click **OK** in the confirmation dialog.
7. The `useRejectTimesheet` mutation fires (`rejectTimesheet.mutateAsync(timesheet.id)`).
8. While the mutation is in flight, the **Reject** button shows a loading spinner (`loading={rejectTimesheet.isPending}`).
9. On success, the detail page data refreshes and the **Status** tag updates to **Rejected** (red).

---

## Notes

- The **Reject** button is absent for entries whose status is not `pending`.
- Clicking **Cancel** in the confirmation dialog dismisses it without any mutation.
