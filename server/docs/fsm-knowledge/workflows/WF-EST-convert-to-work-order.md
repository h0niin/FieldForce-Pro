# WF-EST-convert-to-work-order — Convert an Approved Estimate to a Work Order

An approved estimate can be converted to a Work Order from two locations on the
Estimate Detail page: the **"Send to Customer"** collapse panel (`ApprovalTrackingView`)
and the main action bar (detail page header area, via `useConvertEstimateToWorkOrder`).

> Note: The backend also auto-converts the estimate to `converted_to_wo` after the
> customer signs via the magic link — this SOP covers the manual conversion path
> available to internal users.

---

## Prerequisites

- Estimate must have status `approved`.
- **"Convert to Work Order"** button is rendered only when `estimate.status === 'approved'`
  inside the **"Send to Customer"** panel of `ApprovalTrackingView`.
- The **"Generate Invoice"** button (see **WF-EST-generate-invoice**) is also available
  at this status in the detail page right column.

---

## Steps

1. Click **"Estimates"** in the sidebar.
2. Locate the approved estimate — it appears in the **"All Estimates"** tab with a
   green `Approved` tag.
3. Click the eye icon (tooltip `"View"`) to navigate to `/estimates/:id`.
4. In the right column, expand the **"Send to Customer"** collapse panel (open by
   default).
5. The panel shows a green "Customer Approved" or "Digitally Signed & Approved" banner.
6. Click **"Convert to Work Order"** (`FileTextOutlined` icon, primary block button,
   height 40 px, bold font weight).
7. The **"Convert to Work Order"** modal opens:
   - **Title**: `"Convert to Work Order"`
   - Alert: `"Convert estimate #<estimate_number> to a Work Order?"`
   - Description: `"A new Work Order will be created. This action cannot be undone."`
   - **OK button**: `"Convert"`
8. Click **"Convert"** to confirm.
   Click `"Cancel"` to abort.

---

## Result

- A new Work Order is created and linked to the estimate.
- The estimate status transitions to `converted_to_wo` (purple tag, label
  `"Converted To Wo"`).
- The **"Send to Customer"** panel now shows the "Converted to Work Order" state:
  `"Successfully converted."`.
- The workflow stepper on the detail page advances to the final step **"Work Order"**.
- No further actions are available on the estimate (all transition buttons are hidden).
