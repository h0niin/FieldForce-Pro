# WF-PAY-filter-search-payments.md — Filter and Search Payments

## Overview
This workflow covers all filtering and search actions available on the Payment List page.

## Prerequisites
- User must be authenticated. No specific permission guard wraps the list table itself (the page renders for any authenticated user who can reach `/payments`).

---

## Action A — Search by Transaction ID

1. In the sidebar, click **nav.payments** (Payments navigation link).
2. The Payments list page loads with the title "Manage payments".
3. In the search input (placeholder: `Search payments by transaction ID...`), type the transaction ID or partial string.
4. After a 500 ms debounce, the `search` state updates, `page` resets to 1, and the table re-fetches with the new search term via the `usePayments` hook.
5. The table displays filtered results matching the search term.
6. To clear the search, delete all text from the input.

---

## Action B — Filter by Status

1. On the Payments list page, click the **Filter by status** dropdown (Select with `allowClear`).
2. Select one of:
   - **Pending**
   - **Completed**
   - **Failed**
   - **Refunded**
3. The `statusFilter` state updates. The table applies a client-side filter: rows whose `status` does not match the selected value are hidden.
4. To clear the filter, click the clear icon (X) on the Select dropdown. All statuses are shown again.

---

## Action C — Sort by Column

1. On the Payments list page, click the **Amount** column header to sort ascending/descending by payment amount.
2. Click the **Paid At** column header to sort ascending/descending by payment date (rows with no `paid_at` sort to the bottom when ascending, to the top when descending).

---

## Action D — Paginate

1. At the bottom of the table, the pagination shows `Total {n} payments`.
2. Click page number buttons to navigate between pages.
3. Use the page size changer (showSizeChanger) to select a different number of rows per page. Changing page size resets to page 1.
