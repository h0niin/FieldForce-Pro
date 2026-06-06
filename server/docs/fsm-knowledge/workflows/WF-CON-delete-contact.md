# WF-CON-delete-contact — Delete a Contact

## Prerequisites

- User must be authenticated.
- User must have the `contacts:delete` permission. Without it:
  - On the **ContactListPage**: the "Delete" icon button (tooltip "Delete", `DeleteOutlined`, danger style) in the Actions column is hidden.
  - On the **ContactDetailPage**: the **Delete** button in the page header is hidden.

---

## Path A — Delete from the Contact List

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads.
3. (Optional) Use the search input — placeholder "Search contacts by name, email, or phone" — to locate the contact.
4. In the **Actions** column of the target row, click the icon button with tooltip **Delete** (`DeleteOutlined` icon, danger style, `contacts:delete` permission required).
5. A confirmation dialog opens with:
   - Title: **Delete Contact**
   - Content: `Are you sure you want to delete {first_name} {last_name}?`
   - Confirm button styled as danger.
6. Click the confirm (danger) button in the dialog.
   - The `deleteContact.mutateAsync(contact.id)` mutation fires.
   - On success: the dialog closes and the contact list refreshes (the deleted row disappears).
   - On cancel (clicking outside the dialog or the cancel button): the dialog closes with no change.

---

## Path B — Delete from the Contact Detail Page

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads.
3. In the **Actions** column, click the icon button with tooltip **View** (`EyeOutlined` icon, `contacts:read` permission required) for the desired contact.
4. The router navigates to `/contacts/{id}`. The **ContactDetailPage** loads, showing the contact's full name as the page title.
5. In the page header, click the **Delete** button (`DeleteOutlined` icon, danger style, `contacts:delete` permission required).
6. A confirmation dialog opens with:
   - Title: **Delete Contact**
   - Content: `Are you sure you want to delete {first_name} {last_name}?`
   - Confirm button styled as danger.
7. Click the confirm (danger) button in the dialog.
   - The `deleteContact.mutateAsync(contact.id)` mutation fires.
   - On success: the dialog closes and the router navigates to `/contacts`.
   - On cancel: the dialog closes with no change.
