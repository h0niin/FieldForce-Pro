# WF-TS-delete-timesheet — Delete a Timesheet Entry

**Module:** Timesheets
**Source files:**
- `web/src/pages/timesheets/TimesheetListPage.tsx`
- `web/src/pages/timesheets/TimesheetDetailPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `timesheets:delete` permission (enforced by `<PermissionGuard permission="timesheets:delete">`). The **Delete** button will not render without this permission.
- No status restriction: the **Delete** button is rendered regardless of the timesheet's current status (unlike Approve/Reject which require `pending`).

---

## Path A — Delete from the Timesheet List

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the row for the timesheet entry to delete.
3. In the **Actions** column, click the icon button with tooltip **Delete** (trash/delete icon, `DeleteOutlined`, danger/red style).
4. A confirmation dialog appears with:
   - Title: **Delete Timesheet**
   - Body: **Are you sure you want to delete this timesheet entry?**
   - The dialog is styled as `danger: true`.
5. Click **OK** in the confirmation dialog.
6. The `useDeleteTimesheet` mutation fires (`deleteTimesheet.mutateAsync(timesheet.id)`).
7. On success, the table refreshes (TanStack Query cache invalidation) and the deleted row is removed from the list.

---

## Path B — Delete from the Timesheet Detail Page

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. In the **Actions** column of the target row, click the icon button with tooltip **View** (eye icon) to navigate to `/timesheets/{id}`.
3. In the page header actions area (top right), click the **Delete** button (trash icon + label "Delete", danger/red style).
4. A confirmation dialog appears with:
   - Title: **Delete Timesheet**
   - Body: **Are you sure you want to delete this timesheet entry?**
   - The dialog is styled as `danger: true`.
5. Click **OK** in the confirmation dialog.
6. The `useDeleteTimesheet` mutation fires (`deleteTimesheet.mutateAsync(timesheet.id)`).
7. On success, the user is automatically navigated back to `/timesheets` (`navigate('/timesheets')`).

---

## Notes

- Clicking **Cancel** in the confirmation dialog dismisses it without any mutation.
- Deletion via the detail page always redirects to the list; deletion via the list page stays on the list.
- No export feature is implemented in either `TimesheetListPage.tsx` or `TimesheetDetailPage.tsx`.
