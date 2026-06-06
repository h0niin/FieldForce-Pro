# WF-SCHED-assign-technician — Assign a Technician to an Appointment (Dispatch Board)

## Module
Scheduling — DispatchBoardPage (`/scheduling`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must have at least one of the permissions `service_appointments:read` or `scheduling:read` to see the View button (PermissionGuard).
- The user's `id` must match the `scheduleAssignerId` returned by the `useScheduleAssigner` hook (i.e., the user designated as the SCHEDULE workflow assigner). Only that user sees the **Assign** button and can submit the modal.
- A SCHEDULE workflow must be configured in Workflow Settings. If no workflow is configured, the info banner reads: "No SCHEDULE workflow is configured. Configure a SCHEDULE workflow in Workflow Settings to designate an assigner."
- The appointment must have `agent_id` equal to `null` / unassigned. The **Assign** button is hidden when `record.agent_id` is already populated.
- The appointment must be on the **New / Assign** tab (status: `scheduled`, unassigned).

---

## Steps — Assign Technician to an Unassigned Appointment

1. In the left sidebar, expand the **nav.scheduling** submenu (Scheduling & Workforce section).
2. Click **Dispatch Board** to navigate to `/scheduling`.
3. The "Dispatch Board for service appointments" page loads on the **All Appointments** tab.
4. Click the **New / Assign** tab.
5. The tab shows only appointments with status `scheduled` and no technician assigned.
6. An information banner is displayed:
   - If the current user IS the designated assigner: "You are the designated assigner for scheduling. ({assignerName})"
   - If a different user is the designated assigner: "Only the designated assigner ({assignerName}) can assign technicians."
   - If no workflow is configured: "No SCHEDULE workflow is configured. Configure a SCHEDULE workflow in Workflow Settings to designate an assigner."
7. Locate the target appointment row in the table. Each row shows: Agent (displays "Unassigned" tag if no agent), Work Order, Status, Scheduled Start, Scheduled End, Created At.
8. In the Actions column, click the **Assign** button (icon: UserAddOutlined, tooltip: "Assign Technician", type: "primary"). This button is only visible when the current user is the designated assigner AND the record has no `agent_id`.
9. The "Assign Technician" modal opens (width: 520px). The modal body shows:
   - A card displaying the Work Order details: number, summary.
   - A card section showing the Schedule: Scheduled Start and Scheduled End.
   - A "Select Technician" section with a searchable dropdown ("Search and select a technician...").
10. Use the **Search and select a technician...** dropdown to find and select a technician. Options display as `{first_name} {last_name} ({email})`.
11. Click the **Assign** button in the modal footer (disabled until a technician is selected; loading while `assignTechnician.isPending`).
12. On success:
    - The modal closes.
    - TanStack Query cache is invalidated for `['appointments']` and `['document-approvals']`.
    - The active tab switches automatically to **All Appointments**.
13. To cancel the modal without assigning, click **Cancel** (the X button or the modal's cancel handler). The modal closes and no assignment is made.

---

## Steps — View an Appointment Detail (All Appointments Tab)

1. Navigate to `/scheduling` (Dispatch Board).
2. Stay on the **All Appointments** tab (default tab).
3. Optionally, type in the **Search appointments...** input to filter by a search term (500 ms debounce).
4. Optionally, use the **Filter by status** dropdown to filter by: Scheduled, In Progress, Completed, or Cancelled.
5. Optionally, click **Reload** (icon: ReloadOutlined) to manually refresh the appointments list.
6. Click the **View** button (icon: EyeOutlined, tooltip: "View") in the Actions column for any row.
7. The "Appointment Details" modal opens (width: 700px, footer: none).
8. The modal displays a Descriptions grid (2 columns, bordered, size small) with: Agent, Status, Work Order, Crew ID, Scheduled Start, Scheduled End, Actual Start, Actual End, Recurring (Yes/No tag), Recurrence Rule, Notes, Created At, Updated At.
9. Close the modal by clicking the X button (onCancel sets `detailVisible` to false).

---

## Notes on Tab Behaviour
- Switching tabs resets page to 1, clears search input, and clears the status filter.
- Pagination shows "Total {n} appointments" and supports page size changes.
- The table supports sortable columns: Scheduled Start, Scheduled End, Created At (defaultSortOrder: descend).
- The **Reload** button is only visible on the table tabs (not on the Live Map tab).
