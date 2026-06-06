# WF-SL-view-location-map

## Action: View a service location on the map

There are two distinct map experiences: an embedded map on the Detail Page (read-only), and an interactive map picker on the Form Page (create/edit). Both are documented here.

---

## A. View map on the Service Location Detail Page (read-only)

### Prerequisites:
- User must have the permission `service_locations:read`. If this permission is absent the "View" icon button (tooltip: "View") is not rendered in the list Actions column.
- The service location record must have `lat` and `lng` values set. If either is null, the map card shows `<Empty description="No coordinates set" />` and the "View on Google Maps" button is not rendered.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. In the "Actions" column, click the icon button with tooltip **"View"** (`EyeOutlined` icon, text size small). The button is visible only when the user holds `service_locations:read` permission.
3. The route navigates to `/service-locations/{id}`, rendering the "Service Location Details" page header (subtitle: "Viewing location at {location.address}") with a back arrow.
4. The page layout has two columns:

   **Left column — "Location Information" card (`<Descriptions bordered>`):**
   - Address (with `EnvironmentOutlined` icon, span 2)
   - Access Notes
   - Gate Code (shown as a `<Tag color="green">` if set, otherwise "Not specified")
   - Latitude (6 decimal places, or "Not set")
   - Longitude (6 decimal places, or "Not set")
   - Created At
   - Updated At

   **Right column — "Map View" card:**
   - If `lat` and `lng` are both set:
     - An embedded Leaflet `<MapContainer>` with zoom level 15, centered at `[lat, lng]`. `scrollWheelZoom` is disabled.
     - OpenStreetMap tile layer (attribution: "OpenStreetMap").
     - A `<Marker>` at `[lat, lng]` with a `<Popup>` showing `{location.address}`.
     - Below the map: **View on Google Maps** button (`GlobalOutlined` icon, `type="primary"`, `block`).
   - If `lat` or `lng` is null: `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No coordinates set" />`.

   **Right column — "Custom Fields" card (conditional):**
   - Rendered only when `location.custom_fields` is non-null and has at least one key.
   - Shows each key-value pair as a `<Descriptions.Item>`.

5. To open the location in Google Maps, click **View on Google Maps**.
   - Opens `https://maps.google.com/?q={lat},{lng}` in a new browser tab (`_blank`).
6. To go back to the list, click the back arrow in the page header (navigates to `/service-locations`). If not found, a "Back to Service Locations" button is shown in the empty state.

---

## B. View coordinates in the List Page table

### Prerequisites:
- User must be on the Service Locations list page.
- The record must have `lat` and `lng` set.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. In the "Coordinates" table column:
   - If `lat` and `lng` are both set: a hyperlink shows `{lat.toFixed(6)}, {lng.toFixed(6)}` with tooltip **"Click to view on map"**.
   - If either is missing: the text "Not set" (color `#999`) is displayed.
3. Click the coordinate hyperlink.
   - Opens `https://maps.google.com/?q={lat},{lng}` in a new browser tab (`_blank`).

---

## C. Interactive map picker during Create or Edit (form page)

The `MapPicker` component renders in the right column of the Create/Edit form. It provides four coordinate-setting methods:

### Method 1: Address search (AutoComplete)

1. In the "Location on Map" card, locate the **Search Address:** AutoComplete field. Placeholder: "Search address (e.g. Kozhikode, Thamarassery)...".
2. Type at least 3 characters. After a 400ms debounce, the Nominatim geocoding API returns up to 5 address suggestions. Each suggestion is prefixed with a search emoji in the dropdown.
3. Click a suggestion.
   - The map flies to the selected location (`map.flyTo`, zoom 12, 1s duration).
   - A draggable marker is placed at the coordinates.
   - A yellow territory boundary polygon is drawn on the map (if the Nominatim reverse geocode returns a Polygon or MultiPolygon boundary).
   - A coordinate display appears: `{lat.toFixed(6)}, {lng.toFixed(6)}` optionally followed by `(in {boundaryName})`.
   - The "Address" text field in the "Location Details" card is auto-filled with the selected `display_name`.
   - A success toast: `Location set: {lat}, {lng}`.
   - The hidden `lat` and `lng` form fields are updated.

### Method 2: Use My Current Location button

1. Click **Use My Current Location** (`AimOutlined` icon). While fetching, the button shows `LoadingOutlined` and the `loading` prop is true.
2. The browser's Geolocation API is invoked with `enableHighAccuracy: true, timeout: 10000`.
3. On success:
   - The map flies to the current position.
   - A draggable marker is placed.
   - Territory boundary polygon is drawn.
   - Coordinate display is shown.
   - The "Address" field is auto-filled from reverse geocode `display_name` (if available).
   - Success toast: `Current location: {lat}, {lng}`.
4. On failure:
   - `PERMISSION_DENIED`: error toast "Location permission denied. Please allow location access."
   - Other error: error toast "Unable to get your location. Please try again."
   - Geolocation not supported: error toast "Geolocation not supported".

### Method 3: Click on map

1. Click anywhere on the interactive Leaflet map canvas.
2. The `MapClickHandler` component fires `onMapClick(latlng.lat, latlng.lng)`.
3. A draggable marker is placed at the clicked point.
4. Reverse geocode via Nominatim is called:
   - Territory boundary polygon is drawn (if applicable).
   - The "Address" field is auto-filled from `display_name` (if returned).
5. Hidden `lat` and `lng` form fields are updated.

### Method 4: Drag the marker

1. After a marker is placed by any of the above methods, click and drag the marker to a new position on the map.
2. The `DraggableMarker` component fires `onDragEnd(newLat, newLng)` when drag ends.
3. Nominatim reverse geocode is called for the new position:
   - Territory boundary polygon is redrawn.
   - The "Address" field is auto-filled.
4. Hidden `lat` and `lng` form fields are updated.

### Hint text (always visible below the map):
"Search a place or click on the map to set the location. Drag the marker to adjust. The yellow boundary shows the area territory."
