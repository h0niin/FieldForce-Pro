# WF-EST-submit-for-approval — Submit a Draft Estimate for Internal Approval

## Prerequisites

- Estimate must have status `Draft`.
- User must hold the `estimates:update` permission (rendered inside `PermissionGuard`).
- The **"Submit for Approval"** button is only rendered when `estimate.status === 'draft'`.

---

## Steps

1. Click **"Estimates"** in the sidebar.
2. On the list page, click the **"Drafts"** tab.
3. Click the eye icon button (tooltip `"View"`) in the row of the target draft estimate.
   This navigates to `/estimates/:id`.
4. In the right column, locate the card containing the **"Submit for Approval"** button
   (`SendOutlined` icon).
5. Click **"Submit for Approval"**.
6. A confirmation dialog appears:
   - **Title**: `"Submit for Approval"`
   - **Content**: `"Submit this estimate for admin/dispatcher approval?"`
7. Click **"OK"** to confirm.
   Click **"Cancel"** to abort.

---

## Result

- The estimate status transitions from `Draft` → `Pending Approval`.
- The estimate moves off the **Drafts** tab and is visible in the **All Estimates** tab
  (status tag: `Pending Approval` in orange) and in the **Pending Review** tab for
  admin/dispatcher users.
- The **"Submit for Approval"** card disappears from the detail page and the
  **"Pending Approval"** card (with **Approve** / **Reject** buttons) is now rendered.
