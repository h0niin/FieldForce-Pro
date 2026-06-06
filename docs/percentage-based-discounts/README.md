# Feature: Percentage-based Discounts

Users can now apply discounts as either a fixed amount ($) or a percentage (%) for Estimate, Invoice, and Work Order line items. The totals correctly calculate dynamically based on the selected discount type.

---

## Problem (Before)

The web app only allowed fixed amount discounts on line items:

- The `discount` column in the database was just a numeric value interpreted as a fixed dollar amount.
- Line items lacked a `discount_type` indicator, making it impossible to store or display percentage-based discounts natively.
- The UI assumed all discount inputs were strictly currency subtractions.
- To give a 10% discount, users had to manually calculate the dollar value and input that fixed amount, which would become inaccurate if the line item quantity or unit price changed.

## Solution (After)

Line items now include a `discount_type` field (`ENUM('fixed', 'percentage')` with a default of `'fixed'`). This was implemented across Estimates, Invoices, and proactively to Work Orders to guarantee a flawless transition during auto-invoicing workflows. 

1. **Database Schema**: 
   Added `discount_type` column to `EstimateLineItem`, `InvoiceLineItem`, and `WorkOrderLineItem` entities.
2. **DTOs**: 
   `Create` and `Update` DTOs for all line items now include `discount_type` enum validation.
3. **Frontend Calculation Engine**: 
   The React rendering and calculation logic now checks the `discount_type` field. If `percentage` is selected, the application dynamically calculates the actual discount dollar amount as `(quantity * unit_price) * (discount / 100)`.
4. **Interactive UI**: 
   The line item modal dialog in `EstimateBuilderPage.tsx` was enhanced with a `Select` component for "Discount Type". Switching the type reactively updates the discount input field's prefixes/suffixes (from `$` to `%`) and adjusts the max values and precision dynamically.

---

## Files Changed

### 1. Database Entities (`server/src/*`)
- `ESTIMATE_LINE_ITEMS/estimate_line_items.entity.ts`: Added `discount_type`.
- `INVOICE_LINE_ITEMS/invoice_line_items.entity.ts`: Added `discount_type`.
- `WORK_ORDER_LINE_ITEMS/work_order_line_items.entity.ts`: Added `discount_type`.

### 2. DTOs (`server/src/*/dto/*`)
- `estimate_line_items_create.dto.ts` & `estimate_line_items_update.dto.ts`
- `invoice_line_items_create.dto.ts` & `invoice_line_items_update.dto.ts`
- `work_order_line_items_create.dto.ts` & `work_order_line_items_update.dto.ts`

### 3. Business Logic (`server/src/INVOICES/auto_invoice.service.ts`)
- `auto_invoice.service.ts`: Updated `createInvoiceFromWorkOrder` to accurately copy `discount_type` when migrating data from `WorkOrderLineItems` and `EstimateLineItems` to the new `InvoiceLineItem`.

### 4. Frontend Types & UI (`web/src/*`)
- `types/models.types.ts`: Updated TypeScript interfaces for the three line item objects.
- `pages/estimates/EstimateBuilderPage.tsx`: Added form fields for `discount_type`, dynamically updating `discount` input constraints, and revised line item total mathematical logic.
- `pages/invoices/InvoiceDetailPage.tsx`: Updated table columns to appropriately render `X%` or `$X` based on the item's discount type rather than always outputting dollar-formatted values.

---

## How to Test

### Frontend
1. Open the **Estimates** module and click **Create Estimate**.
2. Click **Add Line Item** (either manual or from the catalog).
3. Look at the new **Discount Type** selector in the modal.
4. Set **Unit Price** to `100`, **Quantity** to `2` (Subtotal = `200`).
5. Select **Percentage (%)** as the discount type.
6. Enter `10` as the discount amount. 
7. Notice the `Discount` input now has a `%` suffix.
8. Click **Save** on the modal.
9. Verify that the line item row displays `10%` in the discount column and the Total computes exactly as `180.00`.
10. Click **Save Estimate**.

### Backend Consistency Check
1. Go to a Work Order that has a Line Item with a percentage discount.
2. Trigger the "Generate Invoice" action.
3. Check the resulting Invoice; verify the line item correctly displays the `discount_type` as `percentage` and the totals accurately reflect the percentage cut.
