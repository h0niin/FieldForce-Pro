# WF-CON-create-contact — Create a New Contact

## Prerequisites

- User must be authenticated (JWT token present).
- User must have the `contacts:create` permission. If this permission is absent, the "Add Contact" button is hidden by `PermissionGuard` and the workflow cannot begin from the list page.

---

## Steps

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads. The page header displays the title "Manage your contacts".
3. Click the **Add Contact** button (top-right of the page header, rendered only when `contacts:create` permission is present).
4. The router navigates to `/contacts/new`. The **ContactFormPage** loads with the page title **Create Contact** and a back arrow.
5. Complete the form fields in the card:
   - **First Name** (required) — plain text input; placeholder "John". Validation message: "Please enter first name".
   - **Last Name** (required) — plain text input; placeholder "Doe". Validation message: "Please enter last name".
   - **Email** (optional) — text input; placeholder "john.doe@example.com". Client-side validation: must be a valid email format; validation message: "Please enter a valid email".
   - **Phone** (optional) — text input; placeholder "+1234567890".
   - **Address** (optional) — textarea (3 rows); placeholder "123 Main St, City, State, 12345".
   - **Tags** (optional) — Select component in `mode="tags"`; placeholder "Add tags (press Enter to add)". User types a value and presses Enter to add each tag.
6. Click the **Create** button (primary, submits the form via `onFinish`). The button shows a loading spinner while `createContact.isPending` is true.
   - On success: the mutation resolves, the router navigates to `/contacts`, and the contact list refreshes.
   - On error: the mutation hook handles the error (no further user action required on this page).
7. Alternatively, click the **Cancel** button to discard the form and navigate back to `/contacts` without saving.
