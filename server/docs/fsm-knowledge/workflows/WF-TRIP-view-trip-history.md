# WF-TRIP-view-trip-history — View and Filter Trip History

## Module
Trips — `TripHistoryPage` (`/trips`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must have `trips:read` permission. If missing, an error alert reads: 'You don\'t have the "trips:read" permission. Contact an admin.'

---

## Steps — View Trip List

1. In the left sidebar under **Scheduling & Workforce**, click **Trip History**. The browser navigates to `/trips`.
2. The page header reads **"Trip History"** with subtitle "Track and analyze technician field trips".
3. Four stat cards display at the top:
   - **Total Trips** — count of displayed trips
   - **Completed** — count of completed trips
   - **Total Distance** — sum in km
   - **Avg Distance** — average in km
4. The trip table shows columns: **Technician**, **Work Order**, **Date & Time**, **Duration**, **Distance**, **Status**, and a **View Details** action (EyeOutlined icon).
5. Status tags: **In Transit** (processing/blue), **Completed** (success/green), **Cancelled** (default/grey).

---

## Steps — Filter Trips

1. Use the **Search** input (placeholder: "Search by WO number or status...") to search trips.
2. Use the **All Technicians** dropdown to filter by a specific technician.
3. Use the **All Status** dropdown (options: In Transit, Completed, Cancelled) to filter by status.
4. Use the **date range picker** (Start Date / End Date) to filter by date.
5. When any filter is active, a **Clear** link button (FilterOutlined) appears — click it to reset all filters.
6. An active trip counter tag appears on the right when trips are in progress: "{N} active trip(s)".

---

## Steps — View Trip Detail Drawer

1. Click the **View Details** eye icon button on any trip row, or click the row itself.
2. A **Drawer** slides in from the right (width: 560px) with:
   - **Header banner**: Technician avatar/name, status tag, linked work order tag (clickable, navigates to `/work-orders/:id`).
   - **Quick stats**: Distance (km), Duration, Avg Speed (km/h).
   - **Trip Details**: Start time, End time (or "In Transit" tag), linked Work Order.
   - **Trip Timeline**: Visual timeline with "Trip Started" and "Arrived at Destination" (or "In Transit").
   - **Route Map**: `ServiceLocationMap` component showing start and end coordinates.
3. Close the drawer by clicking the X button.

---

## Steps — Refresh Trip Data

1. Click the **Refresh** button (ReloadOutlined) in the page header to manually refetch all trip data.

---

## Steps — Navigate to Linked Work Order

1. In the trip table, click the blue link on the **Work Order** column (e.g., "WO-001") — navigates to `/work-orders/:id`.
2. In the detail drawer, click the work order tag or the work order link — navigates to `/work-orders/:id`.

---

## Actions Summary

| Action | Button/Element | Permission | API |
|---|---|---|---|
| View trip list | Sidebar **Trip History** | `trips:read` | `useTrips` |
| Search trips | Search input | `trips:read` | Query param `search` |
| Filter by technician | **All Technicians** dropdown | `trips:read` | Client-side filter |
| Filter by status | **All Status** dropdown | `trips:read` | Client-side filter |
| Filter by date | Date range picker | `trips:read` | Client-side filter |
| Clear filters | **Clear** link | `trips:read` | N/A |
| View trip detail | Eye icon or row click | `trips:read` | N/A (local state) |
| Refresh | **Refresh** button | `trips:read` | `refetch()` |
| Navigate to WO | WO link/tag click | `trips:read` | `navigate(/work-orders/:id)` |
