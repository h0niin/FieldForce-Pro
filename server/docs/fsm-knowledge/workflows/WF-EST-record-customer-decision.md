# WF-EST-record-customer-decision — Record Customer Approve or Reject Decision Manually

When the customer communicates their decision outside of the magic link (e.g., verbally,
by phone), a dispatcher or admin can record the decision directly from the Estimate
Detail page using the **"Record Customer Decision"** section.

---

## Prerequisites

- Estimate must have status `sent` or `viewed`.
- The **"Record Customer Decision"** section is rendered inside the **"Send to Customer"**
  collapse panel (right column of the detail page, `ApprovalTrackingView` component).
- The panel must be unlocked: either no internal approvals exist or all are completed
  (`internalStage2Unlocked === true`).

---

## Record Customer Approval

1. Click **"Estimates"** in the sidebar.
2. Find the estimate in the **"All Estimates"** or **"Pending Review"** tab.
3. Click the eye icon (tooltip `"View"`) to navigate to `/estimates/:id`.
4. In the right column, expand the **"Send to Customer"** panel (open by default).
5. Scroll to the **"Record Customer Decision"** sub-section.
6. Click **"Approved"** (`CheckCircleOutlined` icon, green primary button; this button
   is hidden if `isCustomerSigned` is true, i.e., the customer already signed digitally).
7. A confirmation dialog appears:
   - **Title**: `"Approve Estimate"`
   - **Content**: `"Mark this estimate as approved by the customer?"`
   - **OK button**: `"Approve"`
8. Click **"Approve"** to confirm.

---

## Record Customer Rejection

1–5. Same as Record Customer Approval steps 1–5.
6. Click **"Rejected"** (`CloseCircleOutlined` icon, danger style).
7. The **"Reject Estimate"** modal opens:
   - **Title**: `"Reject Estimate"`
   - Alert: `"This will mark the estimate as rejected"`
   - **Reason for rejection** text area: placeholder
     `"e.g., Price too high, timeline not acceptable..."`
8. Optionally type the rejection reason.
9. Click **"Confirm Rejection"** (danger style OK button) to submit.
   Click `"Cancel"` to discard.

---

## Result

- **Approved**: estimate status transitions to `approved`. The "Record Customer Decision"
  section is replaced by the "Customer Approved" success panel and the
  **"Convert to Work Order"** button.
- **Rejected**: estimate status transitions to `rejected`. The **"Customer Rejected"**
  panel is displayed. The rejection reason (if entered) is stored in
  `custom_fields.rejection_reason` and shown in the panel.
