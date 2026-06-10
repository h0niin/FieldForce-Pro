# Timesheets and Trips

---

## Timesheets

A timesheet records the hours a technician worked on a job. It tracks clock-in and clock-out times, travel time, break time, and whether the time is billable to the customer.

### Accessing Timesheets

Click **Timesheets** in the left sidebar.

### What is a Timesheet?

A timesheet entry links a technician to a specific service appointment and records:
- **Clock In / Clock Out** — actual start and end times
- **Travel Time** — how long the technician spent travelling to the job site
- **Work Time** — how long the technician spent actually working
- **Break Time** — any break taken during the appointment
- **Is Billable** — whether this time should be billed to the customer

### Timesheet Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Time logged, awaiting manager review |
| **Approved** | Manager has approved the timesheet |
| **Rejected** | Manager has rejected — technician may need to correct it |

### How a Technician Clocks In/Out (Mobile App)

1. Open the **mobile app**.
2. Navigate to the assigned work order.
3. Tap **Clock In** when arriving at the job site.
4. Tap **Clock Out** when the work is finished.
5. The system automatically calculates work time.
6. Alternatively, go to **More → Timesheets** to create a timesheet entry manually.

### How a Technician Adds a Timesheet Manually (Web)

1. Go to **Timesheets** in the sidebar.
2. Click **+ New Timesheet**.
3. Select the **Work Order** or **Appointment** this time is for.
4. Enter **Clock In** and **Clock Out** times.
5. Enter **Travel Time** and **Break Time** in minutes.
6. Toggle **Is Billable** on or off.
7. Click **Save**.

### Approving a Timesheet (Manager/Admin)

1. Go to **Timesheets** in the sidebar.
2. Filter by **Status = Pending** to see timesheets awaiting approval.
3. Click a timesheet to open it.
4. Review the details.
5. Click **Approve** to accept, or **Reject** to return it with a reason.
6. The technician is notified of the decision.

### Rejecting a Timesheet

1. Open the timesheet.
2. Click **Reject**.
3. Enter a reason (e.g., "Travel time seems too high, please clarify").
4. Click **Confirm Rejection**.
5. The technician sees the rejection reason and can correct and resubmit.

### Viewing All Timesheets

- Go to **Timesheets** to see all entries.
- Use filters: **Status** (Pending/Approved/Rejected), **Technician**, **Date Range**, **Work Order**.
- The list shows: Technician, Work Order, Clock In, Clock Out, Total Work Time, Travel Time, Billable, Status.

### Deleting a Timesheet

Only admins can delete timesheets. Open the timesheet, click the **Delete** icon in the actions, and confirm.

---

## Trips (GPS Trip History)

A trip is an automatically recorded journey by a technician from one location to another. When a technician uses the mobile app with GPS enabled, their travel is tracked and each trip is saved.

### Accessing Trip History

Click **Trips** in the left sidebar (or **Scheduling → Trip History**).

### What is a Trip Record?

A trip contains:
- **Start Location** — GPS coordinates and address of where the journey began
- **End Location** — GPS coordinates and address of the destination
- **Start Time / End Time** — when the journey started and ended
- **Distance (km)** — total distance travelled
- **Route Polyline** — the path taken, shown on the map
- **Technician** — who made the trip
- **Appointment** — the appointment this trip is linked to (if applicable)

### Viewing Trip History

1. Go to **Trips** in the sidebar.
2. The list shows all recorded technician trips.
3. Filter by **Technician**, **Date Range**, or **Appointment**.
4. Click a trip row to see the route on a map and the full details.

### Trip History on the Live Map

Go to **Scheduling → Map View** and select a technician's name to see:
- Their current real-time location
- Their trip history for the day shown as route lines on the map

### Why Are No Trips Showing?

If no trips appear, check:
1. The technician has the **mobile app** installed and logged in.
2. Location permission is **Always** (not just "While Using App") in phone settings.
3. The technician's **GPS tracking** is enabled in their app settings.
4. The company has GPS tracking enabled in **Settings → Organisation**.

### Privacy Note

GPS tracking only runs when the technician is on duty (clocked in or has an active appointment). Administrators can see trip history, but tracking stops outside working hours if the technician logs off or has no active appointments.
