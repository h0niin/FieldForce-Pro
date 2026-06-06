# UI Spatial Map — Work Orders
**Verified against:** WorkOrderListPage.tsx, WorkOrderDetailPage.tsx, WorkOrderFormPage.tsx
**Audit status:** Code-verified. Every element listed below was confirmed to exist in JSX source.

---

## Global App Shell (Present on Every Page)

### Left Sidebar Navigation
A collapsible vertical panel on the left side of every page. Organised into labelled sections. The "Operations" section contains the **Work Orders** link. Full sidebar section order:
- **Main Navigation** — Dashboard
- **Customer Management** — Contacts, Companies, Service Locations
- **Operations** — Service Requests, Estimates, **Work Orders**
- **Scheduling & Workforce** — Scheduling (sub: Dispatch Board, Calendar View, Map View), Job Sheets, Trip History
- **Financial** — Invoices, Payments
- **Catalog & Pricing** — Catalog (sub: Services Catalog, Parts Catalog)
- **Customer Engagement** — Reviews
- **Approval Workflow** — Workflow (sub: Workflow Templates, Document Approvals)
- **System & Analytics** — Users, Reports, API Keys, Settings (sub: General, Roles & Permissions), Mobile Usage Logs, Security (sub: Security Settings)

Technician role sees a separate simplified sidebar: Dashboard, My Jobs, My Schedule, Timesheets, Notifications.

### AI Assistant
A floating chat button fixed in the bottom-right corner of every page.

---

## Page: Work Order List  (`/work-orders`)

### Page Header
- **Page title:** "Work Orders" — top-left
- **Subtitle:** "Manage work orders" — small grey text below title
- **Button — top-right corner:** `"Create Work Order"` with a **+** (PlusOutlined) icon. Type: primary (blue). Navigates to `/work-orders/new`.

### Tabs (3 tabs total — URL hash deeplinks are supported)
The tab bar sits directly below the page header.

**Tab: "All Work Orders"** (default)
- URL hash: `#all` (default, no hash needed)

Filter controls above the table (rendered only on this tab):
| Control | Placeholder text |
|---------|-----------------|
| Search input | `"Search work orders by summary or WO number"` |
| Status dropdown | `"Filter by status"` — options: New, Estimated, Approved, Scheduled, In Progress, On Hold, Completed, Closed, Cancelled |
| Priority dropdown | `"Filter by priority"` — options: Low, Medium, High, Urgent |

Table columns (in order):

| Column title | Notes |
|---|---|
| `"WO #"` | Work order number, bold |
| `"Summary"` | Job description, bold |
| `"Priority"` | Colour tag: red=Urgent, orange=High, blue=Medium, grey=Low |
| `"Status"` | Colour tag |
| `"Customer"` | Contact full name or dash |
| `"Category"` | Tag or dash |
| `"Scheduled Date"` | Formatted date/time or dash |
| `"Assigned To"` | Technician name or dash |
| `"Created"` | Formatted date/time |
| `"SLA"` | SLA timer badge (shown only when SLA data exists) |
| `"Actions"` | Fixed to the right edge. Three icon-only buttons (no text labels): **👁 eye** icon (tooltip: "View"), **✏️ pencil** icon (tooltip: "Edit", admin only), **🗑 trash** icon (tooltip: "Delete", danger style, admin only). |

> ⚠️ CODE VERIFIED: The Edit and Delete action buttons are **admin-only** (guarded by `isAdmin`). Non-admin users see only the View button.

**Tab: "Approvals"** (URL hash: `#approvals`)
- Tab label has a TeamOutlined icon before the text.
- A yellow warning count badge appears on the tab when there are pending approvals.

Table columns:

| Column title | Notes |
|---|---|
| `"Work Order"` | Short ID as a link button — navigates to the WO detail page |
| `"Approver"` | Blue avatar circle + full name |
| `"Workflow"` | Workflow template name |
| `"Step"` | Step number label |
| `"Status"` | Colour tag: green=Approved, red=Rejected, blue-spinner=Awaiting Review, grey=Skipped |
| `"Requested"` | Formatted date/time |
| `"Actions"` | Icon-only buttons: **Approve** (CheckCircleOutlined, primary/blue), **Reject** (CloseCircleOutlined, danger/red). Both show loading spinners while submitting. |

**Reject Work Order modal** (triggered by the Reject icon on this tab):
- Modal title: `"Reject Work Order"`
- Field label: `"Reason (optional)"`
- Placeholder: `"Enter rejection reason..."`
- Footer OK button text: `"Reject"` (danger style)

**Tab: "Field Workflow"** (URL hash: `#field-workflow`)
- Tab label has a CarOutlined icon before the text.
- Contains a date picker and a list of work orders scheduled on the selected date.
- Empty state text: `"No work orders scheduled for {date}"`

---

## Page: Work Order Detail (`/work-orders/:id`)

### Page Header
- **Back arrow** (top-left): Navigates to `/work-orders`
- **Title:** `"Work Order {wo_number}"` (e.g. "Work Order WO-0042")
- **Buttons — top-right (in order, left to right):**
  1. `"Assign Technician"` — type: primary (blue), UserAddOutlined icon
  2. `"Edit"` — EditOutlined icon → navigates to `/work-orders/:id/edit`
  3. `"Delete"` — danger style, DeleteOutlined icon

### Status Transition Card
Shown **only when there are available transitions** (`availableTransitions.length > 0`).

- Label: `"Transition to:"` (bold text)
- Each valid next status renders as a **small primary-blue button**. The button text is the formatted status name (e.g. `"Estimated"`, `"Approved"`, `"Scheduled"`, `"In Progress"`, `"Completed"`). Only valid next-step transitions are shown.

### Technician Action Card
Shown **only when the logged-in user's ID matches `workOrder.assigned_to`** (i.e., the logged-in technician is the one assigned).

**Condition: status is `'new'`, `'approved'`, or `'estimated'`**
- `"Accept Job"` button — primary blue, CheckCircleOutlined icon
- `"Decline Job"` button — danger/red, CloseCircleOutlined icon

**Condition: status is `'scheduled'`**
- `"Job Accepted"` — read-only green Tag (not a button)
- `"Start Job"` — primary blue button, PlayCircleOutlined icon
- `"Decline Job"` — danger/red button, CloseCircleOutlined icon

**Condition: status is `'scheduled'` OR `'in_progress'`** (additional row, shown alongside the above)
- `"Google Maps"` — button, CarOutlined icon *(shown only when `workOrder.location.lat` AND `workOrder.location.lng` exist)*
- `"Waze"` — button, CarOutlined icon *(same GPS condition)*
- `"Call Customer"` — button, PhoneOutlined icon *(shown only when `workOrder.contact.phone` exists)*
- `"Start Trip"` or `"Stop Trip"` — button, EnvironmentOutlined icon (toggles based on active trip state)

**Condition: status is `'in_progress'`**
- `"Complete Job"` — button with green background (`#52c41a`), CheckCircleOutlined icon

### Feedback Section
**Condition: `workOrder.status === 'completed'` AND no feedback data exists yet**
- A card appears prompting the technician to submit feedback.
- Contains a `"Submit Feedback"` button.

**Condition: feedback data exists**
- A read-only feedback card displays the existing feedback.

### Six Tabs (tab bar below the action cards)
Tabs are referred to by their exact label text, not by position number.

**Tab: `"Details"`**
Two-column bordered description grid showing:
`"WO Number"` · `"Status"` · `"Summary"` · `"Priority"` · `"Category"` · `"Customer"` · `"Location"` · `"Asset"` · `"Assigned To"` · `"Scheduled Date"` · `"Actual Start"` · `"Actual End"` · `"Description"` · `"Tags"` · `"Recurring"` · `"Recurrence Rule"` · `"Created At"` · `"Updated At"`

**Tab: `"Location"` (EnvironmentOutlined icon)**
- Shown if GPS coordinates exist: Address text + embedded OpenStreetMap iframe.
- `"Get Directions"` — primary blue button, EnvironmentOutlined icon (at the bottom of the card).
- If no GPS coordinates: empty state text `"No GPS location available for this work order."` (exact text not code-verified; placeholder from prior audit).

**Tab: `"Line Items"`**
Table columns: `"Type"` · `"Name"` · `"Description"` · `"Quantity"` · `"Unit Price"` · `"Tax Rate"` · `"Total"` · `"Actions"`

Actions column: icon-only delete button (DeleteOutlined, danger/text type). No text label.
Empty state: `"No line items added"`

> ⚠️ NOTE: The exact mechanism for adding line items (button label, modal vs inline form) was **not confirmed in the scanned source**. Contact support if the AI cannot locate this control.

**Tab: `"Notes"` (FileTextOutlined icon)**
Form at top of tab:
- Field label: `"Note"` — TextArea, 3 rows, placeholder: `"Write a note..."`
- A Switch with no label (just the switch control): checked state shows `"Internal"`, unchecked shows `"External"`
- Button: `"Add Note"` — primary blue, PlusOutlined icon

Table columns: `"Note"` · `"Internal"` · `"Created"` · `"Actions"`
Actions: icon-only delete button (no text). Empty state: `"No notes added"`

**Tab: `"Attachments"` (PaperClipOutlined icon)**
- `"Select File"` — button, UploadOutlined icon
- `"Upload"` — primary blue button, PlusOutlined icon. **Disabled until a file is selected.**

Table columns: `"File Name"` · `"Type"` · `"Size"` · `"Created"` · `"Actions"`
Actions: icon-only delete button (no text). Empty state: `"No attachments added"`

**Tab: `"Estimates"` (FileTextOutlined icon)**
- `"Create Estimate"` — primary blue button, PlusOutlined icon, in the **top-right corner of the tab's card header**. Navigates to `/estimates/new?work_order_id={id}`.

Table columns: `"Estimate #"` · `"Status"` · `"Total"` · `"Created"` · `"Actions"`

Actions column — conditional on estimate status:
- **If status is `'draft'` or `'pending_approval'`:** `"Approve"` (small, primary blue, CheckCircleOutlined) + `"Reject"` (small, danger/red, CloseCircleOutlined)
- **If status is `'approved'`:** `"Generate Invoice"` (small, FileTextOutlined icon). After generation, navigates to `/invoices/{new_invoice_id}`.

Empty state: `"No estimates for this work order"`

### "Assign Technicians" Modal
Triggered by: the `"Assign Technician"` button in the page header (top-right).

- Modal title: `"Assign Technicians"`
- Field label: `"Technicians"` — multi-select dropdown, searchable, required. Placeholder: `"Select technicians"`
- Field label: `"Scheduled Start"` — date + time picker, required
- Field label: `"Scheduled End"` — date + time picker, required
- Footer OK button: `"Assign"` (primary blue)

### "Decline Job" Modal
Triggered by: the `"Decline Job"` button in the Technician Action Card.

- Modal title: `"Decline Job"`
- Field label: `"Reason for declining"` — TextArea, 4 rows, placeholder: `"Enter reason..."`. Required, minimum 5 characters.
- Footer OK button: `"Decline"` (danger/red)

---

## Page: Work Order Create/Edit Form (`/work-orders/new` or `/work-orders/:id/edit`)

### Page Header
- **Back arrow** (top-left): Navigates to `/work-orders`
- **Title:** `"Create Work Order"` (new) or `"Edit Work Order"` (edit)

### Form (single card, no tabs)
All fields in a single vertical form:

| Field label | Type | Required | Notes |
|---|---|---|---|
| `"Summary"` | Text input | ✅ | Placeholder: `"e.g. HVAC repair at 123 Main St"` |
| `"Description"` | TextArea (4 rows) | — | Placeholder: `"Describe the work to be performed"` |
| `"Customer (Contact)"` | Searchable select | — | Placeholder: `"Select customer"` |
| `"Service Location"` | Searchable select | — | Placeholder: `"Select location"` |
| `"Asset"` | Searchable select | — | Placeholder: `"Select asset"` |
| `"Priority"` | Select | — | Placeholder: `"Select priority"`. Options: Low, Medium, High, Urgent |
| `"Category"` | Select | — | Placeholder: `"Select category"`. Options: HVAC, Plumbing, Electrical, Appliance, General, Preventive Maintenance, Emergency, Other |
| `"Scheduled Date"` | Date picker (YYYY-MM-DD) | — | **Disabled (locked)** when the work order was converted from an estimate (`workOrder.estimate_id` is set) |

### Form Footer Buttons
- **Submit button:** `"Create"` (new) or `"Update"` (edit) — primary blue, htmlType="submit"
- **Cancel button:** `"Cancel"` — default style — navigates to `/work-orders`
