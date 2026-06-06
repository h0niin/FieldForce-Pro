# Invoicing & Payments

## Accessing Invoices

Click **Invoices** in the left sidebar.

## Invoice Statuses

| Status | Meaning |
|--------|---------|
| `Draft` | Created but not sent to customer |
| `Sent` | Emailed/shared with customer |
| `Viewed` | Customer has opened the invoice link |
| `Partially Paid` | At least one payment received, balance remains |
| `Paid` | Fully paid |
| `Overdue` | Past due date, still unpaid |
| `Void` | Cancelled — no longer collectible |

## Creating an Invoice Manually

1. Click **+ New Invoice** (top-right of Invoices page).
2. Select the **Customer / Contact**.
3. Add a **Due Date**.
4. Add line items (see below).
5. Set **Tax Rate** if applicable.
6. Click **Save as Draft** or **Save and Send**.

## Creating an Invoice from a Work Order (recommended)

1. Open the completed work order.
2. Click **Generate Invoice** at the top-right, OR navigate to the **Invoice** tab.
3. The invoice is pre-populated with all line items from the work order.
4. Review and adjust if needed.
5. Click **Save and Send** to send to the customer immediately, or **Save as Draft**.

## Adding Line Items to an Invoice

1. On the invoice detail page, click **+ Add Line Item**.
2. Fill in:
   - **Description** — what is being charged
   - **Type** — `Labour`, `Part`, `Material`, or `Other`
   - **Quantity**
   - **Unit Price**
   - **Tax** — check if this line is taxable
3. Click **Add**. The subtotal and total update automatically.

## Editing or Deleting a Line Item

- Click the **pencil ✏️** icon next to a line item to edit.
- Click the **trash 🗑️** icon to delete.
- Note: line items cannot be edited on `Sent` or `Paid` invoices without voiding first.

## Sending an Invoice to a Customer

1. Open the invoice (in `Draft` status).
2. Click **Send Invoice**.
3. A preview of the email is shown. Adjust the message if needed.
4. Click **Send**. Status changes to `Sent`. The customer receives a link to view and pay.

## Recording a Payment

1. Open the invoice.
2. Click **Record Payment**.
3. Enter:
   - **Amount** — partial or full
   - **Payment Method** — `Cash`, `Cheque`, `Bank Transfer`, `Card`, `Stripe`, etc.
   - **Date** and optional reference number
4. Click **Save**. The invoice status updates to `Partially Paid` or `Paid` automatically.

## Voiding an Invoice

1. Open the invoice.
2. Click **Void Invoice** in the action menu.
3. Enter a reason. Status changes to `Void`.
4. Voided invoices cannot be un-voided. Create a new invoice if needed.

## Estimates

### Creating an Estimate
1. Navigate to **Estimates** in the sidebar or from a work order's **Estimates** tab.
2. Click **+ New Estimate**.
3. Add customer, line items, validity date, and notes.
4. Click **Save as Draft**.

### Sending an Estimate
1. Open the estimate (must be in `Draft`).
2. Click **Send Estimate**. Customer receives a link to view and approve/reject.

### Converting an Estimate to a Work Order
1. When the customer approves (status = `Approved`):
2. Click **Convert to Work Order** on the estimate detail page.
3. A work order is created with all the estimate's line items pre-filled.

## Payment Gateway Integration

FieldForce Pro supports Stripe, Square, and PayPal. To configure:
1. Go to **Settings → Integrations → Payments**.
2. Select your payment provider.
3. Follow the OAuth connection flow.
4. Once connected, the "Pay Now" link in sent invoices will redirect customers to the payment page.
