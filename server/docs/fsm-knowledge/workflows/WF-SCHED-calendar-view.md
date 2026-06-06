# WF-SCHED-calendar-view — Calendar View for Service Appointments

## Module
Scheduling — CalendarViewPage (`/scheduling/calendar`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- Technician role users are explicitly allowed access to `/scheduling/calendar` by TechnicianGuard.
- Appointments are loaded via `useAllAppointments()` (all pages, no pagination). If none exist, calendar cells are empty and the right panel shows "No appointments on this day".

---

## Steps — Navigate to the Calendar View

1. In the left sidebar, expand the **nav.scheduling** submenu (Scheduling & Workforce section).
2. Click **Calendar View** to navigate to `/scheduling/calendar`.
3. The page title "Calendar View" renders with subtitle "Visual calendar for service appointments".
4. The layout has two columns:
   - **Left (18/24 grid)**: the calendar card.
   - **Right (6/24 grid)**: a day-detail panel and a Status Legend card.

---

## Steps — Navigate the Calendar (Month vs Year)

1. In the calendar card header, a **Month / Year** Select dropdown (value: `month` by default, width: 100px) is shown next to the "Service Appointments" title.
2. To switch to year view, click the dropdown and select **Year**.
3. In Year view, `dateCellRender` is not applied; the calendar renders month cells only.
4. In Month view, each day cell shows up to 3 appointment chips. If more than 3 exist, "+{n} more" is shown (fontSize 10, color #6b7280).
5. Use the built-in Ant Design Calendar navigation arrows (Previous / Next month or year) to move between periods.
6. Clicking a day cell sets `selectedDate` and updates the right panel to show appointments for that day.

---

## Steps — Filter by Agent

1. In the calendar card's top-right toolbar, click the **All agents** dropdown (width: 200px).
2. Select a specific agent. Options display as `{first_name} {last_name}`.
3. An **AgentBanner** appears above the calendar, showing:
   - Agent initials avatar
   - Agent full name
   - "{n} jobs in {MMMM}" for the currently visible month
   - "{n} active" (statuses: scheduled, in_progress)
   - "{n} completed" (CheckCircleOutlined icon)
   - A **Clear agent filter** button (icon: CloseOutlined, tooltip: "Clear agent filter"). Clicking it sets `selectedAgent` back to undefined and removes the banner.
4. The calendar cells and day panel now show only appointments for the selected agent.

---

## Steps — Filter by Status

Two ways to filter by status are available:

**Method A — Dropdown in card toolbar:**
1. Click the **All statuses** dropdown (width: 155px) in the top-right of the calendar card.
2. Select one of: Scheduled, In Progress, Completed, Cancelled.
3. The calendar and day panel filter immediately.
4. To clear, click the X in the dropdown.

**Method B — Status Legend card (right panel):**
1. In the Status Legend card (bottom of the right column), click any status swatch/label to toggle that status filter.
   - Statuses: Scheduled (blue), In Progress (purple), Completed (green), Cancelled (grey).
2. The selected status is highlighted (fontWeight 600); others dim (opacity 0.3).
3. If a status is already selected and clicked again, the filter is cleared (toggle off).
4. When a status is active, a **Clear status filter** button (type: link, size: small, fontSize 11) appears below the legend. Clicking it sets `selectedStatus` back to undefined.

---

## Steps — View Appointments for a Specific Day

1. Click any day cell in the calendar.
2. The right panel card header updates to show the selected day: `{dddd}` (day name) and `{MMMM D, YYYY}` (date).
3. If appointments exist for that day, a blue badge showing the count appears in the card's extra slot.
4. Appointments are grouped:
   - **Active** (scheduled, in_progress): rendered first.
   - **Completed / Cancelled**: rendered below a divider labelled "Completed / Cancelled".
5. Each appointment is shown as an AppointmentCard with:
   - Work order number (bold, fontSize 13)
   - Status tag (colour-coded)
   - Time range: `{h:mm A} → {h:mm A}` (ClockCircleOutlined icon)
   - Address (EnvironmentOutlined icon) — shown only if `work_order.location.address` is populated
   - Agent name with initial avatar — shown only when no agent filter is active and `agent_id` is populated
6. If no appointments exist for the selected day, an Empty state displays: "No appointments on this day" (or "No appointments for this agent on this day" when an agent filter is active).

---

## Steps — View Appointment Detail from Calendar

1. In the right panel, click the **View Appointment** button (icon: EyeOutlined, label: "View Appointment") on any AppointmentCard.
2. The browser navigates to `/scheduling?appointment_id={appt.id}`.
3. The DispatchBoardPage loads on the All Appointments tab. The appointment detail modal auto-opens because `appointment_id` is present in the query string.
4. The "Appointment Details" modal displays all appointment fields.

---

## Steps — View Appointment via Calendar Cell Chip

1. In a calendar day cell (Month view), click any appointment chip (the coloured bar showing time and WO number). Tooltip shows: work order label, time (with clock emoji), status colour swatch and label, and "Click to view details".
2. The browser navigates to `/scheduling?appointment_id={appt.id}` (same as above — the DispatchBoardPage with auto-opened detail modal).

---

## Steps — Navigate to Work Order from Calendar

1. In the right panel AppointmentCard, if `appointment.work_order_id` is populated, a secondary icon button appears (icon: FileTextOutlined, tooltip: "Open Work Order").
2. Click the **Open Work Order** button (icon: FileTextOutlined, no text label, size: small, height/width: 26px).
3. The browser navigates to `/work-orders/{work_order_id}`.

---

## Appointment Chip Appearance Rules
| Status | Left border colour | Text colour | Opacity | Text decoration |
|---|---|---|---|---|
| scheduled | #1d4ed8 | #1d4ed8 | 1.0 | none |
| in_progress | #7c3aed | #7c3aed | 1.0 | none |
| completed | #16a34a | #9ca3af | 0.65 | none |
| cancelled | #9ca3af | #9ca3af | 0.65 | line-through |
