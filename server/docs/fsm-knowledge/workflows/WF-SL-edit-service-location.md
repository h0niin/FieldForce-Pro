# WF-SL-edit-service-location

## Action: Edit an existing service location

### Prerequisites:
- User must have the permission `service_locations:update`. If this permission is absent:
  - The "Edit" icon button (tooltip: "Edit") is not rendered in the Actions column of the list page.
  - The **Edit** button is not rendered on the detail page.

### Steps — from the List Page:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. Locate the service location row in the table.
3. In the "Actions" column, click the icon button with tooltip **"Edit"** (`EditOutlined` icon, text size small). This button is visible only when the user holds `service_locations:update` permission.
4. The route navigates to `/service-locations/{id}/edit`, rendering the "Edit Service Location" page header (subtitle: "Editing location at {location.address}") with a back arrow.
5. The form fields are pre-populated from the existing record:
   - Contact (contact_id), Company (company_id), Address, lat (hidden), lng (hidden), Gate Code, Access Notes.
   - The map picker is initialized with the existing lat/lng and address.
6. Modify any fields as needed.
   - To change coordinates, interact with the "Location on Map" map picker: use address search, click **Use My Current Location**, click on the map, or drag the marker. Each action updates the hidden `lat` and `lng` form fields.
   - To change the linked contact, use the "Contact" Select dropdown (searchable, `allowClear`).
   - To change the linked company, use the "Company" Select dropdown (searchable, `allowClear`).
7. Click **Update Location** (`SaveOutlined` icon, `type="primary"`, `htmlType="submit"`). The button shows a loading spinner while the mutation is pending.
   - On success, the user is navigated to `/service-locations`.
   - On error, the error is handled by the mutation hook.
8. To abort without saving, click **Cancel** (`CloseOutlined` icon). The user is navigated to `/service-locations`.

### Steps — from the Detail Page:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. Navigate to the service location detail page by clicking the "View" icon button (tooltip: "View", requires `service_locations:read`) in the Actions column, or navigate directly to `/service-locations/{id}`.
3. On the detail page, click the **Edit** button (`EditOutlined` icon, `type="primary"`) in the page header actions area. This button is visible only when the user holds `service_locations:update` permission.
4. Continue from step 4 of the list-page flow above.
