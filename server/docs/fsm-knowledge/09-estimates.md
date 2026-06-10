# Estimates

An estimate (also called a quote) is a formal pricing document sent to a customer before work begins. The customer can review, approve, or reject it. An approved estimate can be converted into a work order automatically.

---

## Accessing Estimates

Click **Estimates** in the left sidebar (calculator icon).

## Estimate Status Flow

```
Draft → Sent → Viewed → Approved → Rejected → Expired → Converted to Work Order
```

- **Draft** — created but not yet sent to the customer
- **Sent** — emailed to the customer, awaiting their response
- **Viewed** — customer has opened the estimate link
- **Approved** — customer accepted the pricing
- **Rejected** — customer declined the pricing
- **Expired** — the validity date has passed without a decision
- **Converted to Work Order** — approved estimate has been used to create a work order

---

## Estimate List Page Tabs

| Tab | Shows |
|-----|-------|
| **All Estimates** | Every estimate regardless of status |
| **Drafts** | Estimates not yet sent |
| **Pending Review** | Estimates awaiting internal or customer approval |
| **Approved** | Customer-approved estimates |
| **Rejected** | Customer-rejected estimates |

---

## Creating an Estimate

1. Go to **Estimates** in the sidebar.
2. Click the **Drafts** tab to see the **Create Estimate** button.
3. Click **Create Estimate** (top-right, `+` icon). This opens the estimate form at `/estimates/new`.
4. Fill in the **Client & Reference** section:
   - **Customer / Contact** (required) — search and select an existing contact
   - **Estimate Title** — descriptive name (e.g. "HVAC Annual Maintenance Package")
   - **Scheduled Date** — when the work is planned
   - **Service Location** — the address where work will be performed
5. Fill in the **Estimate Details** section:
   - **Valid Until** (required) — the expiry date (past dates are disabled)
   - **Priority** — Low, Medium, High, or Urgent
   - **Estimate Date** — read-only, set to today automatically
6. Add at least one **line item** (see Adding Line Items below).
7. Optionally add:
   - **Notes** — free text printed on the PDF
   - **Terms & Conditions** — click **Use Default Terms** to insert the standard template
8. Click **Save Draft** to save without sending, or **Save & Send for Review** to immediately send.

**Note:** If you arrive at the estimate form from a Service Request, the customer, title, date, and location are pre-filled automatically, and a banner shows: "Linked to Service Request: [Subject]".

---

## Adding Line Items to an Estimate

Line items are the individual charges (services, parts, travel costs) that make up the estimate total.

1. In the estimate form or detail page, find the **Line Items** card.
2. Click **+ Add Line Item**.
3. Fill in:
   - **Type** — Service, Part, Material, or Travel
   - **Name / Description** — what is being charged
   - **Quantity** — how many units
   - **Unit Price** — price per unit
   - **Tax** — tick the checkbox if tax applies
4. Click **Add**. The subtotal, tax, and total update automatically.
5. To edit a line item, click the **pencil** icon. To remove it, click the **trash** icon.

You can also select items directly from your **Services Catalog** or **Parts Catalog** to auto-fill name, description, and price.

---

## Sending an Estimate to a Customer

1. Open the estimate detail page.
2. Click **Send Estimate** (or use **Save & Send** when creating).
3. A preview of the email is shown. Confirm the recipient email address.
4. Click **Send**. The estimate status changes to `Sent`.
5. The customer receives an email with a link to view and approve the estimate online.

---

## Viewing Estimate Approval Status

- The estimate detail page shows the current status badge at the top.
- The **Approval Status** section shows whether the customer has viewed or responded.
- The **Activity** tab shows a timestamped log of all status changes.

---

## Internal Review (Admin Approve/Reject)

Before an estimate is sent to the customer, it may go through an internal review:

1. On the estimate detail page, look for the **Internal Review** section.
2. An admin or manager can **Approve** or **Reject** the estimate internally.
3. Once internally approved, it can then be sent to the customer.

---

## Recording a Customer's Decision

When the customer responds outside the system (e.g., by phone):

1. Open the estimate detail page.
2. Click **Mark as Approved** or **Mark as Rejected** in the action buttons.
3. The status updates accordingly.

Alternatively, when the customer clicks the link in the estimate email, they can approve or reject it directly, and the system status updates automatically.

---

## Converting an Approved Estimate to a Work Order

1. Open the estimate (status must be **Approved**).
2. Click **Convert to Work Order**.
3. A new work order is created automatically, pre-populated with all estimate details and line items.
4. The estimate status changes to **Converted to Work Order**.
5. You are redirected to the new work order.

---

## Editing an Estimate

- Estimates in **Draft** status can be fully edited.
- Estimates in **Sent** or **Viewed** status can be edited, but a new version will be sent to the customer if you click **Resend**.
- Estimates in **Approved** or **Rejected** status cannot be modified. Void and recreate if changes are needed.

---

## Estimate PDF

- Open the estimate detail page and click **Download PDF** to get a printable PDF of the estimate.
- The PDF includes: estimate number, customer details, line items, subtotal, tax, total, validity date, and terms & conditions.

---

## Customer Signature on Estimates

Some estimates require a customer signature before work begins:

1. On the estimate detail page, click **Request Signature** (if the feature is enabled).
2. The customer receives a link to review the estimate and sign on screen.
3. Once signed, the signature is saved and the estimate is locked.
4. The signature URL is stored in the estimate record.

---

## Linking an Estimate to a Service Request

If the estimate is for a specific service request:
- When creating the estimate from the service request detail page, the link is created automatically.
- This is shown on both the estimate and the service request detail pages.

---

## Filtering and Searching Estimates

- Use the **search bar** to find estimates by title, customer name, or estimate number.
- Use the **Status** filter dropdown to narrow by estimate status.
- Use the tab bar (All, Drafts, Pending Review, Approved, Rejected) to quickly filter.
