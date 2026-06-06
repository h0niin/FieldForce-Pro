# WF-SCHED-view-live-map — View the Live Dispatch Map

## Module
Scheduling — DispatchBoardPage (`/scheduling`), Live Map tab

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- Work Orders in the system must have a `location.lat` and `location.lng` populated; otherwise the map shows "No jobs with GPS location data found."
- The map is rendered only when the **Live Map** tab is active; the query is disabled on other tabs.

---

## Steps — Open and Use the Live Dispatch Map

1. In the left sidebar, expand the **nav.scheduling** submenu (Scheduling & Workforce section).
2. Click **Dispatch Board** to navigate to `/scheduling`.
3. The page loads on the **All Appointments** tab.
4. Click the **Live Map** tab (icon: EnvironmentOutlined, label: "Live Map").
5. When the Live Map tab is active:
   - The Search bar, status filter dropdown, and the appointments table are hidden.
   - The **Reload** button associated with the table is also hidden.
6. A Card renders with:
   - A **Refresh** button in the card's extra slot (icon: ReloadOutlined, size: small, label: "Refresh"). Clicking this manually refetches the work-orders-with-location query.
   - A legend row:
     - Tag "Unassigned" (color: red)
     - Tag "Assigned / In Progress" (color: blue)
     - Tag "Completed" (color: green)
     - Text "Auto-refreshes every 30s" (secondary, fontSize 12)
7. If no work orders have GPS coordinates, the message "No jobs with GPS location data found." is displayed inside the card.
8. If work orders with coordinates exist, a Leaflet map renders at 500px height with OpenStreetMap tiles.
9. The map is centred on the first work order that has a valid lat/lng, at zoom level 11. Scroll-wheel zooming is enabled.
10. Each work order with a location appears as a coloured map marker:
    - **Green marker**: status is `completed` or `closed`
    - **Blue marker**: status is any other value and `assigned_to` is populated
    - **Red marker**: status is any other value and `assigned_to` is not populated (unassigned)
11. Click any map marker to open its popup. The popup displays:
    - Work order number (bold): `{wo_number}` or `{id}`
    - Summary text (fontSize 12)
    - Status: a Tag showing the status (underscores replaced with spaces)
    - Address (fontSize 12, color #666) — shown only if `location.address` is populated
12. The map auto-refreshes every 30 seconds while the Live Map tab is active (refetchInterval: 30000). Switching away from the Live Map tab stops the auto-refresh interval.
13. To manually force a refresh at any time, click the **Refresh** button in the card header.

---

## Notes
- The Live Map tab fetches all work orders via `workOrdersApi.getAllNonPaginated()` — it is not filtered by pagination.
- Marker icon source: Leaflet color marker images hosted at `raw.githubusercontent.com/pointhi/leaflet-color-markers`.
- Map attribution: "© OpenStreetMap contributors".
