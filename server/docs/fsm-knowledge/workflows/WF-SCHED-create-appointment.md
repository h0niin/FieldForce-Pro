# WF-SCHED-create-appointment — Create a Service Appointment

## Module
Scheduling — AppointmentFormPage (`/scheduling/new`)

## Prerequisites
- User must be authenticated (PrivateRoute guard enforced by router).
- User must not have the "Technician" role; Technicians are blocked from `/scheduling/new` by TechnicianGuard and redirected to `/dashboard`.
- At least one Work Order must exist in the system (the Work Order selector loads up to 100 records).
- At least one Agent/Technician user must exist for the "Technician / Agent" dropdown.

---

## Steps — Create a New Service Appointment (standalone)

1. In the left sidebar, expand the **nav.scheduling** (Scheduling & Workforce section) submenu.
2. Click **Dispatch Board** to navigate to `/scheduling`.
3. The Dispatch Board page loads. There is no "New Appointment" button on DispatchBoardPage itself; navigate directly to `/scheduling/new`.
4. The page title renders as **Add Service Appointment** with subtitle "Create a new service appointment".
5. In the **Appointment Details** card, click the **Work Order** dropdown (labelled "Select a work order"). The dropdown is searchable. Select the desired work order — options display as `{wo_number} - {summary}`.
6. Click the **Technician / Agent** dropdown (labelled "Select a technician"). The dropdown is searchable. Select the desired agent — options display as `{first_name} {last_name} ({email})`. This field is required.
7. Optionally, type a value into the **Crew ID (Optional)** input ("Enter crew identifier").
8. Click the **Scheduled Start** date-picker ("Select start date & time"). Select a date and time. Format: `YYYY-MM-DD HH:mm`. This field is required.
9. Click the **Scheduled End** date-picker ("Select end date & time"). Select a date and time. Format: `YYYY-MM-DD HH:mm`. This field is required.
10. Optionally, enter text in the **Notes** textarea ("Enter any special instructions or notes for this appointment...").
11. In the **Recurrence Settings** card on the right, the **Recurring Appointment** switch defaults to "No". To make the appointment recurring, toggle it to "Yes" (checkedChildren="Yes", unCheckedChildren="No").
12. If **Recurring Appointment** is toggled to "Yes", the **Recurrence Rule** textarea appears (tooltip: "RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)"). Enter a valid RRULE string (examples shown inline: `FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, `FREQ=MONTHLY`, `FREQ=WEEKLY;INTERVAL=2`).
13. Click the **Create Appointment** button (icon: SaveOutlined, loading state while `createAppointment.isPending`).
14. On success, the router navigates to `/scheduling` (Dispatch Board).

---

## Steps — Create a Service Appointment from Work Order Approval Flow

This path is triggered when navigating to `/scheduling/new?work_order_id={id}` from a Work Order detail or approval page.

Prerequisites (additional):
- The Work Order identified by `work_order_id` query parameter must exist and be in an approved state.

1. Navigate to the approved Work Order detail page.
2. The Work Order approval flow redirects to `/scheduling/new?work_order_id={id}`.
3. The page title renders as **Schedule Service Appointment** with subtitle "Scheduling for Work Order {wo_number or id}".
4. A success alert banner displays: title "Work Order Approved", description "Work order {wo_number or id} has been approved. The scheduled dates have been pre-filled. Please assign a Technician / Agent to complete the schedule."
5. The **Work Order** dropdown is pre-filled and disabled (cannot be changed).
6. The **Scheduled Start** date-picker is pre-filled from the Work Order's `scheduled_start` and disabled.
7. The **Scheduled End** date-picker is pre-filled from the Work Order's `scheduled_end` and disabled.
8. Click the **Technician / Agent** dropdown and select the desired agent. This field is required and must be filled manually.
9. Optionally fill in **Crew ID (Optional)**, **Notes**, and **Recurrence Settings** as in steps 7–12 above.
10. Click **Create Appointment** (icon: SaveOutlined).
11. On success, the router navigates to `/work-orders/{fromWorkOrderId}` (back to the originating Work Order).
12. Clicking **Cancel** (icon: CloseOutlined) also navigates back to `/work-orders/{fromWorkOrderId}`.

---

## Steps — Edit an Existing Service Appointment

URL: `/scheduling/{id}/edit`

Prerequisites:
- The appointment identified by `:id` must exist.

1. Navigate to `/scheduling` (Dispatch Board).
2. Click the **View** button (tooltip: "View", icon: EyeOutlined) on any appointment row to open the "Appointment Details" modal.
3. From there, navigate externally to `/scheduling/{id}/edit` (no edit button exists within the modal; must navigate directly).
4. The page renders with a loading spinner (Spin size="large") while the appointment data is fetched.
5. The page title renders as **Edit Service Appointment** with subtitle "Editing appointment for {wo_number or 'Work Order'}".
6. All fields are pre-filled: Work Order (disabled, cannot change), Technician / Agent, Crew ID, Scheduled Start, Scheduled End, Notes, Recurring Appointment toggle, and Recurrence Rule.
7. Modify any editable fields.
8. Click **Update Appointment** (icon: SaveOutlined, loading while `updateAppointment.isPending`).
9. On success, the router navigates to `/scheduling`.
10. Clicking **Cancel** (icon: CloseOutlined) navigates to `/scheduling` without saving.

---

## Field Validation Rules (enforced client-side)
| Field | Rule |
|---|---|
| Work Order | Required — "Work order is required" |
| Technician / Agent | Required — "Agent is required" |
| Scheduled Start | Required — "Scheduled start is required" |
| Scheduled End | Required — "Scheduled end is required" |
| Recurrence Rule | Visible and editable only when "Recurring Appointment" switch is "Yes" |
