# WF-INV-filter-search — Filter and Search Invoices

## Overview
Documents how to search the invoice list by text and filter by status on the Invoice List page.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The sidebar entry for **Invoices** requires permission `invoices:read`.

## Text Search

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. The toolbar area below the page header contains a `SearchFilter` component with placeholder **"Search invoices by number or customer..."**.
3. Type a search term into the search field. The search is debounced — after 500 ms of no further keystrokes the value is committed to the `search` state and `page` is reset to 1.
4. The `useInvoices` hook re-fetches with the updated `search` parameter. The table repopulates with the matching results from the server.
5. To clear the search, delete all text from the field. After 500 ms the search resets and all invoices are shown again.

## Status Filter

1. Navigate to `/invoices` (step 1 above).
2. To the right of the search field, there is a `Select` with placeholder **"Filter by status"** and `allowClear` enabled, width 180 px. The available options are:

   | Option label     | Option value      |
   |------------------|-------------------|
   | **Draft**        | `draft`           |
   | **Sent**         | `sent`            |
   | **Viewed**       | `viewed`          |
   | **Partially Paid**| `partially_paid` |
   | **Paid**         | `paid`            |
   | **Overdue**      | `overdue`         |
   | **Void**         | `void`            |

3. Click the **Filter by status** Select to open the dropdown and click a status option.
4. The table is filtered client-side: only rows whose `status` field exactly matches the selected value are shown. The `meta.itemCount` total displayed in the pagination footer reflects the server-side total, not the filtered count.
5. To clear the status filter, click the clear icon (X) that appears inside the Select when a value is chosen. The `statusFilter` state resets to `undefined` and all server-returned invoices are shown again.

## Combining Search and Status Filter

Text search and status filter operate independently and can be used simultaneously:
- Text search is sent to the server as a query parameter (server-side).
- Status filter is applied client-side on the array returned by the server.
- When combined, the displayed rows must satisfy both conditions.

## Pagination

The table footer shows **"Total {N} invoices"** and supports changing the page size. Controls:
- Page navigation arrows and page number buttons (Ant Design `Table` `pagination`).
- **Show size changer** — change rows per page (default 10).
- Changing the page or page size calls `setPage` / `setPageSize`, which triggers a new server fetch via `useInvoices`.

## Sortable Columns

Two columns support client-side sorting by clicking their header:
- **Total** — sorts ascending/descending by the `total` numeric value.
- **Due Date** — sorts ascending/descending by date; rows with no due date sort last (ascending) or first (descending).
