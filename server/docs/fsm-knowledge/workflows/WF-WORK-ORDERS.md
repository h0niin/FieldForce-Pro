# Workflow SOPs — Work Orders
**Verified against:** WorkOrderListPage.tsx, WorkOrderDetailPage.tsx, WorkOrderFormPage.tsx
**Audit status:** Code-verified. Steps reference only confirmed JSX elements.

---

## WF-WO-00: How to Convert a Work Order to an Estimate

**Important Note:** In FieldForce Pro, **you cannot convert a Work Order to an Estimate**. The system does not support backward conversion. 
If you need an estimate, you must create the Estimate first, and then convert the Estimate into a Work Order. See **WF-EST-convert-to-work-order.md** for instructions on converting an Estimate to a Work Order.

---

## WF-WO-01: How to Create a Work Order

**Prerequisites:** None. Any authenticated user with `work_orders:create` permission can create a work order.

1. Click **Work Orders** in the left sidebar, under the **"Operations"** section.
2. On the Work Orders list page, click the **`"Create Work Order"`** button — a primary blue button with a **+** icon — in the **top-right corner** of the page header.
3. You land on the Create Work Order form at `/work-orders/new`.
4. Fill in the fields:
   - **`"Summary"`** *(required)* — free-text. Placeholder: `"e.g. HVAC repair at 123 Main St"`
   - **`"Description"`** *(optional)* — multi-line. Placeholder: `"Describe the work to be performed"`
   - **`"Customer (Contact)"`** *(optional)* — searchable select. Placeholder: `"Select customer"`
   - **`"Service Location"`** *(optional)* — searchable select. Placeholder: `"Select location"`
   - **`"Asset"`** *(optional)* — searchable select. Placeholder: `"Select asset"`
   - **`"Priority"`** *(optional)* — select: Low, Medium, High, Urgent. Default: Medium.
   - **`"Category"`** *(optional)* — select: HVAC, Plumbing, Electrical, Appliance, General, Preventive Maintenance, Emergency, Other
   - **`"Scheduled Date"`** *(optional)* — date picker. **This field is locked/disabled if the work order was converted from an estimate.**
5. Click the **`"Create"`** button — primary blue, bottom-right of the form.
6. You are redirected to the new work order's detail page.

---

## WF-WO-02: How to View a Work Order

1. Click **Work Orders** in the left sidebar.
2. On the **`"All Work Orders"`** tab (default), use the search bar (`"Search work orders by summary or WO number"`) or the status/priority dropdowns to find the work order.
3. Click the **eye icon** (EyeOutlined) button in the **`"Actions"`** column on the right side of the row.
   - Alternatively, navigate directly to `/work-orders/{id}`.
4. The work order detail page opens. Six tabs are available: **`"Details"`**, **`"Location"`**, **`"Line Items"`**, **`"Notes"`**, **`"Attachments"`**, **`"Estimates"`**.

---

## WF-WO-03: How to Edit a Work Order

**Prerequisites:** Admin role required (Edit button is admin-only).

1. Navigate to the work order detail page (see WF-WO-02).
2. Click the **`"Edit"`** button (EditOutlined icon) in the **top-right corner** of the page header. This is the second button from the right.
3. The edit form opens at `/work-orders/:id/edit` with all current values pre-filled.
4. Make changes. Note: **`"Scheduled Date"`** is locked and cannot be changed if the WO was converted from an estimate.
5. Click **`"Update"`** — primary blue button, bottom-right of the form.

---

## WF-WO-04: How to Delete a Work Order

**Prerequisites:** Admin role required.

1. Navigate to the work order detail page.
2. Click the **`"Delete"`** button (DeleteOutlined icon, danger/red) in the **top-right corner** of the page header. This is the rightmost button.
3. Confirm in the dialog.

> Alternatively, on the list page in the **`"All Work Orders"`** tab, click the trash icon in the `"Actions"` column (admin only).

---

## WF-WO-05: How to Transition a Work Order Status

**Prerequisites:** The logged-in user must be an admin, or the system must allow the transition.

Work order status chain: `New → Estimated → Approved → Scheduled → In Progress → On Hold → Completed → Closed → Cancelled`

1. Open the work order detail page.
2. Look for the **`"Transition to:"`** card — it appears directly below the page header as a white card with bold label `"Transition to:"` and a row of small primary-blue buttons.
3. This card is only shown when there are valid next statuses available. If no card appears, no transitions are available from the current status.
4. Click the button for the target status (e.g., **`"Approved"`**, **`"Scheduled"`**, **`"Completed"`**).
5. The status updates immediately.

---

## WF-WO-06: How to Assign a Technician to a Work Order

1. Open the work order detail page.
2. Click the **`"Assign Technician"`** button — primary blue, UserAddOutlined icon — in the **top-right corner** of the page header. This is the leftmost header button.
3. A modal titled **`"Assign Technicians"`** appears.
4. In the **`"Technicians"`** field — a multi-select searchable dropdown, placeholder `"Select technicians"` — search for and select one or more technicians.
5. Set **`"Scheduled Start"`** — a date + time picker (required).
6. Set **`"Scheduled End"`** — a date + time picker (required).
7. Click **`"Assign"`** — primary blue button in the modal footer.

---

## WF-WO-07: How to Add a Note to a Work Order

1. Open the work order detail page.
2. Click the **`"Notes"`** tab (the tab with the FileTextOutlined icon and the exact label **`"Notes"`**).
3. In the form at the top of the tab:
   - Fill in the **`"Note"`** field — TextArea, 3 rows, placeholder: `"Write a note..."`
   - Toggle the **Internal/External switch** (no label text, just the switch). Checked = `"Internal"` (staff-only), unchecked = `"External"` (visible to customer).
4. Click **`"Add Note"`** — primary blue button, PlusOutlined icon.
5. The note appears in the table below. To delete it, click the trash icon in the `"Actions"` column.

---

## WF-WO-08: How to Upload an Attachment to a Work Order

1. Open the work order detail page.
2. Click the **`"Attachments"`** tab (PaperClipOutlined icon, exact label **`"Attachments"`**).
3. Click **`"Select File"`** — UploadOutlined icon button — to pick a file from your device.
4. After a file is selected, click **`"Upload"`** — primary blue button, PlusOutlined icon. This button is **disabled until a file is selected**.
5. The file appears in the attachments table. To delete, click the trash icon in the `"Actions"` column.

---

## WF-WO-09: How to Create an Estimate from a Work Order

1. Open the work order detail page.
2. Click the **`"Estimates"`** tab (FileTextOutlined icon, exact label **`"Estimates"`**).
3. Click **`"Create Estimate"`** — primary blue button, PlusOutlined icon — in the **top-right corner of the tab's card header**.
4. You are navigated to `/estimates/new?work_order_id={id}` — the estimate builder pre-linked to this work order.

---

## WF-WO-10: How to Approve an Estimate (from a Work Order)

**Prerequisites:** An estimate must exist in `'draft'` or `'pending_approval'` status.

1. Open the work order detail page.
2. Click the **`"Estimates"`** tab.
3. In the estimates table, find the estimate.
4. If the estimate status is `'draft'` or `'pending_approval'`, two buttons appear in the `"Actions"` column:
   - Click **`"Approve"`** — small, primary blue button, CheckCircleOutlined icon.
5. The estimate status changes to `'approved'`.

---

## WF-WO-11: How to Generate an Invoice from a Work Order

**Prerequisites:** An estimate linked to this work order must be in `'approved'` status.

1. Open the work order detail page.
2. Click the **`"Estimates"`** tab.
3. In the estimates table, find an estimate with **`"approved"`** status.
4. Click **`"Generate Invoice"`** — a small button with FileTextOutlined icon — in the `"Actions"` column.
5. The invoice is created and you are navigated to `/invoices/{new_invoice_id}`.

---

## WF-WO-12: How to Approve a Work Order via an Approval Workflow

**Prerequisites:** An approval workflow must be attached to this work order and the user must be the designated approver.

1. Click **Work Orders** in the left sidebar.
2. Click the **`"Approvals"`** tab (TeamOutlined icon, label **`"Approvals"`**). A yellow badge shows the count of pending approvals.
3. Find the work order in the approvals table.
4. To approve: click the **CheckCircleOutlined icon** button in the `"Actions"` column (primary/blue tint, no text label, tooltip: "Approve").
5. To reject: click the **CloseCircleOutlined icon** button (danger/red, no text label, tooltip: "Reject").
   - A modal appears titled **`"Reject Work Order"`** with an optional reason field (label: `"Reason (optional)"`, placeholder: `"Enter rejection reason..."`). Click **`"Reject"`** (danger) to confirm.

---

## WF-WO-13: How a Technician Accepts and Starts a Job (Technician-only)

**Prerequisites:** The logged-in user must be the technician **specifically assigned** to this work order (`assigned_to` field matches the logged-in user's ID). The Technician Action Card does not appear for anyone else.

**Phase 1 — Status is `'new'`, `'approved'`, or `'estimated'`:**
1. Open the work order detail page. A blue-background card appears near the top of the page (not a tab — it is above the tabs).
2. Click **`"Accept Job"`** — primary blue button, CheckCircleOutlined icon.
3. OR click **`"Decline Job"`** — danger/red button, CloseCircleOutlined icon. A modal titled **`"Decline Job"`** appears. Fill in `"Reason for declining"` (required, min 5 characters, placeholder: `"Enter reason..."`). Click **`"Decline"`**.

**Phase 2 — Status becomes `'scheduled'`:**
1. The card now shows a green **`"Job Accepted"`** tag (read-only, not a button).
2. Click **`"Start Job"`** — primary blue, PlayCircleOutlined icon — to begin work. Status changes to `'in_progress'`.
3. Additional buttons appear alongside (shown when status is `'scheduled'` or `'in_progress'` AND location coordinates exist):
   - **`"Google Maps"`** (CarOutlined) — opens Google Maps directions to the job site
   - **`"Waze"`** (CarOutlined) — opens Waze navigation
   - **`"Call Customer"`** (PhoneOutlined) — shown only when the customer's phone number exists on the contact
   - **`"Start Trip"`** / **`"Stop Trip"`** (EnvironmentOutlined) — toggles trip tracking

**Phase 3 — Status is `'in_progress'`:**
1. Click **`"Complete Job"`** — a button with green background, CheckCircleOutlined icon. Status changes to `'completed'`.

---

## WF-WO-14: How to Search and Filter Work Orders

1. Click **Work Orders** in the sidebar.
2. On the **`"All Work Orders"`** tab:
   - **Search by text**: Type in the search bar (placeholder: `"Search work orders by summary or WO number"`).
   - **Filter by status**: Click the `"Filter by status"` dropdown and select a status.
   - **Filter by priority**: Click the `"Filter by priority"` dropdown and select a priority.
3. Filters are combined — you can filter by status AND priority simultaneously.
4. To clear a filter, click the **×** (clear) button inside the dropdown.
