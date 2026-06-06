# WF-COM-create-company — Create a New Company

## Prerequisites

- User must be authenticated.
- User must have the `companies:create` permission. Without it, the **Add Company** button is hidden by `PermissionGuard` and this workflow cannot begin from the list page.

---

## Steps

1. In the sidebar, click the navigation link that resolves to **nav.companies** (Companies).
2. The **CompanyListPage** loads. The page header subtitle reads "Manage your companies".
3. Click the **Add Company** button (top-right of the page header, `PlusOutlined` icon, primary style, rendered only when `companies:create` permission is present).
4. The router navigates to `/companies/new`. The **CompanyFormPage** loads with the page title **Create Company** and a back arrow.
5. Complete the form fields in the card:
   - **Company Name** (required) — plain text input; placeholder "Acme Corporation". Validation message: "Please enter company name".
   - **Industry** (optional) — plain text input; placeholder "Technology, Healthcare, Manufacturing, etc.".
   - **Tax ID / EIN** (optional) — plain text input; placeholder "12-3456789".
   - **Website** (optional) — plain text input; placeholder "https://example.com". Client-side validation: must be a valid URL; validation message: "Please enter a valid URL".
   - **Billing Address** (optional) — textarea (3 rows); placeholder "123 Main St, City, State, 12345".
   - **Notes** (optional) — textarea (4 rows); placeholder "Additional notes about this company".
6. Click the **Create** button (primary, submits the form via `onFinish`). The button shows a loading spinner while `createCompany.isPending` is true.
   - On success: the mutation resolves, the router navigates to `/companies`, and the company list refreshes.
   - On error: the mutation hook handles the error.
7. Alternatively, click the **Cancel** button to discard the form and navigate to `/companies` without saving.
