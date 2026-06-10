# WF-TRACK-view-live-agents — View Live Technician Locations on Map

## Prerequisites
- User must have the `tracking:read` permission (Dispatcher, Admin, or Manager).
- At least one technician must have the mobile app running with GPS enabled.

## Steps

1. Click **Scheduling** in the left sidebar.
2. Click the **Map** tab at the top of the Scheduling page.
   Alternatively, go to **Dashboard → Live Map Dashboard** for a full-screen view.
3. The live map loads showing:
   - **Blue dots with names** = active technicians
   - **Coloured pins** = job sites (green = completed, orange = in progress, red = urgent/overdue, grey = scheduled but not started)
4. To see a technician's details:
   - Click on their blue dot on the map
   - An info card pops up showing: name, current status, current work order, phone number
   - Click the phone icon to call them directly
5. To see a job site's details:
   - Click on a job pin
   - An info card shows: work order summary, customer, address, scheduled time, assigned technician
6. To filter what is shown:
   - Use the **Technician Filter** panel (left sidebar or top filter bar) to toggle specific technicians on/off
   - Filter by **Territory** to show only one zone
   - Filter by **Status** to show only technicians with a specific appointment status
7. To see today's route for a technician:
   - Click their dot
   - Click **View Today's Route** in their info card
   - A path line shows where they have driven today

## Result
Real-time visibility of all technicians' positions and job site statuses on an interactive map.
