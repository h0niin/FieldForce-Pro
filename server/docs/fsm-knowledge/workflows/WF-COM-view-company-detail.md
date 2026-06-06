# WF-COM-view-company-detail — View Company Detail

## Prerequisites

- User must be authenticated.
- User must have the `companies:read` permission. Without it, the "View" icon button (tooltip "View", `EyeOutlined`) in the Actions column on the list page is hidden.

---

## Steps

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads. The table displays columns: **Company Name**, **Industry**, **Tax ID**, **Website**, **Created**, **Actions**.
3. (Optional) Use the search input — placeholder "Search companies by name, industry, or tax ID" — to locate the company. Results are debounced (500 ms delay); the page resets to page 1 on each new search.
4. (Optional) Click the **Company Name** or **Created** column headers to sort the table ascending/descending.
5. (Optional) Use the pagination controls at the bottom of the table. The pagination footer shows "Total {n} companies". Use the page-size changer to switch between sizes.
6. In the **Actions** column of the desired row, click the icon button with tooltip **View** (`EyeOutlined`, `companies:read` permission required).
7. The router navigates to `/companies/{id}`. The **CompanyDetailPage** loads.
   - While data is loading: a `<Skeleton active />` placeholder is shown inside the "Company Details" card.
   - If the company is not found: the page shows the title "Company Not Found" and the text "Company not found".
8. Once loaded, the page header shows the company name and a back arrow.
9. The **Company Information** card (bordered `Descriptions`, 2 columns) displays the following fields:
   - **Company Name** (span 2)
   - **Industry**
   - **Tax ID**
   - **Website** (span 2) — rendered as an external link with `GlobalOutlined` icon (opens in a new tab, `rel="noopener noreferrer"`) if present; otherwise "-".
   - **Billing Address** (span 2)
   - **Notes** (span 2)
   - **Created At** — formatted datetime.
   - **Updated At** — formatted datetime.
10. If the company has `custom_fields` with at least one key, a second card titled **Custom Fields** is displayed below (bordered `Descriptions`, 2 columns), showing each key-value pair serialized via `JSON.stringify`.
11. To return to the list, click the back arrow in the page header. The router navigates to `/companies`.

---

## Available Actions from the Detail Page

| Action | Button Label / Tooltip | Permission Required | Outcome |
|---|---|---|---|
| Edit company | **Edit** (`EditOutlined`) | `companies:update` | Navigates to `/companies/{id}/edit` |
| Delete company | **Delete** (`DeleteOutlined`, danger) | `companies:delete` | Opens confirmation dialog; see WF-COM-delete-company |
