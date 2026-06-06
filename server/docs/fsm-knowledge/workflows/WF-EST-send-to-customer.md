# WF-EST-send-to-customer — Send an Estimate to the Customer

An estimate can be sent to the customer from two entry points:
(A) the **Send to Customer** panel on the Estimate Detail page (`ApprovalTrackingView`
component), and (B) the **"Send Estimate to Customer"** modal that opens automatically
after all internal approvals are completed on the **Approve / Reject** tab.

In both cases the same three delivery methods are available: WhatsApp, Email, and
Copy Sign Link.

---

## Prerequisites

- For **Entry Point A** (Detail page): estimate status must be one of `draft`, `sent`,
  `viewed`, or `approved` AND either no internal approvals exist or all are completed
  (`internalStage2Unlocked === true`).
- For **Entry Point B** (modal from Approve / Reject tab): triggered automatically
  when the last internal approver clicks **"Approve"** or when **"Send Now"** is
  clicked from the completion alert.
- If internal approvals exist and any are still `PENDING` or `REJECTED`, the
  **Send to Customer** panel is locked and shows an alert; the send buttons are hidden.

---

## Entry Point A — From the Estimate Detail Page

1. Click **"Estimates"** in the sidebar.
2. Navigate to the target estimate by clicking the eye icon (tooltip `"View"`) on any
   tab row, reaching `/estimates/:id`.
3. In the right column, expand the **"Send to Customer"** collapse panel
   (open by default).
4. Proceed to the **Delivery Method** steps below.

## Entry Point B — From the Approve / Reject Tab (after internal review)

1. Click **"Estimates"** in the sidebar.
2. Click the **"Approve / Reject"** tab.
3. After the last approval is processed, click **"Send Now"** in the success alert
   (or the modal opens automatically). The **"Send Estimate to Customer"** modal appears.
4. Proceed to the **Delivery Method** steps below.

---

## Delivery Method: Send via WhatsApp

1. Click **"Send via WhatsApp"** (`WhatsAppOutlined` icon, green button when phone is
   present; disabled with tooltip `"No phone number on record for this customer"` /
   `"No phone number on record"` when absent).
2. A magic sign link is generated.
3. The system opens `https://wa.me/<phone>?text=<pre-filled message>` in a new browser
   tab. The message includes the estimate reference, total, expiry date, and the sign
   link.
4. The modal closes (or `onClose` is called on the list-page modal).

---

## Delivery Method: Send via Email

1. Click **"Send via Email"** (`MailOutlined` icon; disabled with tooltip
   `"No email on record for this customer"` / `"No email on record"` when absent).
2. A magic sign link is generated and the **"Send Estimate via Email"** modal opens:
   - **Title**: `"Send Estimate via Email"` (`MailOutlined` icon).
   - Alert: `"Magic link generated"` / `"Share this link with the customer. No login required."`
   - A read-only **Sign Link** field displays the generated URL.
   - A **"Copy Link"** button (110 px wide, `CopyOutlined` icon) copies the link to
     clipboard with toast `"Link copied"`.
   - Footer button **"Open in Mail App"** (`MailOutlined`, primary) opens the default
     email client (`mailto:`) with pre-filled subject
     `"Estimate <number> — Review & Sign"` and body containing the sign link.
   - Footer button **"Close"** dismisses the modal.

---

## Delivery Method: Copy Sign Link

1. Click **"Copy Sign Link"** (`CopyOutlined` icon).
   - On the **list-page modal**: the link is generated, copied to clipboard, and the
     modal closes. Toast: `"Link copied to clipboard"`.
   - On the **detail page panel**: the button **"Copy Sign Link"** is shown only if
     `estimate.public_token` is set. Click to copy
     `<origin>/estimate/sign/<public_token>` to clipboard.
     Toast: `"Link copied to clipboard"`.

---

## Delivery Method: Skip

Available only in the list-page modal (Entry Point B).

1. Click **"Skip — I'll send it later"** (text button, grey).
2. The modal closes without any delivery action.

---

## Result

The customer receives (or the user holds) a magic link at the path
`/estimate/sign/<token>`. The customer can open this link without logging in,
review the estimate, and apply their digital signature. Upon signature, the backend
auto-transitions the estimate to `approved` and then `converted_to_wo`.
