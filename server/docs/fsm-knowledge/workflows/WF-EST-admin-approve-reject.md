# WF-EST-admin-approve-reject — Admin / Dispatcher Approve or Reject a Pending Estimate

Estimates submitted for approval can be approved or rejected from two locations:
the **Estimate Detail page** (single-record action) and the **Pending Review tab** of
the list page (inline bulk action).

---

## Prerequisites

- Estimate must have status `Pending Approval`.
- User must hold the `estimates:update` permission.
- For the Pending Review tab, the user must be an admin or dispatcher with access to
  the `pending-review` tab data.

---

## Method A — From the Estimate Detail Page

### Approve

1. Click **"Estimates"** in the sidebar.
2. Click the **"Pending Review"** tab (or **"All Estimates"** and filter by status).
3. Click the eye icon (tooltip `"View"`) on the target estimate row. This navigates to
   `/estimates/:id`.
4. In the right column, a card titled **"Pending Approval"** is displayed.
5. Click **"Approve"** (`CheckCircleOutlined` icon, primary style).
6. A confirmation dialog appears:
   - **Title**: `"Approve Estimate"`
   - **Content**: `"Approve this estimate?"`
7. Click **"OK"** to confirm.

### Reject

1–4. Same as Approve steps 1–4.
5. Click **"Reject"** (`CloseCircleOutlined` icon, danger style).
6. A confirmation dialog appears:
   - **Title**: `"Reject Estimate"`
   - **Content**: `"Reject this estimate?"`
7. Click **"OK"** to confirm.
   Click **"Cancel"** to abort.

---

## Method B — From the Pending Review Tab (Inline)

1. Click **"Estimates"** in the sidebar.
2. Click the **"Pending Review"** tab.
3. Locate the target estimate row in the table.
4. The **Actions** column displays three buttons:
   - Eye icon (tooltip `"View"`) — navigates to the detail page.
   - **"Approve"** (`CheckCircleOutlined` icon, primary style).
   - **"Reject"** (`CloseCircleOutlined` icon, danger style).
5. Click **"Approve"** or **"Reject"** as required.
6. A confirmation dialog appears:
   - For **Approve**:
     - **Title**: `"Approve Estimate"`
     - **Content**: `"Approve estimate <estimate_number>?"`
   - For **Reject**:
     - **Title**: `"Reject Estimate"`
     - **Content**: `"Reject estimate <estimate_number>?"`
     - Dialog is danger-styled.
7. Click **"OK"** to confirm, or **"Cancel"** to abort.

---

## Result

- **Approve**: status transitions to `approved` (green tag). The detail page now shows
  the **"Generate Invoice"** button and the **"Convert to Work Order"** button in the
  **Send to Customer** panel.
- **Reject**: status transitions to `rejected` (red tag). The **"Pending Approval"**
  card disappears. The **Send to Customer** panel shows a "Customer Rejected" state.
