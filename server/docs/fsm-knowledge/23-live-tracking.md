# Live Tracking and GPS

## What is Live Tracking?

Live tracking shows the real-time location of all technicians on a map. Dispatchers can see exactly where each technician is, which job they are on, and how close they are to their next job site.

---

## Accessing Live Tracking

- Go to **Scheduling → Map View** from the top of the Scheduling page.
- Or go to **Dashboard → Live Map Dashboard** for a full-screen view.
- Or go to **Tracking** in the sidebar (if available in your navigation).

---

## What You See on the Live Map

| Element | Description |
|---------|-------------|
| **Blue dots** | Active technicians with their name label |
| **Green pins** | Completed job sites |
| **Orange pins** | In-progress job sites |
| **Red pins** | Urgent/overdue job sites |
| **Grey pins** | Scheduled but not yet started job sites |

Click a **technician dot** to see:
- Their name and profile photo
- Current status (En Route, On Site, On Break, etc.)
- Current work order they are assigned to
- Their phone number (click to call)

Click a **job pin** to see:
- Work order summary
- Customer name and address
- Assigned technician
- Scheduled and actual start time
- Current status

---

## How Technician Location Works

1. The technician must have the **mobile app** installed and logged in.
2. Location permission must be set to **Always Allow** in the phone's settings.
3. When the technician has an active appointment, their location is automatically sent to the server every 30 seconds.
4. The live map updates in near real-time.

### Troubleshooting: Technician Not Showing on Map

If a technician's location is not visible on the map:
1. Check the technician has the mobile app installed and is currently logged in.
2. Confirm the technician's phone has location services enabled for the app.
3. Check the app has **Always** location permission (not just "While Using").
4. The technician must have an **active appointment** for tracking to be active.
5. Check their phone has internet connectivity.
6. If the problem persists, ask the technician to force-close and reopen the app.

---

## Filtering the Live Map

- Toggle specific technicians on/off using the **Technician Filter** panel (left sidebar on the map).
- Filter by **Territory** to show only technicians in a specific area.
- Filter by **Status** to show only technicians on a specific appointment status.

---

## Route Lines (Trip Playback)

The live map can show the route a technician has taken today:
1. Click on a technician's dot.
2. In the info card, click **View Today's Route**.
3. The path they have driven today is drawn as a line on the map.

Full trip history is available in **Trips** in the sidebar.

---

## Customer Technician Tracking (Portal)

When a technician is dispatched, the customer receives a tracking link in their confirmation email/SMS. This opens a simplified map in their browser showing:
- The technician's real-time location
- The customer's address as the destination
- Estimated time of arrival

This is a view-only link — the customer cannot see any internal data.

---

## Agent Location History

Administrators can review a technician's location history for any day:
1. Go to **Tracking** in the sidebar (or **Workforce → Live Tracking**).
2. Select a **Technician** and a **Date**.
3. The route for that day is shown on the map with timestamps.
4. This is useful for verifying job visits, mileage claims, and time disputes.

---

## Privacy and GPS Tracking

- Tracking is **only active when the technician is on duty** (has an active appointment).
- Tracking **stops automatically** when the technician logs off or when their last appointment for the day is completed.
- Technicians can see in the app whether tracking is currently active (a GPS icon in the status bar).
- Company administrators set the tracking policy in **Settings → Organisation → GPS Tracking**.
