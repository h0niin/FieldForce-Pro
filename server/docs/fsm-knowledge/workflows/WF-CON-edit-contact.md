# WF-CON-edit-contact — Edit an Existing Contact

## Prerequisites

- User must be authenticated.
- User must have the `contacts:update` permission. Without it:
  - On the **ContactListPage**: the "Edit" icon button (tooltip "Edit", `EditOutlined`) in the Actions column is hidden.
  - On the **ContactDetailPage**: the **Edit** button in the page header is hidden.

---

## Path A — Edit from the Contact List

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads.
3. (Optional) Use the search input — placeholder "Search contacts by name, email, or phone" — to locate the contact. Results are debounced (500 ms delay) and the page resets to page 1 on each new search.
4. Locate the contact row in the table.
5. In the **Actions** column, click the icon button with tooltip **Edit** (`EditOutlined` icon, `contacts:update` permission required).
6. The router navigates to `/contacts/{id}/edit`. Continue from step 5 of Path B below.

---

## Path B — Edit from the Contact Detail Page

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads.
3. In the **Actions** column, click the icon button with tooltip **View** (`EyeOutlined` icon, `contacts:read` permission required) for the desired contact.
4. The router navigates to `/contacts/{id}`. The **ContactDetailPage** loads, showing the page title as the contact's full name and a back arrow.
5. In the page header, click the **Edit** button (`EditOutlined` icon, `contacts:update` permission required).
6. The router navigates to `/contacts/{id}/edit`. The **ContactFormPage** loads with:
   - Page title: **Edit Contact**
   - A back arrow navigating to `/contacts`.
   - All form fields pre-populated from the existing contact record (`first_name`, `last_name`, `email`, `phone`, `address`, `tags`).

---

## Editing Steps (shared by both paths, from `/contacts/{id}/edit`)

7. Modify any of the following fields in the card:
   - **First Name** (required) — placeholder "John". Validation message: "Please enter first name".
   - **Last Name** (required) — placeholder "Doe". Validation message: "Please enter last name".
   - **Email** (optional) — placeholder "john.doe@example.com". Validation message: "Please enter a valid email".
   - **Phone** (optional) — placeholder "+1234567890".
   - **Address** (optional) — textarea (3 rows); placeholder "123 Main St, City, State, 12345".
   - **Tags** (optional) — Select `mode="tags"`; placeholder "Add tags (press Enter to add)".
8. Click the **Update** button (primary, submits the form). The button shows a loading spinner while `updateContact.isPending` is true.
   - On success: the mutation resolves, the router navigates to `/contacts`, and the contact list refreshes.
   - On error: the mutation hook handles the error.
9. Alternatively, click the **Cancel** button to discard changes and navigate to `/contacts`.
