# Scheduling & Dispatch

## Accessing the Scheduling Module

Click **Scheduling** in the left sidebar.

## Views Available

| View | Description |
|------|-------------|
| **Calendar / Gantt** | Timeline view of all technicians and their appointments |
| **Map View** | Live map showing technician locations and job sites |
| **List View** | Tabular list of all appointments with status |

## The Gantt Chart

The Gantt chart shows each technician as a row and time as columns. Appointments appear as coloured blocks.

**Navigating the Gantt:**
- Use the **date arrows** (◀ ▶) at the top to move forward/backward by day or week.
- Use the **Today** button to return to the current date.
- Switch between **Day**, **Week**, and **Month** views using the toggle.
- Scroll horizontally to move through time; scroll vertically to see more technicians.

## Manually Assigning a Work Order

1. In the Gantt view, find an unassigned work order in the **Unscheduled** panel (right side or bottom, depending on layout).
2. Drag it onto the desired technician's row at the desired time.
3. A new service appointment is created and linked to the work order.
4. The technician receives a push notification.

## Using AI Auto-Schedule

The AI Auto-Schedule button analyses:
- Technician skills and certifications
- Current location and travel time
- Available time slots
- Job priority and SLA deadlines

To use it:
1. Click the **AI Auto-Schedule** button (top-right of the Scheduling page).
2. Select which unassigned work orders to include, or leave default (all unscheduled).
3. Click **Run Optimization**.
4. Review the proposed schedule in the preview.
5. Click **Apply** to confirm, or **Discard** to keep the current schedule.

## Creating a Service Appointment Manually

1. In the Gantt, click on an empty slot in a technician's row.
2. Fill in:
   - **Work Order** — link to the work order being scheduled
   - **Start Time** and **End Time**
   - **Notes** (optional)
3. Click **Save**. The appointment appears on the Gantt.

## Appointment Statuses

| Status | Meaning |
|--------|---------|
| `Scheduled` | Created, technician notified |
| `Dispatched` | Dispatcher confirmed and sent technician |
| `In Transit` | Technician en route to the job site |
| `On Site` | Technician has arrived |
| `In Progress` | Work has started |
| `On Hold` | Job paused (waiting for parts, etc.) |
| `Completed` | Job finished |
| `Cancelled` | Appointment cancelled |

## Dispatching a Technician

1. Open the appointment (click on the Gantt block or in the List view).
2. Click **Dispatch** to change status to `Dispatched`.
3. Optionally add dispatch notes.
4. The technician sees the appointment update in the mobile app.

## Live Dispatch Map

1. Click the **Map** tab in Scheduling.
2. The map shows real-time technician locations (requires mobile app with location permission).
3. Active job sites appear as pins; colour indicates appointment status.
4. Click a technician pin to see their current and next appointment.
5. Click a job site pin to see the work order details and dispatch controls.

## Editing an Appointment

1. Click on the appointment block in the Gantt or open it from the list.
2. Modify start/end time, technician, or notes.
3. Click **Save**. The technician is notified of the change.

## Deleting / Cancelling an Appointment

1. Open the appointment.
2. Click **Cancel Appointment**.
3. Enter a cancellation reason.
4. The associated work order returns to `Approved` status and appears in the Unscheduled panel.
