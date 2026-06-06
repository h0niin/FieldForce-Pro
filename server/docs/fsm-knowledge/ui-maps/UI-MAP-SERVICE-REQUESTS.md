# UI Spatial Map — Service Requests
**Verified against:** RequestListPage.tsx, RequestDetailPage.tsx, RequestFormPage.tsx
**Audit status:** Code-verified. Every element listed below was confirmed to exist in JSX source.

---

## Page: Service Request List (`/service-requests`)

### Page Header
- **Title:** Translated via i18n as "Service Requests" — top-left
- **Subtitle:** `"Manage incoming service requests"`
- **Button — top-right corner:** `"Add Request"` with PlusOutlined icon. Type: primary (blue). Guarded by `PermissionGuard permission="service_requests:create"`. Navigates to `/service-requests/new`.

### Four Tabs
The tab bar sits below the page header. The fourth tab is admin-only.

**Tab: `"All Requests"`** (default)

Filter controls (rendered only on this tab):
| Control | Placeholder |
|---|---|
| Search input | `"Search requests by subject"` |
| Status dropdown | `"Filter by status"` — options: New, Approved, Rejected |

Table columns (shared across all tabs):

| Column title | Notes |
|---|---|
| `"Request ID"` | Blue monospace bold text |
| `"Subject"` | Bold |
| `"Priority"` | Colour tag: red=Urgent, orange=High, blue=Medium, grey=Low |
| `"Status"` | Colour tag. Note: status value `'new'` displays as **`"Pending Approval"`** (not "New") |
| `"Channel"` | Tag (Phone, Email, Portal, Web Form, API, WhatsApp, SMS) or dash |
| `"Customer"` | Contact full name or dash |
| `"Technicians"` | Avatar chips with initials or dash |
| `"Created"` | Date/time |
| `"Actions"` | Icon-only buttons (no text labels). View: EyeOutlined icon (tooltip: "View"). Edit: EditOutlined (tooltip: "Edit", **admin only**). Delete: DeleteOutlined, danger style (tooltip: "Delete", **admin only**). |

> ⚠️ CODE VERIFIED: The Edit and Delete action buttons are **admin-only** (`isAdmin` guard).

**Tab: `"My Approvals"`**
Same table columns. Actions column shows:
- View: EyeOutlined icon (tooltip: "View") — icon-only, no text
- Approve: CheckCircleOutlined icon (tooltip: "Approve") — icon-only, no text. Green tint.
- Reject: CloseCircleOutlined icon (tooltip: "Reject") — icon-only, no text. Danger/red.

**Tab: `"Priority Queue"`**
Reduced table columns: `"Request ID"` · `"Subject"` · `"Priority"` · `"Status"` · `"Created"` · `"Actions"`

The `"Priority"` column is editable inline — a Select dropdown replaces the static tag.

Actions column — all icon-only, no text labels:
- View: EyeOutlined (tooltip: "View")
- Approve & Create Work Order: CheckCircleOutlined, green tint (tooltip: "Approve & Create Work Order") — **admin only AND status must NOT be `'converted_to_wo'`, `'closed'`, `'spam'`, or `'rejected'`**
- Reject: CloseCircleOutlined, danger/red (tooltip: "Reject") — **admin only AND same status condition**

**Tab: `"Flagged Requests"`** (**admin-only** — tab is not rendered for non-admins)
Actions column: View: EyeOutlined icon (tooltip: "View Details") — icon-only, no text.

### Approval/Rejection Confirmation Modal
Triggered by: Approve or Reject icon buttons on the **"My Approvals"** or **"Priority Queue"** tab.

- Modal title: `"Approve Service Request"` or `"Reject Service Request"` (runtime conditional)
- Body text (Approve): `"Are you sure you want to approve {subject}?"` — subject is bold
- Body text (Reject): `"Are you sure you want to reject {subject}? This will skip all remaining approvers."` — subject is bold
- Text area: no label. Placeholder: `"Add comments (optional)"` (3 rows)
- Footer OK button: `"Approve"` (primary) or `"Reject"` (danger/red)

---

## Page: Service Request Detail (`/service-requests/:id`)

### Page Header
- **Back arrow** (top-left): Navigates to `/service-requests`
- **Title:** The request's subject text
- **Buttons — top-right (admin only — `isAdmin` guard on the entire button group):**
  1. `"Assign Technician"` — UserAddOutlined icon
  2. `"Approve & Create Work Order"` — SwapOutlined icon. Shown only when `request.status` is NOT in `['converted_to_wo', 'closed', 'spam', 'rejected']`.
  3. `"Edit"` — EditOutlined icon. Navigates to `/service-requests/:id/edit`.
  4. `"Delete"` — DeleteOutlined icon, danger style.

> ⚠️ CODE VERIFIED: **All four header buttons are admin-only.** Non-admin users see no action buttons in the page header.

### Spam Alert Banner
Shown **only when `request.is_spam` is true**. Yellow warning Alert with message: `"This request was flagged as potential spam/duplicate"` and a description showing reason and confidence.

### Status Transition Card
Shown **only for admin users (`isAdmin`) AND only when `availableTransitions.length > 0`**.
- Label: `"Transition to:"`
- Row of small primary-blue buttons, one per valid next status.

### "Your Approval Required" Card
Shown **only when BOTH `canActOnApproval` AND `myPendingApproval` are true** (the logged-in user is specifically the next pending approver in the workflow sequence).

- Card title: `"Your Approval Required"`
- Has a yellow/amber border colour.
- `"Approve"` — primary blue button, CheckCircleOutlined icon (left)
- `"Reject"` — danger/red button, CloseCircleOutlined icon (right)

### Main Information Card — "Service Request Information"
Two-column bordered Descriptions grid:

| Field label | Notes |
|---|---|
| `"Request ID"` | Blue monospace bold |
| `"Subject"` | |
| `"Status"` | Colour tag |
| `"Priority"` | Colour tag |
| `"Channel"` | Tag or faded dash |
| `"Category"` | Tag or faded dash |
| `"Customer"` | Full name or faded dash |
| `"Location"` | Address or faded dash |
| `"Description"` | Full text or faded dash |
| `"Scheduled Date"` | Date/time or faded dash |
| `"Assigned Technicians"` | Avatar/name tags or faded dash |
| `"Created At"` | |
| `"Updated At"` | |

### Service Location Card
Shown **only when both `lat` AND `lng` are present** on the request's location.

- Card title includes a map-pin (EnvironmentOutlined) icon
- Address text + small grey GPS coordinates
- Embedded OpenStreetMap iframe (height: 200px)
- `"Get Directions"` — primary blue button, EnvironmentOutlined icon, at the bottom of the card

### "Approval Status" Card
Shown **only when `typedApprovals` exists AND has at least one item**.

- Card title: `"Approval Status"`
- Vertical Steps component. Each step represents one approver. Icons:
  - ✅ CheckCircleOutlined (green) = Approved
  - ❌ CloseCircleOutlined (red) = Rejected
  - 🕐 ClockCircleOutlined (orange) = Pending
  - — MinusCircleOutlined (grey) = Skipped
- Step description shows decision date and comments.

### Attachments Section
File upload drag-and-drop zone (FileUploadZone component).

### "Assign Technicians" Modal
Triggered by: `"Assign Technician"` button (admin only).

- Modal title: `"Assign Technicians"`
- Body: `"Select one or more technicians to assign to this service request:"`
- Multi-select dropdown, placeholder: `"Search and select technicians"`. Options format: `"{First} {Last} ({email})"`.
- Footer OK button: `"Save"`. **Disabled until at least one technician is selected.**

### Approval Action Modal
Triggered by: `"Approve"` / `"Reject"` buttons in the `"Your Approval Required"` card.

- Modal title: `"Approve Service Request"` or `"Reject Service Request"` (runtime conditional)
- Body (Approve): `"Are you sure you want to approve this service request?"`
- Body (Reject): `"Are you sure you want to reject this service request? This will skip all remaining approvers."`
- Text area: no label. Placeholder: `"Add comments (optional)"` (3 rows)
- Footer OK button: `"Approve"` or `"Reject"` (danger for reject)

---

## Page: Service Request Form (`/service-requests/new` or `/:id/edit`)

### Page Header
- **Back arrow** (top-left): Navigates to `/service-requests`
- **Title:** `"New Service Request"` or `"Edit Service Request"` (conditional on `isEdit`)
- **Subtitle:** `"Create a new service request and assign a location"` (new) or `"Editing request: {subject}"` (edit)

### Two-Column Layout
Left column = Request Details card. Right column = Service Location card.

### Left Column — Form Fields (exact labels from Form.Item `label` props)

| Label | Type | Required | Notes |
|---|---|---|---|
| `"Subject"` | Text input | ✅ | Placeholder: `"e.g. AC unit not cooling"` |
| `"Description"` | TextArea (3 rows) | — | Placeholder: `"Describe the service request in detail..."` |
| `"Scheduled Date"` | Date picker | ✅ | Placeholder: `"Select scheduled date"`, format: `"YYYY-MM-DD"` |
| `"Customer (Contact)"` | Searchable select | ✅ | Placeholder: `"Select customer"`. Dropdown footer has a **`"Create New Customer"`** link button (PlusOutlined icon). |
| `"Customer Phone"` | Read-only input | — | Appears only after a customer is selected. Shows their phone or `"No phone on record"`. Warning suffix `"Add phone in Contacts"` shown when no phone exists. |
| `"Priority"` | Select (left half) | — | Placeholder: `"Select"`. Options: Low, Medium, High, Urgent |
| `"Category"` | Select (right half) | — | Placeholder: `"Select"`. Options: HVAC, Plumbing, Electrical, Appliance, General, Other |
| `"Assigned Technicians"` | Multi-select | — | Placeholder: `"Select technicians"` |
| `"Attachments (optional)"` | Upload drag-drop zone | — | Text: `"Click or drag files to attach"`, hint: `"Supports images, PDF, Word, Excel"` |
| `"Channel"` | Select | — | Placeholder: `"Select channel"`. Options: Phone, Email, Portal, Web Form, API, WhatsApp, SMS |

### Right Column — Service Location Card
- Card title includes EnvironmentOutlined icon + `"Service Location"` + red asterisk (required)
- Card shows a count: `"{N} location{s} available"`
- Hidden form field for `location_id` (validation only, not visible)

**Quick-select dropdown:**
- Bold label: `"Quick select:"`
- Searchable select, placeholder: `"Select from existing locations..."`

**Divider:** horizontal line with text `"or find on map"`

**Address search AutoComplete:**
- Placeholder: `"Search address..."`
- Shows `"🔍 Searching..."` while loading
- Shows `"No results found"` or `"Search failed. Try again."` on error

**Location button:**
- `"Use My Current Location"` — full-width button, AimOutlined icon (or LoadingOutlined when fetching GPS)

**Interactive map** (height: 350px):
- OpenStreetMap tiles
- Blue/green CircleMarkers = existing service locations. Click one to select it.
- DraggableMarker = currently selected location. Shown only when `mapCoords.lat !== 0 && mapCoords.lng !== 0`.
- GeoJSON boundary polygon shown when a boundary exists:
  - Green polygon = matched (location is inside a known service territory)
  - Orange dashed polygon = unmatched

**Success alert** (below map, shown when `selectedLocation` is set):
Message: `"Matched service location: {address}"`

**Warning alert** (below map, shown when `noServiceWarning && !selectedLocation`):
Message: `"This location does not match any existing service location. Please select a location that was already created in the Service Locations page, or create a new service location first."`

**No-locations alert** (shown when `locations.length === 0`):
Message: `"No service locations available. Please create a service location first."`

**Helper text** (below map, always visible):
`"Search an address or click the map. Blue dots are existing service locations — your selection must match one."`

### Form Submission Buttons (bottom of page)
- **`"Create Request"`** (new) or **`"Update Request"`** (edit) — primary blue, SaveOutlined icon
- **`"Cancel"`** — default style, CloseOutlined icon. Navigates to `/service-requests`.
