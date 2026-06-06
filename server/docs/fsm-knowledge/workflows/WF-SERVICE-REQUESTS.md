# Workflow SOPs — Service Requests
**Verified against:** RequestListPage.tsx, RequestDetailPage.tsx, RequestFormPage.tsx
**Audit status:** Code-verified. Steps reference only confirmed JSX elements.

---

## WF-SR-01: How to Create a Service Request

**Prerequisites:** Requires `service_requests:create` permission (enforced by `PermissionGuard`).

1. Click **Service Requests** in the left sidebar, under the **"Operations"** section.
2. On the Service Requests list page, click the **`"Add Request"`** button — primary blue, PlusOutlined icon — in the **top-right corner** of the page header.
3. You land on the New Service Request form at `/service-requests/new`.
4. Fill in the **left column** (Request Details):
   - **`"Subject"`** *(required)* — placeholder: `"e.g. AC unit not cooling"`
   - **`"Description"`** *(optional)* — TextArea, placeholder: `"Describe the service request in detail..."`
   - **`"Scheduled Date"`** *(required)* — date picker, placeholder: `"Select scheduled date"`, format `YYYY-MM-DD`
   - **`"Customer (Contact)"`** *(required)* — searchable select, placeholder: `"Select customer"`. If the customer doesn't exist, click **`"Create New Customer"`** — a link button with PlusOutlined icon at the bottom of the dropdown options.
   - **`"Customer Phone"`** — appears automatically after a contact is selected; read-only. Shows a warning `"Add phone in Contacts"` if no phone is on record.
   - **`"Priority"`** *(optional, left half)* — select, placeholder: `"Select"`. Options: Low, Medium, High, Urgent.
   - **`"Category"`** *(optional, right half)* — select, placeholder: `"Select"`. Options: HVAC, Plumbing, Electrical, Appliance, General, Other.
   - **`"Assigned Technicians"`** *(optional)* — multi-select, placeholder: `"Select technicians"`
   - **`"Attachments (optional)"`** — drag-and-drop upload zone. Accepts images, PDF, Word, Excel. Text: `"Click or drag files to attach"`
   - **`"Channel"`** *(optional)* — select, placeholder: `"Select channel"`. Options: Phone, Email, Portal, Web Form, API, WhatsApp, SMS.
5. Fill in the **right column** (Service Location — required):
   - **Option A:** Click `"Quick select:"` dropdown, placeholder: `"Select from existing locations..."`, and choose a pre-existing location.
   - **Option B:** Type in the address search box (placeholder: `"Search address..."`). Select from the autocomplete suggestions.
   - **Option C:** Click **`"Use My Current Location"`** — full-width button, AimOutlined icon — to use GPS.
   - The map will show a draggable marker at the selected location. A **green success alert** appears when the selection matches an existing service location record: `"Matched service location: {address}"`. A **yellow warning** appears if no match is found — you must first create the service location under the Service Locations module.
6. Click **`"Create Request"`** — primary blue button, SaveOutlined icon — at the bottom of the page.
7. You are redirected to the new service request's detail page.

---

## WF-SR-02: How to View a Service Request

1. Click **Service Requests** in the left sidebar.
2. On the **`"All Requests"`** tab (default), use the search bar (`"Search requests by subject"`) or the `"Filter by status"` dropdown.
3. Click the **eye icon** (EyeOutlined) button in the `"Actions"` column.
4. The detail page opens at `/service-requests/{id}`.

> Note: The status value `'new'` displays in the table as **`"Pending Approval"`** — not "New".

---

## WF-SR-03: How to Edit a Service Request

**Prerequisites:** Admin role required.

1. Open the service request detail page.
2. Click the **`"Edit"`** button (EditOutlined icon) in the **top-right corner** of the page header (third button from the right, after "Assign Technician" and "Approve & Create Work Order").
3. The edit form opens at `/service-requests/:id/edit`.
4. Make changes and click **`"Update Request"`** — primary blue button at the bottom.

---

## WF-SR-04: How to Delete a Service Request

**Prerequisites:** Admin role required.

1. Open the service request detail page.
2. Click the **`"Delete"`** button (DeleteOutlined icon, danger/red) — the **rightmost button** in the top-right header area.
3. Confirm deletion.

> Alternatively: on the list page `"All Requests"` tab, click the trash icon in the `"Actions"` column (admin only).

---

## WF-SR-05: How to Approve a Service Request from the List Page

**Prerequisites:** The logged-in user must be a designated approver for this request (the user's name appears in the "My Approvals" tab).

1. Click **Service Requests** in the sidebar.
2. Click the **`"My Approvals"`** tab (second tab).
3. Find the request in the table.
4. Click the **CheckCircleOutlined icon** button in the `"Actions"` column — no text label, green tint, tooltip: `"Approve"`.
5. A confirmation modal appears: title `"Approve Service Request"`, body text confirms the subject. An optional text area with placeholder `"Add comments (optional)"` is shown.
6. Click **`"Approve"`** — primary blue button in the modal footer.
7. Status changes to `'approved'`.

---

## WF-SR-06: How to Reject a Service Request from the List Page

**Prerequisites:** The logged-in user must be a designated approver.

1. Click **Service Requests** in the sidebar.
2. Click the **`"My Approvals"`** tab.
3. Find the request and click the **CloseCircleOutlined icon** button — no text label, danger/red, tooltip: `"Reject"`.
4. A modal appears: title `"Reject Service Request"`, body: `"Are you sure you want to reject {subject}? This will skip all remaining approvers."` Optional text area, placeholder `"Add comments (optional)"`.
5. Click **`"Reject"`** — danger/red button in the modal footer.

---

## WF-SR-07: How to Approve or Reject from the Detail Page

**Prerequisites:** BOTH `canActOnApproval` AND `myPendingApproval` must be true — the logged-in user must be specifically the **next pending approver** in the workflow sequence. If it is not your turn, this card will not appear even if you are an approver on the workflow.

1. Open the service request detail page.
2. Locate the **`"Your Approval Required"`** card — it has a yellow/amber border and appears below the status transition card. If this card is not visible, it is not your turn to approve.
3. Click **`"Approve"`** — primary blue button, CheckCircleOutlined icon (left button in the card).
4. OR click **`"Reject"`** — danger/red button, CloseCircleOutlined icon (right button).
5. A confirmation modal appears (same as WF-SR-05 / WF-SR-06 above). Confirm your action.

---

## WF-SR-08: How to Approve and Create a Work Order in One Step

**Prerequisites:** Admin role required. Request status must NOT be `'converted_to_wo'`, `'closed'`, `'spam'`, or `'rejected'`.

**Method A — From the detail page:**
1. Open the service request detail page.
2. Click **`"Approve & Create Work Order"`** — SwapOutlined icon button — in the **top-right corner** of the page header. This is the second button from the left (after "Assign Technician"). It is only visible when the status is not already closed/converted.
3. The request is approved and a linked work order is created in one step. You are navigated to `/work-orders/{new_wo_id}`.

**Method B — From the Priority Queue tab:**
1. Click **Service Requests** in the sidebar.
2. Click the **`"Priority Queue"`** tab (third tab).
3. Find the request. In the `"Actions"` column, click the **CheckCircleOutlined icon** button (no text label, green tint, tooltip: `"Approve & Create Work Order"`) — visible for admin users only when status allows.
4. Same outcome: approved + work order created.

---

## WF-SR-09: How to Assign Technicians to a Service Request

**Prerequisites:** Admin role required.

1. Open the service request detail page.
2. Click **`"Assign Technician"`** — UserAddOutlined icon button — in the **top-right corner** of the page header (leftmost of the header buttons).
3. A modal titled **`"Assign Technicians"`** appears. Body: `"Select one or more technicians to assign to this service request:"`
4. Click the multi-select dropdown (placeholder: `"Search and select technicians"`). Options are listed as `"{First} {Last} ({email})"`.
5. Select technicians.
6. Click **`"Save"`** — primary blue button in the modal footer. **This button is disabled until at least one technician is selected.**

---

## WF-SR-10: How to Transition a Service Request Status

**Prerequisites:** Admin role required (`isAdmin` guard on the transition card).

Status path: `New (Pending Approval) → Triaged → Estimated → Approved → Converted to WO → Closed` (or `Rejected`)

1. Open the service request detail page.
2. The **`"Transition to:"`** card appears below the page header **only when there are available transitions AND the logged-in user is admin**.
3. Click the small primary-blue button for the target status.
4. Status updates immediately.

---

## WF-SR-11: How to View Approval Progress

1. Open the service request detail page.
2. Scroll down to the **`"Approval Status"`** card (below the main information card). This card appears **only when the request has an approval workflow attached** (`typedApprovals` exists and has items).
3. A vertical Steps component shows each approver:
   - ✅ Green = Approved
   - ❌ Red = Rejected
   - 🕐 Orange = Awaiting Review (pending)
   - — Grey = Skipped
4. Each step shows the approver's name, status tag, decision date, and comments.

---

## WF-SR-12: How to Search and Filter Service Requests

1. Click **Service Requests** in the sidebar.
2. On **`"All Requests"`** tab:
   - **Search:** Type in the search bar (placeholder: `"Search requests by subject"`).
   - **Status filter:** Click `"Filter by status"` dropdown. Options: New, Approved, Rejected. (Shown only on this tab.)
3. On **`"My Approvals"`** tab: Shows only requests where the logged-in user is the active approver.
4. On **`"Priority Queue"`** tab: Shows all active requests. The `"Priority"` column is an inline editable dropdown — change priority directly in the table.
5. On **`"Flagged Requests"`** tab *(admin only)*: Shows requests marked as spam/duplicate.
6. Pagination is below each table. Total count shown (e.g., `"Total {N} requests"`).
