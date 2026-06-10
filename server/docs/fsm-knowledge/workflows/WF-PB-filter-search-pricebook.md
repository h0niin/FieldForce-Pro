# WF-PB-filter-search-pricebook.md — Filter and Search Pricebook Items

## Overview
This workflow covers all filtering, search, sorting, and pagination actions available on the Pricebook List page.

## Prerequisites
- User must be authenticated and able to reach `/pricebook`. No permission guard wraps the table itself.

---

## Action A — Search by Name or Description

1. Open the **Pricebook** page (its list page title is "Pricebook"). *(Note: Pricebook is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. The Pricebook list page loads with subtitle "Manage tiered pricing for services (Good/Better/Best)".
3. In the search input (placeholder: `Search pricebook items...`, width 400), type the search term.
4. After a 500 ms debounce, the `search` state updates, `page` resets to 1, and the table re-fetches via the `usePricebookItems` hook.
5. The table displays filtered results.
6. To clear the search, click the clear icon (X) on the input (`allowClear` is set) or delete all text.

---

## Action B — Filter by Tier

1. On the Pricebook list page, click the **Filter by tier** dropdown (Select with `allowClear`, width 200).
2. Select one of:
   - **Good**
   - **Better**
   - **Best**
3. The `tierFilter` state updates and `page` resets to 1. The table applies a client-side filter: rows whose `tier` does not match the selection are hidden.
4. To clear the filter, click the clear icon (X) on the Select dropdown.

---

## Action C — Sort by Column

1. Click the **Name** column header to sort pricebook items alphabetically (ascending/descending).
2. Click the **Price** column header to sort by price (ascending/descending).

---

## Action D — Paginate

1. At the bottom of the table, the pagination shows `Total {n} items`.
2. Click page number buttons to navigate between pages.
3. Use the page size changer (showSizeChanger) to change the number of rows per page. Changing page size resets `page` to 1.
