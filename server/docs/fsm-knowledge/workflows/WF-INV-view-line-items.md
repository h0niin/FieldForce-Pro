# WF-INV-view-line-items — View Invoice Line Items

## Overview
Documents how to view line items on an invoice. Line items are read-only on the Invoice Detail page; there is no create, edit, or delete action for line items in the Invoice UI (no onClick handlers, no modal triggers, no form submissions exist on the line items table in `InvoiceDetailPage.tsx`).

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The sidebar entry for **Invoices** requires permission `invoices:read`.

## Steps

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. Locate the target invoice row and click the **View** icon button (tooltip **"View"**, icon EyeOutlined) in the **Actions** column. The browser navigates to `/invoices/{id}`.
3. Scroll down past the **Invoice Information** card to the card titled **"Line Items"**.
4. The line items table is loaded via `useInvoiceLineItems(id)`. While loading, the table shows a loading indicator.
5. When loaded, the table renders the following columns:

   | Column       | Description                                                                 |
   |--------------|-----------------------------------------------------------------------------|
   | **Type**     | Tag displaying the type value with first letter capitalised                 |
   | **Name**     | Bold text — the line item name                                              |
   | **Description** | Plain text or an em-dash placeholder if empty                            |
   | **Quantity** | Numeric quantity                                                            |
   | **Unit Price** | Currency-formatted using invoice currency                                 |
   | **Tax Rate** | Displayed as `{rate}%`; defaults to `0%` if absent                         |
   | **Discount** | If `discount_type` is `percentage` → `{discount}%`; otherwise currency formatted; em-dash placeholder if no discount |
   | **Total**    | Bold currency-formatted total for this line item                            |

6. The table summary footer (always visible) shows:
   - **Subtotal** (right-aligned label) — invoice subtotal
   - **Tax** (right-aligned label) — invoice tax
   - **Discount** (right-aligned label) — invoice discount preceded by a `-` sign
   - **Total** (right-aligned label, bold, font-size 16) — invoice total

7. When there are no line items, the table empty state displays **"No line items added"**.

## Notes
- Pagination is disabled on this table (`pagination={false}`).
- Data source priority: `lineItems` from `useInvoiceLineItems` hook; falls back to `invoice.line_items` array embedded in the invoice object if the hook returns nothing.
- There is no UI in the Invoice module for adding, editing, or removing individual line items. Any line item management must occur through a different workflow or directly via the API.
