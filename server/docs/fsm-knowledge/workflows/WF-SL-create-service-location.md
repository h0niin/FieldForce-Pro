# WF-SL-create-service-location

## Action: Create a new service location

### Prerequisites:
- User must have the permission `service_locations:create`. If this permission is absent the "Add Service Location" button is not rendered on the list page.
- Map coordinates (latitude and longitude) are required. The form will not submit and will show a warning "Please pick a location on the map. Location coordinates are required." if `lat` or `lng` are missing.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. The page header shows subtitle "Manage service locations" and an **Add Service Location** button (`PlusOutlined` icon, `type="primary"`) in the header — visible only when the user holds `service_locations:create` permission.
3. Click **Add Service Location**.
4. The route navigates to `/service-locations/new`, rendering the "Add Service Location" page header (subtitle: "Create a new service location") with a back arrow.
5. The form is split into two columns:

   **Left column — "Location Details" card:**

   | Field label | Input type | Required | Notes |
   |---|---|---|---|
   | Contact | Select dropdown | No | Searchable. Shows "First Last (email)" per option. Placeholder: "Select a contact (optional)". `allowClear`. |
   | Company | Select dropdown | No | Searchable. Shows company name per option. Placeholder: "Select a company (optional)". `allowClear`. |
   | Address | TextArea (2 rows) | Yes | Validation: "Address is required". Placeholder: "123 Main St, City, State 12345". Can be auto-filled by the map picker. |
   | Gate Code | Text input | No | Placeholder: "e.g., #1234" |
   | Access Notes | TextArea (1 row) | No | Placeholder: "Enter through side gate" |
   | lat (hidden) | Hidden input | Yes (hidden) | Set by map picker. Validation: "Please pick a location on the map" |
   | lng (hidden) | Hidden input | Yes (hidden) | Set by map picker. Validation: "Please pick a location on the map" |

   **Right column — "Location on Map" card (`MapPicker` component):**

   The map picker card title is: `Location on Map` with a required asterisk (*).

   The picker offers three ways to set coordinates — see WF-SL-view-location-map.md for detailed map interaction steps. In brief:
   - Type in the "Search Address:" AutoComplete field (placeholder: "Search address (e.g. Kozhikode, Thamarassery)...") and select a suggestion to set coordinates and auto-fill the Address field.
   - Click **Use My Current Location** (`AimOutlined` icon). If geolocation is not supported: error message "Geolocation not supported". If permission denied: error message "Location permission denied. Please allow location access." If other error: "Unable to get your location. Please try again." On success: toast "Current location: {lat}, {lng}".
   - Click anywhere on the interactive map to drop the marker at that point. The map also accepts marker drag.

   After coordinates are set, a green-background coordinate display appears: `{lat}, {lng}` with optional `(in {boundaryName})`.
   A yellow territory boundary polygon is drawn on the map.
   The hint text reads: "Search a place or click on the map to set the location. Drag the marker to adjust. The yellow boundary shows the area territory."

6. Fill in "Address" (required). Set coordinates via the map picker (required).
7. Optionally select a Contact and/or Company.
8. Optionally fill in Gate Code and Access Notes.
9. Click **Create Location** (`SaveOutlined` icon, `type="primary"`, `htmlType="submit"`). The button shows a loading spinner while the mutation is pending.
   - On success, the user is navigated to `/service-locations`.
   - On error, the error is handled by the mutation hook.
10. To abort without saving, click **Cancel** (`CloseOutlined` icon). The user is navigated to `/service-locations`.
