# WF-CON-view-contact-detail — View Contact Detail and History

## Prerequisites

- User must be authenticated.
- User must have the `contacts:read` permission. Without it, the "View" icon button (tooltip "View", `EyeOutlined`) in the Actions column on the list page is hidden.

---

## Steps

1. In the sidebar, click the navigation link that resolves to **nav.contacts** (Contacts).
2. The **ContactListPage** loads. The table displays columns: **Name**, **Email**, **Phone**, **Tags**, **Created**, **Actions**.
3. (Optional) Use the search input — placeholder "Search contacts by name, email, or phone" — to locate the contact. Results are debounced (500 ms delay); the page resets to page 1 on each new search.
4. (Optional) Click the **Name** or **Created** column headers to sort the table ascending/descending.
5. (Optional) Use the pagination controls at the bottom of the table. The pagination footer shows "Total {n} contacts". Use the page-size changer to switch between sizes.
6. In the **Actions** column of the desired row, click the icon button with tooltip **View** (`EyeOutlined`, `contacts:read` permission required).
7. The router navigates to `/contacts/{id}`. The **ContactDetailPage** loads.
   - While data is loading: a `<Skeleton active />` placeholder is shown inside the "Contact Details" card.
   - If the contact is not found: the page shows the title "Contact Not Found" and the text "Contact not found".
8. Once loaded, the page header shows the contact's full name (`{first_name} {last_name}`) and a back arrow.
9. The **Contact Information** card (bordered `Descriptions`, 2 columns) displays the following fields:
   - **First Name**
   - **Last Name**
   - **Email** — rendered as a mailto link with `MailOutlined` icon if present; otherwise "-".
   - **Phone** — rendered as a tel link with `PhoneOutlined` icon if present; otherwise "-".
   - **Address** — rendered with `EnvironmentOutlined` icon if present; otherwise "-".
   - **Tags** — rendered as blue `Tag` components if present; otherwise "No tags".
   - **Created At** — formatted datetime.
   - **Updated At** — formatted datetime.
10. If the contact has `custom_fields` with at least one key, a second card titled **Custom Fields** is displayed below (bordered `Descriptions`, 2 columns), showing each key-value pair serialized via `JSON.stringify`.
11. To return to the list, click the back arrow in the page header. The router navigates to `/contacts`.

---

## Available Actions from the Detail Page

| Action | Button Label / Tooltip | Permission Required | Outcome |
|---|---|---|---|
| Edit contact | **Edit** (`EditOutlined`) | `contacts:update` | Navigates to `/contacts/{id}/edit` |
| Delete contact | **Delete** (`DeleteOutlined`, danger) | `contacts:delete` | Opens confirmation dialog; see WF-CON-delete-contact |
