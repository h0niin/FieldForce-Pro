# WF-TS-view-timesheet-detail — View Timesheet Detail

**Module:** Timesheets
**Source file:** `web/src/pages/timesheets/TimesheetDetailPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `timesheets:read` permission so the "View" icon button is visible on the list page.

---

## Steps

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the row for the desired timesheet entry in the table.
3. In the **Actions** column, click the icon button with tooltip **View** (eye icon, `EyeOutlined`).
   - This navigates to `/timesheets/{id}`.
4. The page loads with the heading **Timesheet Details**.
   - While loading, a `<Skeleton active />` placeholder is shown inside a `<Card>`.
   - If the record does not exist, the heading **Timesheet Not Found** and the message **Timesheet not found** are shown.
5. The card **Timesheet Information** renders a two-column bordered `<Descriptions>` table with the following fields:

   | Label | Content |
   |---|---|
   | User | First name + last name, or user_id, or `-` |
   | Status | Coloured tag: `Pending` (blue), `Approved` (green), `Rejected` (red) |
   | Clock In | Formatted date/time, or `-` |
   | Clock Out | Formatted date/time, or `-` |
   | Travel Time | Integer minutes |
   | Work Time | Integer minutes |
   | Break Time | Integer minutes |
   | Billable | Tag `Yes` (green) or `No` (default) |
   | Appointment ID | UUID or `-` |
   | Work Order ID | UUID or `-` |
   | Approved By | Value or `-` |
   | Notes | Text (full width, `span={2}`) or `-` |
   | Created At | Formatted date/time |
   | Updated At | Formatted date/time |

6. To return to the list, click the back arrow rendered by `PageHeader` (`onBack` navigates to `/timesheets`).

---

## Notes

- Data is fetched via `useTimesheet(id)`.
- The page URL is `/timesheets/:id`.
