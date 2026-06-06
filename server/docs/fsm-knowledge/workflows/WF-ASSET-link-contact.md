# WF-ASSET-link-contact

## Action: Link an asset to a contact (customer)

Linking is accomplished through the asset create or edit form. There is no separate dedicated link action; the association is stored in the `contact_id` field on the asset record.

### Prerequisites:
- To link during creation: user must have the permission `assets:create`.
- To link during edit: user must have the permission `assets:update`.
- At least one contact must exist in the system to populate the "Customer (Contact)" dropdown.

### Steps — Link during Create:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Click **Add Asset** (visible only with `assets:create` permission).
3. On the "Create Asset" page, locate the field labeled **Customer (Contact)**.
4. Click the "Customer (Contact)" Select dropdown. Placeholder text: "Select customer".
5. Type characters to trigger search filtering (`optionFilterProp="label"`, `showSearch` enabled). Each option is rendered as "First Last (email)" where email is shown only if present.
6. Click the desired contact option to select it. The contact's UUID is stored as `contact_id` in the form values.
7. To clear the selection, click the clear icon on the dropdown (`allowClear` enabled).
8. Complete the remaining required fields and click **Create** to save.
   - On success, the user is navigated to `/assets`. The asset list displays the linked contact's "First Last" name in the "Customer" column.

### Steps — Link (or re-link) during Edit:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Open the asset via the "Edit" action (tooltip: "Edit", requires `assets:update` permission) from the list, or via the "Edit" button on the detail page.
3. On the "Edit Asset" page, locate the **Customer (Contact)** Select dropdown. It is pre-populated with the currently linked contact (if any).
4. To change the linked contact, click the dropdown, search, and select a new contact.
5. To unlink the contact entirely, click the clear icon (`allowClear` enabled) on the dropdown.
6. Click **Update** to save.
   - On success, the user is navigated to `/assets`.

### How the linked contact is displayed:

- Asset list page, "Customer" column: `{contact.first_name} {contact.last_name}`, or a faded dash if no contact is linked.
- Asset detail page, "Customer" description item: `{contact.first_name} {contact.last_name}`, or a faded dash.
