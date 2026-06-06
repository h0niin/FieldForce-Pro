# WF-COM-edit-company — Edit an Existing Company

## Prerequisites

- User must be authenticated.
- User must have the `companies:update` permission. Without it:
  - On the **CompanyListPage**: the "Edit" icon button (tooltip "Edit", `EditOutlined`) in the Actions column is hidden.
  - On the **CompanyDetailPage**: the **Edit** button in the page header is hidden.

---

## Path A — Edit from the Company List

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads.
3. (Optional) Use the search input — placeholder "Search companies by name, industry, or tax ID" — to locate the company. Results are debounced (500 ms delay); the page resets to page 1 on each new search.
4. Locate the company row in the table.
5. In the **Actions** column, click the icon button with tooltip **Edit** (`EditOutlined` icon, `companies:update` permission required).
6. The router navigates to `/companies/{id}/edit`. Continue from step 5 of Path B below.

---

## Path B — Edit from the Company Detail Page

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads.
3. In the **Actions** column, click the icon button with tooltip **View** (`EyeOutlined` icon, `companies:read` permission required) for the desired company.
4. The router navigates to `/companies/{id}`. The **CompanyDetailPage** loads with the company name as the page title.
5. In the page header, click the **Edit** button (`EditOutlined` icon, `companies:update` permission required).
6. The router navigates to `/companies/{id}/edit`. The **CompanyFormPage** loads with:
   - Page title: **Edit Company**
   - A back arrow navigating to `/companies`.
   - All form fields pre-populated from the existing company record (`name`, `industry`, `billing_address`, `tax_id`, `website`, `notes`).

---

## Editing Steps (shared by both paths, from `/companies/{id}/edit`)

7. Modify any of the following fields in the card:
   - **Company Name** (required) — placeholder "Acme Corporation". Validation message: "Please enter company name".
   - **Industry** (optional) — placeholder "Technology, Healthcare, Manufacturing, etc.".
   - **Tax ID / EIN** (optional) — placeholder "12-3456789".
   - **Website** (optional) — placeholder "https://example.com". Validation message: "Please enter a valid URL".
   - **Billing Address** (optional) — textarea (3 rows); placeholder "123 Main St, City, State, 12345".
   - **Notes** (optional) — textarea (4 rows); placeholder "Additional notes about this company".
8. Click the **Update** button (primary, submits the form). The button shows a loading spinner while `updateCompany.isPending` is true.
   - On success: the mutation resolves, the router navigates to `/companies`, and the company list refreshes.
   - On error: the mutation hook handles the error.
9. Alternatively, click the **Cancel** button to discard changes and navigate to `/companies`.
