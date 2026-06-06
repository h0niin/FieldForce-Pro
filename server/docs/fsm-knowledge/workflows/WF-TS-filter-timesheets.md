# WF-TS-filter-timesheets — Filter Timesheets by Search and Status

**Module:** Timesheets
**Source file:** `web/src/pages/timesheets/TimesheetListPage.tsx`

---

## Prerequisites

- User must be authenticated (JWT token present).
- The Timesheets list page (`/timesheets`) must be open.

---

## Filter by Search Text

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the search input with placeholder **Search timesheets...** (width 400, `allowClear` enabled).
3. Type any search term into the field.
4. After a **500 ms debounce**, the table automatically reloads via `useTimesheets({ search })` with the entered term and the page resets to **1**.
5. To clear the search, click the **X** (clear) button inside the search input. The table reloads showing all timesheets.

---

## Filter by Status

1. Click **Timesheets** in the sidebar navigation to open `/timesheets`.
2. Locate the **Filter by status** dropdown (width 180, `allowClear` enabled) to the right of the search input.
3. Click the dropdown and select one of:
   - **Pending**
   - **Approved**
   - **Rejected**
4. The table immediately filters client-side to show only rows whose `status` matches the selected value. No page navigation occurs.
5. To remove the status filter, click the **X** (clear) button inside the dropdown. All rows are shown again.

---

## Combining Search and Status Filter

- Both filters are independent and additive: the search term is sent to the server (API filter), while the status filter is applied client-side on the returned data.
- Set both simultaneously to narrow results further.

---

## Pagination After Filtering

- Changing page or page size via the pagination control at the bottom of the table triggers a new API call.
- The page-size changer (`showSizeChanger: true`) lets the user choose how many rows appear per page.

---

## Notes

- There is no dedicated "date range" filter or "technician" dropdown rendered in this file. Filtering by date or technician is not implemented in `TimesheetListPage.tsx`.
- Status options in code: `pending`, `approved`, `rejected`.
