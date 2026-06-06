# WF-COM-delete-company — Delete a Company

## Prerequisites

- User must be authenticated.
- User must have the `companies:delete` permission. Without it:
  - On the **CompanyListPage**: the "Delete" icon button (tooltip "Delete", `DeleteOutlined`, danger style) in the Actions column is hidden.
  - On the **CompanyDetailPage**: the **Delete** button in the page header is hidden.

---

## Path A — Delete from the Company List

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads.
3. (Optional) Use the search input — placeholder "Search companies by name, industry, or tax ID" — to locate the company.
4. In the **Actions** column of the target row, click the icon button with tooltip **Delete** (`DeleteOutlined` icon, danger style, `companies:delete` permission required).
5. A confirmation dialog opens with:
   - Title: **Delete Company**
   - Content: `Are you sure you want to delete {company.name}?`
   - Confirm button styled as danger.
6. Click the confirm (danger) button in the dialog.
   - The `deleteCompany.mutateAsync(company.id)` mutation fires.
   - On success: the dialog closes and the company list refreshes (the deleted row disappears).
   - On cancel (clicking outside the dialog or the cancel button): the dialog closes with no change.

---

## Path B — Delete from the Company Detail Page

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads.
3. In the **Actions** column, click the icon button with tooltip **View** (`EyeOutlined` icon, `companies:read` permission required) for the desired company.
4. The router navigates to `/companies/{id}`. The **CompanyDetailPage** loads with the company name as the page title.
5. In the page header, click the **Delete** button (`DeleteOutlined` icon, danger style, `companies:delete` permission required).
6. A confirmation dialog opens with:
   - Title: **Delete Company**
   - Content: `Are you sure you want to delete {company.name}?`
   - Confirm button styled as danger.
7. Click the confirm (danger) button in the dialog.
   - The `deleteCompany.mutateAsync(company.id)` mutation fires.
   - On success: the dialog closes and the router navigates to `/companies`.
   - On cancel: the dialog closes with no change.
