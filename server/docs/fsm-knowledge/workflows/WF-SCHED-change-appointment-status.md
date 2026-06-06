# WF-SCHED-change-appointment-status — Change Appointment Status

## Module
Scheduling — DispatchBoardPage (`/scheduling`), "Appointment Details" modal

## Status Transition Rules (enforced in code)

```
scheduled   → in_progress | cancelled
in_progress → completed   | cancelled
completed   → (no transitions available)
cancelled   → (no transitions available)
```

When the current status has no allowed transitions (completed, cancelled), the "Transition to:" section does not render.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must have at least one of the permissions `service_appointments:read` or `scheduling:read` to view the appointment (PermissionGuard around the View button).
- The appointment must be in a status that has at least one allowed transition (`scheduled` or `in_progress`). If the appointment is `completed` or `cancelled`, the transition controls are not shown.

---

## Steps — Transition Appointment Status from the Detail Modal

1. In the left sidebar, expand the **nav.scheduling** submenu (Scheduling & Workforce section).
2. Click **Dispatch Board** to navigate to `/scheduling`.
3. The page loads on the **All Appointments** tab. Both tabs (All Appointments and New / Assign) support the status-change workflow — the detail modal is available from both tabs.
4. Optionally filter by status using the **Filter by status** dropdown (on All Appointments tab only): Scheduled, In Progress, Completed, Cancelled.
5. Locate the appointment row in the table.
6. Click the **View** button (icon: EyeOutlined, tooltip: "View") in the Actions column.
7. The "Appointment Details" modal opens (width: 700px).
8. If the appointment's current status permits transitions, a card is displayed at the top of the modal body containing:
   - The label "Transition to:"
   - One button per allowed next status.
   
   Allowed transitions by current status:
   - Status **Scheduled**: buttons labelled **In Progress** and **Cancelled**
   - Status **In Progress**: buttons labelled **Completed** and **Cancelled**

9. Click the target status button (e.g., **In Progress**, **Completed**, or **Cancelled**). The button shows a loading spinner while `updateStatus.isPending`.
10. The `updateStatus.mutateAsync({ id, status: newStatus })` API call is made.
11. On success, the modal's displayed appointment data is updated in-place: the Status field in the Descriptions grid reflects the new status immediately (local state update via `setSelectedAppointment`).
12. The "Transition to:" card re-evaluates: if the new status has no further transitions (completed, cancelled), the card disappears.
13. Close the modal using the X button when done.

---

## Steps — Transition via Notification Deep-Link

The DispatchBoardPage auto-opens the detail modal when arriving via a URL with `?appointment_id={id}`:

1. Receive or click a notification link of the form `/scheduling?appointment_id={uuid}`.
2. The Dispatch Board loads on the **All Appointments** tab.
3. Once appointments are loaded, the page automatically finds the appointment matching `appointment_id` in the current page's data and opens its "Appointment Details" modal.
4. Follow steps 8–13 above to perform the status transition.

---

## Status Badge Colors (as rendered in the UI)
| Status | Tag Color |
|---|---|
| scheduled | blue |
| in_progress | processing (animated blue) |
| completed | green |
| cancelled | red |
