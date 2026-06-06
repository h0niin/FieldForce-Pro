# WF-SCHED-map-view — Map View: Technician Job Locations and Distance Calculator

## Module
Scheduling — MapViewPage (`/scheduling/map`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- Agents/technicians must exist in the system; otherwise the Technicians panel shows "No agents".
- Appointment job locations are only plotted on the map when the related Work Order has `location.lat` and `location.lng` populated.
- Live GPS for an agent is shown only when a location record exists with `recorded_at` within the last 2 hours.

---

## Steps — Navigate to Map View

1. In the left sidebar, expand the **nav.scheduling** submenu (Scheduling & Workforce section).
2. Click **Map View** to navigate to `/scheduling/map`.
3. The page title renders as "Map View" with subtitle "Select a technician to see their scheduled job locations and distances".
4. A **Refresh** button (icon: ReloadOutlined, label: "Refresh") is shown in the page header. Clicking it refetches all appointments (`refetch()`). The button shows a loading spinner while `apptLoading` is true.

---

## Steps — View Fleet Statistics

On page load, four stat cards are always visible (no interaction required):
- **Total Agents** (icon: UserOutlined, blue) — count of all agents.
- **Active Jobs** (icon: ClockCircleOutlined, green) — appointments not in `completed` or `cancelled` status.
- **In Progress** (icon: ThunderboltOutlined, purple) — appointments with status `in_progress`.
- **Completed** (icon: EnvironmentOutlined, green) — appointments with status `completed`.

---

## Steps — Select a Technician to View Their Jobs on the Map

1. In the **Technicians** panel (left column, labelled with UserOutlined icon and "Technicians"), a list of all agents is shown.
2. Each AgentRow displays:
   - An avatar with the agent's initials.
   - A green or grey dot badge: green means "Live GPS" (location recorded within last 2 hours); grey means "No GPS" or status not yet determined.
   - Agent full name.
   - "{n} active" — count of non-completed, non-cancelled appointments for that agent.
3. Click any AgentRow to select that technician. The row highlights with a blue border and blue avatar.
4. On click, the following state resets:
   - `fromType` switches to `'agent'` (Agent's Current Location radio button selected).
   - `customLatLng` clears.
   - `customAddress` clears.
   - `geocodeError` clears.
   - `matchedAddress` clears.
   - `mapFlyTo` clears.
5. The center map panel loads a Leaflet map (height: 560px) keyed to the selected agent's ID.
6. The map centers on the first appointment with coordinates, or on the agent's GPS location, or on the world center [20, 0] if neither is available.

---

## Steps — View Agent's Jobs and Distances on the Map

After selecting a technician:

1. The map renders appointment markers for each appointment that has `work_order.location.lat` and `work_order.location.lng` populated.
2. Each marker is a numbered, colour-coded pin (`#{idx+1}`). Marker colours by status:
   - scheduled: #1677ff (blue)
   - in_progress: #722ed1 (purple)
   - completed: #52c41a (green)
   - cancelled: #ff4d4f (red)
3. If the agent has a live GPS location (`agentLocation.lat` and `agentLocation.lng` populated), a special "👤" agent icon (blue circle, 38px) is placed at the agent's current position.
4. Click the agent marker to open its popup: shows "📍 {first_name} {last_name}" and "Last seen: {formatted datetime}".
5. Click any appointment marker to open its popup, which shows:
   - "#{idx+1} — {wo_number or 'Work Order'}" (bold)
   - "📍 {address or 'No address'}" (fontSize 12)
   - Status tag (colour-coded, uppercase with underscores replaced by spaces)
   - Scheduled start datetime (fontSize 11, color #666)
   - Distance label "📏 {n.n} km from base" (fontSize 12, blue, bold) — shown only when a "from" location is set (agent GPS or custom geocoded).
6. In the right **{firstName}'s Jobs** panel, a list of all the agent's appointments is shown (all statuses). Each card shows:
   - Row index tag `#{idx+1}`
   - Work order number (bold, fontSize 13)
   - Status tag (uppercase)
   - Address (EnvironmentOutlined icon)
   - Scheduled start datetime (ClockCircleOutlined icon)
   - Distance "📏 {n.n} km (straight-line)" if a "from" location is set and coordinates exist.
   - "📍 No coordinates on this location" if the appointment has no lat/lng.
   - "No live GPS from agent" or "Enter base location above" if from-location is not yet set.
7. Completed and cancelled appointment cards are rendered with reduced opacity (0.7) and a grey background (#fafafa).

---

## Steps — Calculate Distance from Agent's Current Location

1. After selecting a technician (AgentRow click), the distance-from selector card is shown above the map.
2. The **Agent's Current Location** radio button (icon: AimOutlined, value: `'agent'`) is selected by default.
3. If the agent has a live GPS location, dashed polylines are drawn on the map from the agent's pin to each appointment marker. Line colour matches the appointment's status colour. Line weight: 1.5, dashArray: `6 4`, opacity: 0.7.
4. Distance values ("📏 {n.n} km") appear in both the map popup and the right-side job list.
5. If no live GPS is available for the agent, a warning "⚠ No live GPS from this agent yet" appears next to the radio group.

---

## Steps — Calculate Distance from Office / Godown

1. In the distance-from selector card, click the **Office / Godown** radio button (icon: EnvironmentOutlined, value: `'custom'`).
2. A text input appears ("Enter office or godown address…", width: 320px) alongside a **Locate** button (icon: SearchOutlined, size: small, label: "Locate").
3. Type the office or godown address into the input.
4. Either press Enter (onPressEnter) or click the **Locate** button. The button shows a loading spinner while geocoding (`geocoding` state true).
5. Nominatim (OpenStreetMap geocoder) is queried with the address. No API key is required.
6. On success:
   - A green confirmation box appears: "Matched location:" with the full display name returned by Nominatim, and the note "If this is wrong, type a more specific address and click Locate again."
   - The map flies to the matched coordinates (FlyTo animation, duration 1.2s, zoom 13).
   - An orange square "🏢" icon (38px) is placed on the map at the matched location. Clicking it opens a popup: "🏢 Base Location" with the entered address text.
   - Dashed polylines are drawn from the office marker to each appointment marker.
   - Distance values update in the map popups and the right-side job list.
7. On failure, a red error message appears: "Address not found. Try a more specific address."
8. Changing the input text clears the error, matched address, and the custom lat/lng (requiring a new **Locate** click).
9. Switching back to **Agent's Current Location** radio clears `geocodeError`, `matchedAddress`, and resets `mapFlyTo` to null.

---

## Map Behavior Notes
- The map is not rendered until a technician is selected; the map area shows "Select a technician from the left to view their job locations" (EnvironmentOutlined icon, type: secondary text).
- The map instance is re-created (React key change) when the selected agent changes, ensuring a clean state.
- If no appointments have coordinates and no agent GPS is available, the map centers on [20, 0] (world center, zoom 12).
- Polylines are drawn only when a "from" location is available (agent GPS or geocoded custom address).
- Distance calculation uses the Haversine formula (straight-line, not road distance). The label "(straight-line)" appears in the job list cards.
